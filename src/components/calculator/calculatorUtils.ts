// src/components/calculator/calculatorUtils.ts

export type BeltMode = 'black' | 'colour'

export const BELT_CONFIG = {
  black: { rangeMax: 9.99, label: 'Black Belt' },
  colour: { rangeMax: 8.99, label: 'Coloured Belt' },
} as const

// Scores stored as integer point values: 0 (best/rangeMax) to 9 (worst/rangeMin).
// Range: black belt 9.90–9.99, coloured belt 8.90–8.99 (CKKA rules).
// Default is always 2 (9.97 black belt, 8.97 coloured belt).
export const POINTS_MAX = 9
export const DEFAULT_POINTS = 2

export interface Competitor {
  id: string
  name: string
  scores: [number, number, number] // integer point values 0-9
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
  const newPoints = Math.max(0, Math.min(POINTS_MAX, competitor.scores[judgeIndex] - delta))
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
      const suggestedPoints = Math.max(0, Math.min(POINTS_MAX, rawSuggested))
      if (suggestedPoints === sP) return null
      return { judgeIndex: idx, type, suggestedPoints }
    }
    return null
  }

  return check(pA, pB, pC, 0) ?? check(pB, pA, pC, 1) ?? check(pC, pA, pB, 2) ?? null
}

// CKKA tie-breaking comparator (pairwise, applied in order):
// 1. Total points (lower = better)
// 2. Judge winner comparison: count how many judges preferred each competitor
// 3. Highest middle score (middle of 3 scores sorted ascending; lower points = better)
// 4. Remove best score: compare sum of remaining two after dropping lowest-point score
// 5. Remove worst score: compare sum of remaining two after dropping highest-point score
// 6. Fully tied (re-do in practice)
type WithPoints = Competitor & { totalPoints: number }

function ckkaCompare(a: WithPoints, b: WithPoints): number {
  if (a.totalPoints !== b.totalPoints) return a.totalPoints - b.totalPoints

  // Step 2: judge winner comparison
  let aWins = 0, bWins = 0
  for (let i = 0; i < 3; i++) {
    if (a.scores[i] < b.scores[i]) aWins++
    else if (b.scores[i] < a.scores[i]) bWins++
  }
  if (aWins !== bWins) return bWins - aWins // more judge wins = better placement

  // Step 3: highest middle score (lower points = better score)
  const midA = [...a.scores].sort((x, y) => x - y)[1]
  const midB = [...b.scores].sort((x, y) => x - y)[1]
  if (midA !== midB) return midA - midB

  // Step 4: remove best score (drop the lowest-point score, compare remaining sum)
  const removeHighA = a.totalPoints - Math.min(...a.scores)
  const removeHighB = b.totalPoints - Math.min(...b.scores)
  if (removeHighA !== removeHighB) return removeHighA - removeHighB

  // Step 5: remove worst score (drop the highest-point score, compare remaining sum)
  const removeLowA = a.totalPoints - Math.max(...a.scores)
  const removeLowB = b.totalPoints - Math.max(...b.scores)
  if (removeLowA !== removeLowB) return removeLowA - removeLowB

  return 0 // fully tied
}

export function assignPlacements(competitors: Competitor[], _mode: BeltMode): PlacementResult {
  const withPoints: WithPoints[] = competitors.map(c => ({
    ...c,
    totalPoints: c.scores.reduce((sum, s) => sum + s, 0),
  }))

  const sorted = [...withPoints].sort(ckkaCompare)

  let tieBreakApplied = false
  const placed: PlacedCompetitor[] = []

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      placed.push({ ...sorted[i], placement: 1 })
      continue
    }
    const prev = sorted[i - 1]
    const curr = sorted[i]
    if (ckkaCompare(curr, prev) === 0) {
      // Fully tied after all steps: share placement
      placed.push({ ...curr, placement: placed[i - 1].placement })
    } else if (curr.totalPoints !== prev.totalPoints) {
      // Separated by total points alone
      placed.push({ ...curr, placement: i + 1 })
    } else {
      // Same total points, separated by CKKA tie-break
      tieBreakApplied = true
      placed.push({ ...curr, placement: i + 1 })
    }
  }

  const result = competitors.map(c => placed.find(p => p.id === c.id)!)
  return { competitors: result, tieBreakApplied }
}
