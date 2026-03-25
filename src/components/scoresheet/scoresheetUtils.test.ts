import { describe, it, expect } from 'vitest'
import {
  createCompetitor,
  createInitialCompetitors,
  parseCompetitorsFromUrl,
  applyTickChange,
  setTicks,
  getMaxTicks,
  updateStatuses,
  insertAtRank,
  rankToScore,
  assignScores,
  formatTicks,
} from './scoresheetUtils'

describe('createInitialCompetitors', () => {
  it('returns 5 competitors all with 0 ticks and empty status', () => {
    const cs = createInitialCompetitors()
    expect(cs).toHaveLength(5)
    for (const c of cs) {
      expect(c.ticks).toBe(0)
      expect(c.status).toBe('empty')
      expect(c.name).toBe('')
    }
  })
})

describe('parseCompetitorsFromUrl', () => {
  it('returns 5 defaults when no ?c= param', () => {
    expect(parseCompetitorsFromUrl('')).toHaveLength(5)
  })

  it('parses comma-separated names', () => {
    const cs = parseCompetitorsFromUrl('?c=Alice,Bob,Charlie')
    expect(cs).toHaveLength(3)
    expect(cs[0].name).toBe('Alice')
    expect(cs[1].name).toBe('Bob')
    expect(cs[2].name).toBe('Charlie')
  })

  it('all parsed competitors start with 0 ticks and empty status', () => {
    const cs = parseCompetitorsFromUrl('?c=Alice,Bob')
    for (const c of cs) {
      expect(c.ticks).toBe(0)
      expect(c.status).toBe('empty')
    }
  })

  it('trims whitespace from names', () => {
    const cs = parseCompetitorsFromUrl('?c= Alice , Bob ')
    expect(cs[0].name).toBe('Alice')
    expect(cs[1].name).toBe('Bob')
  })

  it('returns 5 defaults when ?c= is empty string', () => {
    expect(parseCompetitorsFromUrl('?c=')).toHaveLength(5)
  })
})

describe('applyTickChange', () => {
  it('going from 0 to 1 tick sets status to blue', () => {
    const cs = [createCompetitor('1')]
    const result = applyTickChange(cs, '1', 1)
    expect(result[0].ticks).toBe(1)
    expect(result[0].status).toBe('blue')
  })

  it('going from 1 to 2 ticks keeps status blue', () => {
    const cs = [{ ...createCompetitor('1'), ticks: 1, status: 'blue' as const }]
    const result = applyTickChange(cs, '1', 1)
    expect(result[0].ticks).toBe(2)
    expect(result[0].status).toBe('blue')
  })

  it('going back to 0 ticks sets status to empty', () => {
    const cs = [{ ...createCompetitor('1'), ticks: 1, status: 'blue' as const }]
    const result = applyTickChange(cs, '1', -1)
    expect(result[0].ticks).toBe(0)
    expect(result[0].status).toBe('empty')
  })

  it('does not decrease below 0', () => {
    const cs = [createCompetitor('1')]
    const result = applyTickChange(cs, '1', -1)
    expect(result[0].ticks).toBe(0)
  })

  it('only changes the targeted competitor', () => {
    const cs = [createCompetitor('1'), createCompetitor('2')]
    const result = applyTickChange(cs, '1', 1)
    expect(result[1].ticks).toBe(0)
    expect(result[1].status).toBe('empty')
  })
})

describe('setTicks', () => {
  it('sets non-zero ticks and sets status to blue', () => {
    const cs = [createCompetitor('1')]
    const result = setTicks(cs, '1', 3)
    expect(result[0].ticks).toBe(3)
    expect(result[0].status).toBe('blue')
  })

  it('setting ticks to 0 sets status to empty', () => {
    const cs = [{ ...createCompetitor('1'), ticks: 2, status: 'blue' as const }]
    const result = setTicks(cs, '1', 0)
    expect(result[0].ticks).toBe(0)
    expect(result[0].status).toBe('empty')
  })

  it('only changes the targeted competitor', () => {
    const cs = [createCompetitor('1'), createCompetitor('2')]
    const result = setTicks(cs, '1', 2)
    expect(result[1].ticks).toBe(0)
  })
})

describe('getMaxTicks', () => {
  it('returns max ticks across all competitors', () => {
    const cs = [
      { ...createCompetitor('1'), ticks: 2 },
      { ...createCompetitor('2'), ticks: 5 },
      { ...createCompetitor('3'), ticks: 1 },
    ]
    expect(getMaxTicks(cs)).toBe(5)
  })

  it('returns 0 when all competitors have 0 ticks', () => {
    expect(getMaxTicks(createInitialCompetitors())).toBe(0)
  })
})

describe('insertAtRank', () => {
  it('sets target competitor to desiredRank and status green', () => {
    const cs = [createCompetitor('1')]
    const result = insertAtRank(cs, '1', 2)
    expect(result[0].ticks).toBe(2)
    expect(result[0].status).toBe('green')
  })

  it('pushes other competitors at the same rank up by 1', () => {
    const cs = [
      { ...createCompetitor('1'), ticks: 2, status: 'green' as const },
      { ...createCompetitor('2'), ticks: 0, status: 'blue' as const },
    ]
    // Insert comp2 at rank 2: comp1 (already at 2) should shift to 3
    const result = insertAtRank(cs, '2', 2)
    expect(result.find(c => c.id === '1')?.ticks).toBe(3)
    expect(result.find(c => c.id === '2')?.ticks).toBe(2)
    expect(result.find(c => c.id === '2')?.status).toBe('green')
  })

  it('does not push competitors with ticks below desiredRank', () => {
    const cs = [
      { ...createCompetitor('1'), ticks: 1, status: 'green' as const },
      { ...createCompetitor('2'), ticks: 0, status: 'blue' as const },
    ]
    // Insert comp2 at rank 3: comp1 (at 1) should not shift
    const result = insertAtRank(cs, '2', 3)
    expect(result.find(c => c.id === '1')?.ticks).toBe(1)
  })
})

describe('updateStatuses', () => {
  it('finalizes blue competitors to green using insertAtRank', () => {
    const cs = [
      { ...createCompetitor('1'), ticks: 1, status: 'blue' as const },
      { ...createCompetitor('2'), ticks: 0, status: 'empty' as const },
    ]
    const result = updateStatuses(cs)
    expect(result.find(c => c.id === '1')?.status).toBe('green')
    expect(result.find(c => c.id === '2')?.status).toBe('empty')
  })

  it('clears existing scores', () => {
    const cs = [
      { ...createCompetitor('1'), ticks: 1, status: 'blue' as const, score: 9.99 },
    ]
    const result = updateStatuses(cs)
    expect(result[0].score).toBeUndefined()
  })

  it('leaves empty competitors unchanged', () => {
    const cs = createInitialCompetitors()
    const result = updateStatuses(cs)
    for (const c of result) {
      expect(c.status).toBe('empty')
    }
  })
})

describe('rankToScore', () => {
  it.each([
    [1, 9.99],
    [2, 9.98],
    [3, 9.97],
    [4, 9.96],
    [5, 9.95],
    [6, 9.95],
    [7, 9.94],
    [8, 9.94],
    [9, 9.93],
    [25, 9.93],
  ])('rank %i → score %f', (rank, score) => {
    expect(rankToScore(rank)).toBe(score)
  })
})

describe('assignScores', () => {
  it('assigns 9.99 to competitor with 1 tick (1st place)', () => {
    const cs = [
      { ...createCompetitor('1'), ticks: 1, status: 'green' as const },
      { ...createCompetitor('2'), ticks: 2, status: 'green' as const },
    ]
    const result = assignScores(cs)
    expect(result.find(c => c.id === '1')?.score).toBe(9.99)
    expect(result.find(c => c.id === '2')?.score).toBe(9.98)
  })

  it('does not assign score to competitors with 0 ticks (unranked)', () => {
    const cs = [
      { ...createCompetitor('1'), ticks: 1, status: 'green' as const },
      { ...createCompetitor('2'), ticks: 0, status: 'empty' as const },
    ]
    const result = assignScores(cs)
    expect(result.find(c => c.id === '2')?.score).toBeUndefined()
  })

  it('does not mutate original array', () => {
    const cs = [{ ...createCompetitor('1'), ticks: 1, status: 'green' as const }]
    const result = assignScores(cs)
    expect(cs[0].score).toBeUndefined()
    expect(result[0].score).toBeDefined()
  })

  it('finalizes blue competitors before scoring', () => {
    const cs = [
      { ...createCompetitor('1'), ticks: 1, status: 'blue' as const },
    ]
    const result = assignScores(cs)
    expect(result[0].status).toBe('green')
    expect(result[0].score).toBe(9.99)
  })
})

describe('formatTicks', () => {
  it('returns em-dash for 0 ticks', () => {
    expect(formatTicks(0)).toBe('—')
  })

  it('returns one checkmark per tick', () => {
    expect(formatTicks(1)).toBe('✓')
    expect(formatTicks(3)).toBe('✓✓✓')
  })
})
