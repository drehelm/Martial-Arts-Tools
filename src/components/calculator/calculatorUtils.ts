// src/components/calculator/calculatorUtils.ts

export type BeltMode = 'black' | 'colour'

export const BELT_CONFIG = {
  black: { rangeMax: 9.99, label: 'Black Belt' },
  colour: { rangeMax: 8.99, label: 'Coloured Belt' },
} as const

// Scores stored as integer point values: 0 (best/rangeMax) to 6 (worst/rangeMin).
// Default is always 2 (9.97 black belt, 8.97 coloured belt).
export const DEFAULT_POINTS = 2

export interface Competitor {
  id: string
  name: string
  scores: [number, number, number] // integer point values 0-6
}

export interface PlacedCompetitor extends Competitor {
  totalPoints: number
  placement: number
}

export interface OutlierResult {
  judgeIndex: 0 | 1 | 2
  type: 'high' | 'low'
  suggestedPoints: number
}

export interface PlacementResult {
  competitors: PlacedCompetitor[]
  tieBreakApplied: boolean
}

export function displayScore(points: number, rangeMax: number): string {
  return (rangeMax - points * 0.01).toFixed(2)
}

export function createCompetitor(id: string): Competitor {
  return { id, name: '', scores: [DEFAULT_POINTS, DEFAULT_POINTS, DEFAULT_POINTS] }
}

export function createInitialCompetitors(): Competitor[] {
  return Array.from({ length: 5 }, (_, i) => createCompetitor(String(i + 1)))
}

export function parseCompetitorsFromUrl(search: string): Competitor[] {
  const params = new URLSearchParams(search)
  const c = params.get('c')
  if (!c || c.trim() === '') return createInitialCompetitors()
  const names = c.split(',').map(n => n.trim()).filter(Boolean)
  if (names.length === 0) return createInitialCompetitors()
  return names.map((name, i) => ({ ...createCompetitor(String(i + 1)), name }))
}

export function hasChangedScores(competitor: Competitor): boolean {
  return competitor.scores.some(s => s !== DEFAULT_POINTS)
}

export function anyChangedScores(competitors: Competitor[]): boolean {
  return competitors.some(hasChangedScores)
}

// delta: +1 = better score (points decrease), -1 = worse score (points increase)
export function adjustScore(
  competitor: Competitor,
  judgeIndex: 0 | 1 | 2,
  delta: number
): Competitor {
  const newPoints = Math.max(0, Math.min(6, competitor.scores[judgeIndex] - delta))
  const newScores: [number, number, number] = [...competitor.scores] as [number, number, number]
  newScores[judgeIndex] = newPoints
  return { ...competitor, scores: newScores }
}

// Returns null if no outlier, or if the suggested correction would be a no-op.
// All logic operates on integer point values (0-6).
export function detectOutlier(scores: [number, number, number]): OutlierResult | null {
  const [pA, pB, pC] = scores

  function check(sP: number, aP: number, bP: number, idx: 0 | 1 | 2): OutlierResult | null {
    if (Math.abs(sP - aP) > 2 && Math.abs(sP - bP) > 2) {
      const sorted = [sP, aP, bP].sort((a, b) => a - b)
      const midP = sorted[1]
      const type: 'high' | 'low' = sP < midP ? 'high' : 'low'
      const rawSuggested = type === 'high' ? midP - 2 : midP + 2
      const suggestedPoints = Math.max(0, Math.min(6, rawSuggested))
      if (suggestedPoints === sP) return null
      return { judgeIndex: idx, type, suggestedPoints }
    }
    return null
  }

  return check(pA, pB, pC, 0) ?? check(pB, pA, pC, 1) ?? check(pC, pA, pB, 2) ?? null
}

export function assignPlacements(competitors: Competitor[], mode: BeltMode): PlacementResult {
  const { rangeMax } = BELT_CONFIG[mode]

  // Count of scores at the best possible value (0 points)
  const maxScoreCount = (c: Competitor) => c.scores.filter(s => s === 0).length

  const withPoints = competitors.map(c => ({
    ...c,
    totalPoints: c.scores.reduce((sum, s) => sum + s, 0),
  }))

  // Sort: ascending by totalPoints, then descending by count of max-scores (tie-break)
  const sorted = [...withPoints].sort((a, b) => {
    if (a.totalPoints !== b.totalPoints) return a.totalPoints - b.totalPoints
    return maxScoreCount(b) - maxScoreCount(a)
  })

  let tieBreakApplied = false
  const placed: PlacedCompetitor[] = []

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i]
    if (i === 0) {
      placed.push({ ...curr, placement: 1 })
      continue
    }
    const prev = sorted[i - 1]
    if (curr.totalPoints !== prev.totalPoints) {
      // Different points: new placement
      placed.push({ ...curr, placement: i + 1 })
    } else if (maxScoreCount(curr) !== maxScoreCount(prev)) {
      // Same points, different max-score count: tie-break separated them
      tieBreakApplied = true
      placed.push({ ...curr, placement: i + 1 })
    } else {
      // Fully tied: share previous placement
      placed.push({ ...curr, placement: placed[i - 1].placement })
    }
  }

  // Restore original order
  const result = competitors.map(c => placed.find(p => p.id === c.id)!)

  // Suppress rangeMax usage warning (rangeMax unused since scores are already integer points)
  void rangeMax

  return { competitors: result, tieBreakApplied }
}
