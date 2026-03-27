// src/components/calculator/calculatorUtils.test.ts
import { describe, it, expect } from 'vitest'
import {
  displayScore,
  createCompetitor,
  createInitialCompetitors,
  parseCompetitorsFromUrl,
  hasChangedScores,
  anyChangedScores,
  adjustScore,
  detectOutlier,
  assignPlacements,
  DEFAULT_POINTS,
  BELT_CONFIG,
  type Competitor,
} from './calculatorUtils'

describe('displayScore', () => {
  it.each([
    [0, 9.99, '9.99'],
    [1, 9.99, '9.98'],
    [2, 9.99, '9.97'],
    [6, 9.99, '9.93'],
    [0, 8.99, '8.99'],
    [2, 8.99, '8.97'],
    [6, 8.99, '8.93'],
  ])('points=%i rangeMax=%f → %s', (points, rangeMax, expected) => {
    expect(displayScore(points, rangeMax)).toBe(expected)
  })
})

describe('createInitialCompetitors', () => {
  it('returns 5 competitors all with default scores', () => {
    const cs = createInitialCompetitors()
    expect(cs).toHaveLength(5)
    for (const c of cs) {
      expect(c.scores).toEqual([DEFAULT_POINTS, DEFAULT_POINTS, DEFAULT_POINTS])
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

  it('all parsed competitors start with default scores', () => {
    const cs = parseCompetitorsFromUrl('?c=Alice,Bob')
    for (const c of cs) {
      expect(c.scores).toEqual([DEFAULT_POINTS, DEFAULT_POINTS, DEFAULT_POINTS])
    }
  })

  it('trims whitespace from names', () => {
    const cs = parseCompetitorsFromUrl('?c= Alice , Bob ')
    expect(cs[0].name).toBe('Alice')
    expect(cs[1].name).toBe('Bob')
  })

  it('returns 5 defaults when ?c= is empty', () => {
    expect(parseCompetitorsFromUrl('?c=')).toHaveLength(5)
  })
})

describe('hasChangedScores', () => {
  it('returns false when all scores are at default', () => {
    expect(hasChangedScores(createCompetitor('1'))).toBe(false)
  })

  it('returns true when any score differs from default', () => {
    const c: Competitor = { ...createCompetitor('1'), scores: [0, DEFAULT_POINTS, DEFAULT_POINTS] }
    expect(hasChangedScores(c)).toBe(true)
  })
})

describe('anyChangedScores', () => {
  it('returns false for all-default competitors', () => {
    expect(anyChangedScores(createInitialCompetitors())).toBe(false)
  })

  it('returns true when any competitor has a changed score', () => {
    const cs = createInitialCompetitors()
    cs[0] = { ...cs[0], scores: [0, 2, 2] }
    expect(anyChangedScores(cs)).toBe(true)
  })
})

describe('adjustScore', () => {
  it('delta +1 decreases points (better score), clamped to 0', () => {
    const c: Competitor = { ...createCompetitor('1'), scores: [1, 2, 2] }
    expect(adjustScore(c, 0, 1).scores[0]).toBe(0)
    // Already at 0, clamped
    const c2: Competitor = { ...createCompetitor('1'), scores: [0, 2, 2] }
    expect(adjustScore(c2, 0, 1).scores[0]).toBe(0)
  })

  it('delta -1 increases points (worse score), clamped to 6', () => {
    const c: Competitor = { ...createCompetitor('1'), scores: [5, 2, 2] }
    expect(adjustScore(c, 0, -1).scores[0]).toBe(6)
    const c2: Competitor = { ...createCompetitor('1'), scores: [6, 2, 2] }
    expect(adjustScore(c2, 0, -1).scores[0]).toBe(6)
  })

  it('only affects the targeted judge slot', () => {
    const c = createCompetitor('1')
    const result = adjustScore(c, 1, 1)
    expect(result.scores[0]).toBe(DEFAULT_POINTS)
    expect(result.scores[1]).toBe(DEFAULT_POINTS - 1)
    expect(result.scores[2]).toBe(DEFAULT_POINTS)
  })

  it('does not mutate the original competitor', () => {
    const c = createCompetitor('1')
    adjustScore(c, 0, 1)
    expect(c.scores[0]).toBe(DEFAULT_POINTS)
  })
})

describe('detectOutlier', () => {
  it('returns null when all scores are equal', () => {
    expect(detectOutlier([2, 2, 2])).toBeNull()
  })

  it('returns null when scores differ by exactly 2 (not > 2)', () => {
    expect(detectOutlier([0, 2, 2])).toBeNull()
  })

  it('detects a low outlier (high point value = low score)', () => {
    const result = detectOutlier([2, 2, 6])
    expect(result).not.toBeNull()
    expect(result!.judgeIndex).toBe(2)
    expect(result!.type).toBe('low')
    expect(result!.suggestedPoints).toBe(4)
  })

  it('detects a high outlier (low point value = high score)', () => {
    const result = detectOutlier([3, 3, 0])
    expect(result).not.toBeNull()
    expect(result!.judgeIndex).toBe(2)
    expect(result!.type).toBe('high')
    expect(result!.suggestedPoints).toBe(1)
  })

  it('detects outlier in first or second judge position', () => {
    const r0 = detectOutlier([0, 4, 4])
    expect(r0!.judgeIndex).toBe(0)
    const r1 = detectOutlier([4, 0, 4])
    expect(r1!.judgeIndex).toBe(1)
  })

  it('clamps suggested value to range [0, 6]', () => {
    // [5, 5, 1]: pC=1 is the outlier (high score, type='high' since 1 < midP=5)
    // rawSuggested = midP - 2 = 5 - 2 = 3; no clamping needed here
    const result = detectOutlier([5, 5, 1])
    expect(result).not.toBeNull()
    expect(result!.judgeIndex).toBe(2)
    expect(result!.type).toBe('high')
    expect(result!.suggestedPoints).toBe(3)
    // Verify low-path clamping: [3, 0, 0] → pA=3 is outlier (low score, type='low')
    // rawSuggested = midP + 2 = 0 + 2 = 2; clamped to max(0,min(6,2)) = 2
    const result2 = detectOutlier([3, 0, 0])
    expect(result2).not.toBeNull()
    expect(result2!.type).toBe('low')
    expect(result2!.suggestedPoints).toBe(2)
  })

  it('returns null when clamped suggestion equals current outlier value (fallback)', () => {
    expect(detectOutlier([2, 2, 2])).toBeNull()
  })
})

describe('assignPlacements', () => {
  const mode = 'black' as const

  it('ranks competitors by total points ascending', () => {
    const cs: Competitor[] = [
      { id: '1', name: 'A', scores: [2, 2, 2] },
      { id: '2', name: 'B', scores: [0, 0, 0] },
      { id: '3', name: 'C', scores: [4, 4, 4] },
    ]
    const { competitors } = assignPlacements(cs, mode)
    expect(competitors.find(c => c.id === '2')!.placement).toBe(1)
    expect(competitors.find(c => c.id === '1')!.placement).toBe(2)
    expect(competitors.find(c => c.id === '3')!.placement).toBe(3)
  })

  it('shares placement for fully tied competitors', () => {
    const cs: Competitor[] = [
      { id: '1', name: 'A', scores: [2, 2, 2] },
      { id: '2', name: 'B', scores: [2, 2, 2] },
    ]
    const { competitors, tieBreakApplied } = assignPlacements(cs, mode)
    expect(competitors[0].placement).toBe(1)
    expect(competitors[1].placement).toBe(1)
    expect(tieBreakApplied).toBe(false)
  })

  it('applies tie-break by max-score count when points are equal', () => {
    const cs: Competitor[] = [
      { id: '1', name: 'A', scores: [0, 3, 3] },
      { id: '2', name: 'B', scores: [2, 2, 2] },
    ]
    const { competitors, tieBreakApplied } = assignPlacements(cs, mode)
    expect(competitors.find(c => c.id === '1')!.placement).toBe(1)
    expect(competitors.find(c => c.id === '2')!.placement).toBe(2)
    expect(tieBreakApplied).toBe(true)
  })

  it('tieBreakApplied is false when step 2 evaluated but no separation achieved', () => {
    const cs: Competitor[] = [
      { id: '1', name: 'A', scores: [2, 2, 2] },
      { id: '2', name: 'B', scores: [2, 2, 2] },
    ]
    const { tieBreakApplied } = assignPlacements(cs, mode)
    expect(tieBreakApplied).toBe(false)
  })

  it('partially resolves multi-way tie: tieBreakApplied true if any pair separated', () => {
    const cs: Competitor[] = [
      { id: '1', name: 'A', scores: [0, 3, 3] },
      { id: '2', name: 'B', scores: [2, 2, 2] },
      { id: '3', name: 'C', scores: [2, 2, 2] },
    ]
    const { competitors, tieBreakApplied } = assignPlacements(cs, mode)
    expect(competitors.find(c => c.id === '1')!.placement).toBe(1)
    expect(competitors.find(c => c.id === '2')!.placement).toBe(2)
    expect(competitors.find(c => c.id === '3')!.placement).toBe(2)
    expect(tieBreakApplied).toBe(true)
  })

  it('preserves original competitor order in result', () => {
    const cs: Competitor[] = [
      { id: '1', name: 'A', scores: [4, 4, 4] },
      { id: '2', name: 'B', scores: [0, 0, 0] },
    ]
    const { competitors } = assignPlacements(cs, mode)
    expect(competitors[0].id).toBe('1')
    expect(competitors[1].id).toBe('2')
  })
})
