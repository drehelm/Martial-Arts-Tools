export type Status = 'empty' | 'blue' | 'green'

export interface Competitor {
  id: string
  name: string
  ticks: number
  status: Status
  score?: number
}

export function createCompetitor(id: string): Competitor {
  return { id, name: '', ticks: 0, status: 'empty' }
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
  return names.map((name, i) => ({ id: String(i + 1), name, ticks: 0, status: 'empty' as Status }))
}

// ticks is the rank number: 1 = 1st place, 2 = 2nd, etc. 0 = not yet ranked.
// Status transitions: 0→1 sets blue, back to 0 sets empty, otherwise keep current status.
export function applyTickChange(competitors: Competitor[], id: string, delta: number): Competitor[] {
  return competitors.map(c => {
    if (c.id !== id) return c
    const newTicks = Math.max(0, c.ticks + delta)
    let status: Status = c.status
    if (c.ticks === 0 && newTicks > 0) status = 'blue'
    else if (newTicks === 0) status = 'empty'
    return { ...c, ticks: newTicks, status }
  })
}

export function setTicks(competitors: Competitor[], id: string, ticks: number): Competitor[] {
  return competitors.map(c => {
    if (c.id !== id) return c
    const status: Status = ticks === 0 ? 'empty' : 'blue'
    return { ...c, ticks, status }
  })
}

export function getMaxTicks(competitors: Competitor[]): number {
  return Math.max(0, ...competitors.map(c => c.ticks))
}

// Insert a competitor at desiredRank, pushing others at the same rank or lower down by 1.
export function insertAtRank(competitors: Competitor[], id: string, desiredRank: number): Competitor[] {
  let updated = competitors.map(c => {
    if (c.id !== id && c.ticks >= desiredRank) {
      return { ...c, ticks: c.ticks + 1 }
    }
    return c
  })
  updated = updated.map(c => {
    if (c.id === id) {
      return { ...c, ticks: desiredRank, status: 'green' as Status }
    }
    return c
  })
  return updated
}

// Finalize blue competitors: resolve rank conflicts via insertAtRank, then set them green.
// Also clears any existing scores (scores must be reassigned after updating).
export function updateStatuses(competitors: Competitor[]): Competitor[] {
  let updated: Competitor[] = competitors.map(c => ({ ...c, score: undefined }))
  const blueComps = updated.filter(c => c.status === 'blue' && c.ticks > 0)
  blueComps.sort((a, b) => a.ticks - b.ticks)
  for (const blueComp of blueComps) {
    updated = insertAtRank(updated, blueComp.id, blueComp.ticks)
  }
  return updated
}

export function rankToScore(rank: number): number {
  const scores = [9.99, 9.98, 9.97, 9.96, 9.95, 9.95, 9.94, 9.94]
  if (rank <= scores.length) return scores[rank - 1]
  return 9.93
}

// Assign scores: ticks directly maps to rank (1 tick = 1st = 9.99).
// Competitors with 0 ticks (unranked) get no score.
// Implicitly finalizes any remaining blue competitors first.
export function assignScores(competitors: Competitor[]): Competitor[] {
  let updated = competitors
  const blueComps = updated.filter(c => c.status === 'blue' && c.ticks > 0)
  if (blueComps.length > 0) {
    updated = updated.map(c => ({ ...c, score: undefined }))
    const sorted = [...blueComps].sort((a, b) => a.ticks - b.ticks)
    for (const blueComp of sorted) {
      updated = insertAtRank(updated, blueComp.id, blueComp.ticks)
    }
  }
  return updated.map(c => ({
    ...c,
    score: c.ticks > 0 && (c.status === 'blue' || c.status === 'green')
      ? rankToScore(c.ticks)
      : undefined,
  }))
}

export function formatTicks(ticks: number): string {
  return ticks === 0 ? '—' : '✓'.repeat(ticks)
}
