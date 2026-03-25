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

export function applyTickChange(competitors: Competitor[], id: string, delta: number): Competitor[] {
  return competitors.map(c =>
    c.id === id
      ? { ...c, ticks: Math.max(0, c.ticks + delta), status: 'blue' as Status }
      : c
  )
}

export function setTicks(competitors: Competitor[], id: string, ticks: number): Competitor[] {
  return competitors.map(c =>
    c.id === id ? { ...c, ticks, status: 'blue' as Status } : c
  )
}

export function getMaxTicks(competitors: Competitor[]): number {
  return Math.max(0, ...competitors.map(c => c.ticks))
}

export function updateStatuses(competitors: Competitor[]): Competitor[] {
  return competitors.map(c =>
    c.status === 'blue' ? { ...c, status: 'green' as Status } : c
  )
}

export function rankToScore(rank: number): number {
  const scores = [9.99, 9.98, 9.97, 9.96, 9.95, 9.95, 9.94, 9.94]
  if (rank <= scores.length) return scores[rank - 1]
  return 9.93
}

export function computeRanks(competitors: Competitor[]): Map<string, number> {
  const sorted = [...competitors].sort((a, b) => a.ticks - b.ticks)
  const map = new Map<string, number>()
  sorted.forEach((c, i) => map.set(c.id, i + 1))
  return map
}

export function assignScores(competitors: Competitor[]): Competitor[] {
  const ranks = computeRanks(competitors)
  return competitors.map(c => ({ ...c, score: rankToScore(ranks.get(c.id)!) }))
}

export function formatTicks(ticks: number): string {
  return ticks === 0 ? '—' : '✓'.repeat(ticks)
}
