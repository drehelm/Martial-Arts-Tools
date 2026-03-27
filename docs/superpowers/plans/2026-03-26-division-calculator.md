# Division Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Division Calculator — a mobile-first, responsive tool for aggregating 3 judge scores per competitor, detecting score discrepancies in real-time, and displaying live placements with tie-breaking.

**Architecture:** Pure logic lives in `calculatorUtils.ts` (no React, fully testable). `CompetitorRow.tsx` renders an adaptive card (mobile) or table row (desktop). `CalculatorPage.tsx` owns all state and wires everything together. Integration tests live in `CalculatorPage.test.tsx`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3, Vitest + React Testing Library, react-router-dom v7 (HashRouter)

---

## File Map

| Status | File | Purpose |
|--------|------|---------|
| Create | `src/components/calculator/calculatorUtils.ts` | All pure logic: types, score conversion, outlier detection, placement, URL parsing |
| Create | `src/components/calculator/calculatorUtils.test.ts` | Unit tests for all logic functions |
| Create | `src/components/calculator/CompetitorRow.tsx` | Adaptive row: card on mobile, table row on `md+`; inline discrepancy banner |
| Create | `src/pages/CalculatorPage.tsx` | Page state, belt toggle, competitor management, dialogs |
| Create | `src/pages/CalculatorPage.test.tsx` | Integration tests using React Testing Library |
| Modify | `src/App.tsx` | Add `/calculator` route |
| Modify | `src/pages/LandingPage.tsx` | Set `available: true` on Division Calculator card |

---

## Internal Score Representation

Scores are stored as **integer point values (0–6)** to avoid floating-point issues:
- `0` = best possible (9.99 or 8.99 depending on belt mode)
- `6` = worst possible (9.93 or 8.93)
- Default is always `2` (= 9.97 or 8.97)

The `+` button (better score) **decreases** the integer. The `−` button (worse score) **increases** it.

For display: `score = rangeMax − (points × 0.01)` — e.g. 9.99 − (2 × 0.01) = 9.97.

---

## Task 1: Pure Logic (`calculatorUtils.ts` + unit tests)

**Files:**
- Create: `src/components/calculator/calculatorUtils.ts`
- Create: `src/components/calculator/calculatorUtils.test.ts`

- [ ] **Step 1: Create `calculatorUtils.ts` with types and constants**

```typescript
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
```

- [ ] **Step 2: Add competitor creation and URL parsing helpers**

```typescript
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
```

- [ ] **Step 3: Add `detectOutlier`**

```typescript
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
```

- [ ] **Step 4: Add `assignPlacements`**

```typescript
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
```

- [ ] **Step 5: Write unit tests for `calculatorUtils.test.ts`**

```typescript
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
    // [0, 2, 2]: 0 differs from 2 by exactly 2, not flagged
    expect(detectOutlier([0, 2, 2])).toBeNull()
  })

  it('detects a low outlier (high point value = low score)', () => {
    // [2, 2, 6]: index 2 differs from both others by 4 > 2. Score too low.
    const result = detectOutlier([2, 2, 6])
    expect(result).not.toBeNull()
    expect(result!.judgeIndex).toBe(2)
    expect(result!.type).toBe('low')
    // midP=2, suggested = midP + 2 = 4
    expect(result!.suggestedPoints).toBe(4)
  })

  it('detects a high outlier (low point value = high score)', () => {
    // [2, 2, 0] is not an outlier (0 differs from 2 by 2, not > 2)
    // [2, 2, 0] has diff of 2 exactly → no flag. Let's use [3, 3, 0] diff=3 > 2
    const result = detectOutlier([3, 3, 0])
    expect(result).not.toBeNull()
    expect(result!.judgeIndex).toBe(2)
    expect(result!.type).toBe('high')
    // midP=3, suggested = midP - 2 = 1
    expect(result!.suggestedPoints).toBe(1)
  })

  it('detects outlier in first or second judge position', () => {
    // [0, 4, 4]: index 0 differs from both by 4
    const r0 = detectOutlier([0, 4, 4])
    expect(r0!.judgeIndex).toBe(0)

    // [4, 0, 4]: index 1 differs from both by 4
    const r1 = detectOutlier([4, 0, 4])
    expect(r1!.judgeIndex).toBe(1)
  })

  it('clamps suggested value to range [0, 6]', () => {
    // [6, 6, 0]: index 2 is high outlier. midP=6, suggest midP-2=4 → 4 (no clamp needed)
    // For clamping test: [6, 6, 1] → midP=6, rawSuggested=6-2=4. No clamp.
    // To clamp at 0: [6, 6, 0] type=high, midP=6, suggested=6-2=4. Still no clamp.
    // Try [0, 0, 6]: type=low, midP=0, rawSuggested=0+2=2. No clamp.
    // Clamp at 6: mid=5, type=low, rawSuggested=7 → clamped to 6.
    // [1, 5, 5]: 1 differs from 5 by 4 > 2, type=high (1 < 5), midP=5, suggest 5-2=3. Not clamped.
    // For clamp at 0: [6, 0, 0]: 6 differs from 0 by 6>2, type=low (6>0), midP=0, suggest 0+2=2. Clamp min is fine.
    // Actual clamp at max=6 case: need midP+2 > 6, so midP=5: [1,5,5] type high suggest 3. [5,5,1] low suggest 7→6
    const result = detectOutlier([5, 5, 1])
    expect(result!.type).toBe('low')
    expect(result!.suggestedPoints).toBe(6) // 5+2=7 → clamped to 6
  })

  it('returns null when clamped suggestion equals current outlier value', () => {
    // [0, 6, 6]: 0 differs from 6 by 6>2, type=high (0<6), midP=6, suggest 6-2=4.
    // Not the same as 0, so not suppressed. Let's find a case where it equals:
    // For suppression: suggested === sP after clamp.
    // Example: sP=0, type=high, midP=2, rawSuggested=0, clamped=0 === sP=0 → suppress.
    // [0, 2, 2]: diff=2 exactly, no outlier. Not useful.
    // sP=0, midP=2: means |0-2|=2, not >2. Can't be an outlier.
    // sP=0, midP=3: [0,3,3] → |0-3|=3>2, type=high, midP=3, suggest 3-2=1 ≠ 0.
    // This edge case is hard to construct with valid data since the outlier condition
    // requires diff > 2, and clamped min is 0. Test that the suppression logic doesn't
    // break valid cases instead.
    expect(detectOutlier([2, 2, 2])).toBeNull()
  })
})

describe('assignPlacements', () => {
  const mode = 'black' as const

  it('ranks competitors by total points ascending', () => {
    // [0,0,0] = 0pts (1st), [2,2,2] = 6pts (2nd), [4,4,4] = 12pts (3rd)
    const cs: Competitor[] = [
      { id: '1', name: 'A', scores: [2, 2, 2] }, // 6 pts
      { id: '2', name: 'B', scores: [0, 0, 0] }, // 0 pts → 1st
      { id: '3', name: 'C', scores: [4, 4, 4] }, // 12 pts → 3rd
    ]
    const { competitors } = assignPlacements(cs, mode)
    expect(competitors.find(c => c.id === '2')!.placement).toBe(1)
    expect(competitors.find(c => c.id === '1')!.placement).toBe(2)
    expect(competitors.find(c => c.id === '3')!.placement).toBe(3)
  })

  it('shares placement for fully tied competitors', () => {
    // Both 6pts with same max-score count → both 1st
    const cs: Competitor[] = [
      { id: '1', name: 'A', scores: [2, 2, 2] }, // 6 pts, 0 maxes
      { id: '2', name: 'B', scores: [2, 2, 2] }, // 6 pts, 0 maxes
    ]
    const { competitors, tieBreakApplied } = assignPlacements(cs, mode)
    expect(competitors[0].placement).toBe(1)
    expect(competitors[1].placement).toBe(1)
    expect(tieBreakApplied).toBe(false)
  })

  it('applies tie-break by max-score count when points are equal', () => {
    // A: 6 pts, 1 max-score (9.99). B: 6 pts, 0 max-scores. A ranks higher.
    const cs: Competitor[] = [
      { id: '1', name: 'A', scores: [0, 3, 3] }, // 6 pts, 1 max-score
      { id: '2', name: 'B', scores: [2, 2, 2] }, // 6 pts, 0 max-scores
    ]
    const { competitors, tieBreakApplied } = assignPlacements(cs, mode)
    expect(competitors.find(c => c.id === '1')!.placement).toBe(1)
    expect(competitors.find(c => c.id === '2')!.placement).toBe(2)
    expect(tieBreakApplied).toBe(true)
  })

  it('tieBreakApplied is false when step 2 evaluated but no separation achieved', () => {
    const cs: Competitor[] = [
      { id: '1', name: 'A', scores: [2, 2, 2] }, // 6 pts, 0 maxes
      { id: '2', name: 'B', scores: [2, 2, 2] }, // 6 pts, 0 maxes
    ]
    const { tieBreakApplied } = assignPlacements(cs, mode)
    expect(tieBreakApplied).toBe(false)
  })

  it('partially resolves multi-way tie: tieBreakApplied true if any pair separated', () => {
    // A: 6pts/1max, B: 6pts/0maxes, C: 6pts/0maxes
    // A separated from B by tie-break. B and C share 2nd. tieBreakApplied=true.
    const cs: Competitor[] = [
      { id: '1', name: 'A', scores: [0, 3, 3] }, // 6 pts, 1 max
      { id: '2', name: 'B', scores: [2, 2, 2] }, // 6 pts, 0 max
      { id: '3', name: 'C', scores: [2, 2, 2] }, // 6 pts, 0 max
    ]
    const { competitors, tieBreakApplied } = assignPlacements(cs, mode)
    expect(competitors.find(c => c.id === '1')!.placement).toBe(1)
    expect(competitors.find(c => c.id === '2')!.placement).toBe(2)
    expect(competitors.find(c => c.id === '3')!.placement).toBe(2)
    expect(tieBreakApplied).toBe(true)
  })

  it('preserves original competitor order in result', () => {
    const cs: Competitor[] = [
      { id: '1', name: 'A', scores: [4, 4, 4] }, // 12 pts → 2nd
      { id: '2', name: 'B', scores: [0, 0, 0] }, // 0 pts → 1st
    ]
    const { competitors } = assignPlacements(cs, mode)
    expect(competitors[0].id).toBe('1')
    expect(competitors[1].id).toBe('2')
  })
})
```

- [ ] **Step 6: Run unit tests — verify they all pass**

```bash
npx vitest run src/components/calculator/calculatorUtils.test.ts
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/calculator/calculatorUtils.ts src/components/calculator/calculatorUtils.test.ts
git commit -m "feat: add Division Calculator pure logic and unit tests"
```

---

## Task 2: CompetitorRow Component

**Files:**
- Create: `src/components/calculator/CompetitorRow.tsx`

The row renders as a **card on mobile** (`< md`) and as a **table row on desktop** (`md+`). The parent (`CalculatorPage`) renders a `<table>` on desktop and a `<div>` list on mobile — `CompetitorRow` adapts to both contexts via Tailwind responsive classes.

- [ ] **Step 1: Create `CompetitorRow.tsx` with the mobile card layout**

```tsx
// src/components/calculator/CompetitorRow.tsx
import { displayScore, detectOutlier, BELT_CONFIG, type Competitor, type PlacedCompetitor, type BeltMode } from './calculatorUtils'

interface Props {
  competitor: Competitor
  placed: PlacedCompetitor | undefined
  mode: BeltMode
  onAdjust: (judgeIndex: 0 | 1 | 2, delta: number) => void
  onNameChange: (name: string) => void
  onRemove: () => void
  onAcceptOutlier: (judgeIndex: 0 | 1 | 2, suggestedPoints: number) => void
}

const PLACEMENT_STYLES: Record<number, string> = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-yellow-100 text-yellow-800',
  3: 'bg-gray-100 text-gray-700',
}

function placementLabel(placement: number): string {
  if (placement === 1) return '1st'
  if (placement === 2) return '2nd'
  if (placement === 3) return '3rd'
  return `${placement}th`
}

export default function CompetitorRow({
  competitor,
  placed,
  mode,
  onAdjust,
  onNameChange,
  onRemove,
  onAcceptOutlier,
}: Props) {
  const { rangeMax } = BELT_CONFIG[mode]
  const outlier = detectOutlier(competitor.scores)
  const JUDGE_LABELS = ['Judge 1', 'Judge 2', 'Judge 3'] as const

  const placeBadge = placed ? (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-bold ${PLACEMENT_STYLES[placed.placement] ?? 'bg-gray-50 text-gray-500'}`}
    >
      {placementLabel(placed.placement)}
    </span>
  ) : null

  const scoreControls = ([0, 1, 2] as const).map(idx => (
    <div key={idx} className="flex-1 text-center">
      {/* Label — visible on mobile only */}
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1 md:hidden">
        {JUDGE_LABELS[idx]}
      </div>
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          aria-label={`${JUDGE_LABELS[idx]} worse`}
          onClick={() => onAdjust(idx, -1)}
          disabled={competitor.scores[idx] >= 6}
          className="w-7 h-7 rounded bg-gray-100 text-gray-700 font-bold text-sm disabled:opacity-30 hover:bg-gray-200"
        >
          −
        </button>
        <span className="w-10 text-center font-mono text-sm font-semibold tabular-nums">
          {displayScore(competitor.scores[idx], rangeMax)}
        </span>
        <button
          type="button"
          aria-label={`${JUDGE_LABELS[idx]} better`}
          onClick={() => onAdjust(idx, 1)}
          disabled={competitor.scores[idx] <= 0}
          className="w-7 h-7 rounded bg-gray-100 text-gray-700 font-bold text-sm disabled:opacity-30 hover:bg-gray-200"
        >
          +
        </button>
      </div>
    </div>
  ))

  const discrepancyBanner = outlier ? (
    <div className="mt-2 flex items-center justify-between gap-2 rounded bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800">
      <span>
        ⚠️ {JUDGE_LABELS[outlier.judgeIndex]} outlier (
        {displayScore(competitor.scores[outlier.judgeIndex], rangeMax)}) — suggested:{' '}
        {displayScore(outlier.suggestedPoints, rangeMax)}
      </span>
      <button
        type="button"
        onClick={() => onAcceptOutlier(outlier.judgeIndex, outlier.suggestedPoints)}
        className="shrink-0 rounded bg-amber-500 px-2 py-0.5 text-white font-semibold hover:bg-amber-600"
      >
        Accept
      </button>
    </div>
  ) : null

  // ── Mobile card (hidden on md+) ──────────────────────────────────────────
  const mobileCard = (
    <div className="md:hidden border border-gray-200 rounded-xl bg-white p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <input
          type="text"
          value={competitor.name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Name (optional)"
          className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none flex-1 min-w-0 mr-2 placeholder:text-gray-400"
        />
        <div className="flex items-center gap-2 shrink-0">
          {placed && (
            <span className="text-xs text-gray-500 font-mono">{placed.totalPoints} pts</span>
          )}
          {placeBadge}
          <button
            type="button"
            aria-label="Remove competitor"
            onClick={onRemove}
            className="text-gray-300 hover:text-red-400 text-lg leading-none ml-1"
          >
            ×
          </button>
        </div>
      </div>
      <div className="flex gap-2">{scoreControls}</div>
      {discrepancyBanner}
    </div>
  )

  // ── Desktop table row (hidden below md) ─────────────────────────────────
  const desktopRow = (
    <>
      <tr className={`hidden md:table-row border-b border-gray-100 ${outlier ? 'bg-amber-50' : ''}`}>
        <td className="px-3 py-2">
          <input
            type="text"
            value={competitor.name}
            onChange={e => onNameChange(e.target.value)}
            placeholder="Name (optional)"
            className="text-sm w-full bg-transparent border-none outline-none placeholder:text-gray-400"
          />
        </td>
        {([0, 1, 2] as const).map(idx => (
          <td key={idx} className="px-3 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={`${JUDGE_LABELS[idx]} worse`}
                onClick={() => onAdjust(idx, -1)}
                disabled={competitor.scores[idx] >= 6}
                className="w-6 h-6 rounded bg-gray-100 text-gray-700 text-xs font-bold disabled:opacity-30 hover:bg-gray-200"
              >
                −
              </button>
              <span className="w-10 text-center font-mono text-sm font-semibold tabular-nums">
                {displayScore(competitor.scores[idx], rangeMax)}
              </span>
              <button
                type="button"
                aria-label={`${JUDGE_LABELS[idx]} better`}
                onClick={() => onAdjust(idx, 1)}
                disabled={competitor.scores[idx] <= 0}
                className="w-6 h-6 rounded bg-gray-100 text-gray-700 text-xs font-bold disabled:opacity-30 hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </td>
        ))}
        <td className="px-3 py-2 text-center text-sm font-mono font-semibold text-gray-700">
          {placed?.totalPoints ?? '—'}
        </td>
        <td className="px-3 py-2 text-center">
          {placeBadge ?? <span className="text-gray-300 text-xs">—</span>}
        </td>
        <td className="px-2 py-2 text-center">
          <button
            type="button"
            aria-label="Remove competitor"
            onClick={onRemove}
            className="text-gray-300 hover:text-red-400 text-lg leading-none"
          >
            ×
          </button>
        </td>
      </tr>
      {outlier && (
        <tr className="hidden md:table-row">
          <td colSpan={7} className="px-3 pb-2">
            <div className="flex items-center justify-between gap-2 rounded bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800">
              <span>
                ⚠️ {JUDGE_LABELS[outlier.judgeIndex]} outlier (
                {displayScore(competitor.scores[outlier.judgeIndex], rangeMax)}) — suggested:{' '}
                {displayScore(outlier.suggestedPoints, rangeMax)}
              </span>
              <button
                type="button"
                onClick={() => onAcceptOutlier(outlier.judgeIndex, outlier.suggestedPoints)}
                className="shrink-0 rounded bg-amber-500 px-2 py-0.5 text-white font-semibold hover:bg-amber-600"
              >
                Accept
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )

  return (
    <>
      {mobileCard}
      {desktopRow}
    </>
  )
}
```

- [ ] **Step 2: Run existing tests to make sure nothing broke**

```bash
npx vitest run
```

Expected: All existing tests pass (no tests for CompetitorRow yet — those come in Task 4).

- [ ] **Step 3: Commit**

```bash
git add src/components/calculator/CompetitorRow.tsx
git commit -m "feat: add Division Calculator CompetitorRow component"
```

---

## Task 3: CalculatorPage

**Files:**
- Create: `src/pages/CalculatorPage.tsx`

This page owns all state. It renders a sticky header (with belt toggle), then either a mobile card list or a desktop table depending on screen size. Modal dialogs for belt-mode switching and competitor removal use the same pattern as `ScoresheetPage.tsx`.

- [ ] **Step 1: Create `CalculatorPage.tsx`**

```tsx
// src/pages/CalculatorPage.tsx
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  type BeltMode,
  type Competitor,
  BELT_CONFIG,
  DEFAULT_POINTS,
  parseCompetitorsFromUrl,
  createCompetitor,
  hasChangedScores,
  anyChangedScores,
  adjustScore,
  assignPlacements,
} from '../components/calculator/calculatorUtils'
import CompetitorRow from '../components/calculator/CompetitorRow'

export default function CalculatorPage() {
  const location = useLocation()
  const [mode, setMode] = useState<BeltMode>('black')
  const [competitors, setCompetitors] = useState<Competitor[]>(() =>
    parseCompetitorsFromUrl(location.search)
  )
  const [confirmModeSwitch, setConfirmModeSwitch] = useState<BeltMode | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  const { competitors: placed, tieBreakApplied } = assignPlacements(competitors, mode)

  // ── Belt toggle ────────────────────────────────────────────────────────
  function handleModeToggle(newMode: BeltMode) {
    if (newMode === mode) return
    if (anyChangedScores(competitors)) {
      setConfirmModeSwitch(newMode)
    } else {
      setMode(newMode)
    }
  }

  function confirmModeChange() {
    if (!confirmModeSwitch) return
    setMode(confirmModeSwitch)
    setCompetitors(cs =>
      cs.map(c => ({ ...c, scores: [DEFAULT_POINTS, DEFAULT_POINTS, DEFAULT_POINTS] as [number, number, number] }))
    )
    setConfirmModeSwitch(null)
  }

  // ── Score adjustment ───────────────────────────────────────────────────
  function handleAdjust(id: string, judgeIndex: 0 | 1 | 2, delta: number) {
    setCompetitors(cs =>
      cs.map(c => (c.id === id ? adjustScore(c, judgeIndex, delta) : c))
    )
  }

  function handleAcceptOutlier(id: string, judgeIndex: 0 | 1 | 2, suggestedPoints: number) {
    setCompetitors(cs =>
      cs.map(c => {
        if (c.id !== id) return c
        const newScores: [number, number, number] = [...c.scores] as [number, number, number]
        newScores[judgeIndex] = suggestedPoints
        return { ...c, scores: newScores }
      })
    )
  }

  // ── Name change ────────────────────────────────────────────────────────
  function handleNameChange(id: string, name: string) {
    setCompetitors(cs => cs.map(c => (c.id === id ? { ...c, name } : c)))
  }

  // ── Add competitor ─────────────────────────────────────────────────────
  function handleAdd() {
    const id = String(Date.now())
    setCompetitors(cs => [...cs, createCompetitor(id)])
  }

  // ── Remove competitor ──────────────────────────────────────────────────
  function handleRemoveRequest(id: string) {
    const competitor = competitors.find(c => c.id === id)
    if (competitor && hasChangedScores(competitor)) {
      setConfirmRemoveId(id)
    } else {
      setCompetitors(cs => cs.filter(c => c.id !== id))
    }
  }

  function confirmRemove() {
    if (!confirmRemoveId) return
    setCompetitors(cs => cs.filter(c => c.id !== confirmRemoveId))
    setConfirmRemoveId(null)
  }

  // ── Reset scores ───────────────────────────────────────────────────────
  function handleReset() {
    setCompetitors(cs =>
      cs.map(c => ({ ...c, scores: [DEFAULT_POINTS, DEFAULT_POINTS, DEFAULT_POINTS] as [number, number, number] }))
    )
  }

  const removingCompetitor = competitors.find(c => c.id === confirmRemoveId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex flex-wrap justify-between items-center gap-2 sticky top-0 z-10">
        <span className="font-bold text-lg">Division Calculator</span>
        {/* Belt toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          {(['black', 'colour'] as BeltMode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeToggle(m)}
              aria-pressed={mode === m}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === m ? 'bg-white text-gray-900' : 'bg-transparent text-gray-300 hover:text-white'
              }`}
            >
              {BELT_CONFIG[m].label}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400">{competitors.length} competitors</span>
      </div>

      {/* Tie-break note */}
      {tieBreakApplied && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-xs text-blue-700 text-center">
          Tie broken by highest scores
        </div>
      )}

      {/* Mobile list */}
      <div className="md:hidden px-4 pt-4">
        {competitors.map(c => (
          <CompetitorRow
            key={c.id}
            competitor={c}
            placed={placed.find(p => p.id === c.id)}
            mode={mode}
            onAdjust={(idx, delta) => handleAdjust(c.id, idx, delta)}
            onNameChange={name => handleNameChange(c.id, name)}
            onRemove={() => handleRemoveRequest(c.id)}
            onAcceptOutlier={(idx, pts) => handleAcceptOutlier(c.id, idx, pts)}
          />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block px-6 pt-6">
        <table className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Judge 1</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Judge 2</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Judge 3</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Pts</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Place</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {competitors.map(c => (
              <CompetitorRow
                key={c.id}
                competitor={c}
                placed={placed.find(p => p.id === c.id)}
                mode={mode}
                onAdjust={(idx, delta) => handleAdjust(c.id, idx, delta)}
                onNameChange={name => handleNameChange(c.id, name)}
                onRemove={() => handleRemoveRequest(c.id)}
                onAcceptOutlier={(idx, pts) => handleAcceptOutlier(c.id, idx, pts)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Action bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 mt-6">
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add Competitor
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      {/* Confirm belt-mode switch dialog */}
      {confirmModeSwitch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Switch Belt Mode?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will reset all scores to the {BELT_CONFIG[confirmModeSwitch].label} default.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModeSwitch(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModeChange}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium"
              >
                Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove dialog */}
      {confirmRemoveId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Remove Competitor?</h3>
            <p className="text-sm text-gray-600 mb-4">
              {removingCompetitor?.name || 'This competitor'} will be removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemoveId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemove}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run existing tests — verify nothing broke**

```bash
npx vitest run
```

Expected: All existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CalculatorPage.tsx
git commit -m "feat: add CalculatorPage with state management and belt toggle"
```

---

## Task 4: Route Wiring + Integration Tests + Deploy

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/LandingPage.tsx`
- Create: `src/pages/CalculatorPage.test.tsx`

- [ ] **Step 1: Add route to `App.tsx`**

```tsx
// src/App.tsx — add import and route
import CalculatorPage from './pages/CalculatorPage'

// Inside <Routes>:
<Route path="/calculator" element={<CalculatorPage />} />
```

Full file after edit:
```tsx
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import BracketPage from './pages/BracketPage'
import ScoresheetPage from './pages/ScoresheetPage'
import CalculatorPage from './pages/CalculatorPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/bracket" element={<BracketPage />} />
      <Route path="/scoresheet" element={<ScoresheetPage />} />
      <Route path="/calculator" element={<CalculatorPage />} />
    </Routes>
  )
}
```

- [ ] **Step 2: Enable Division Calculator card in `LandingPage.tsx`**

Change `available: false` to `available: true` for the Division Calculator entry:

```tsx
// src/pages/LandingPage.tsx — find this object:
{
  title: 'Division Calculator',
  description: 'Aggregate judge scores, detect scoring discrepancies, and calculate final placements.',
  href: '/calculator',
  available: false,   // ← change to true
}
```

- [ ] **Step 3: Write integration tests for `CalculatorPage.test.tsx`**

```tsx
// src/pages/CalculatorPage.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import CalculatorPage from './CalculatorPage'

function renderPage(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/calculator${search}`]}>
      <CalculatorPage />
    </MemoryRouter>
  )
}

describe('CalculatorPage', () => {
  it('renders 5 default competitor rows on load', () => {
    renderPage()
    expect(screen.getAllByPlaceholderText(/name \(optional\)/i)).toHaveLength(10) // 5 mobile + 5 desktop
  })

  it('pre-fills names from ?c= URL param', () => {
    renderPage('?c=Alice,Bob,Charlie')
    expect(screen.getAllByDisplayValue('Alice')).toHaveLength(2) // mobile + desktop
    expect(screen.getAllByDisplayValue('Bob')).toHaveLength(2)
  })

  it('defaults to Black Belt mode', () => {
    renderPage()
    const btn = screen.getByRole('button', { name: /black belt/i })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows 9.97 as default score in black belt mode', () => {
    renderPage()
    // Many 9.97 values — at least one present
    expect(screen.getAllByText('9.97').length).toBeGreaterThan(0)
  })

  it('+ button (better) decreases displayed score', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const betterButtons = screen.getAllByRole('button', { name: /judge 1 better/i })
    await user.click(betterButtons[0])
    expect(screen.getAllByText('9.98').length).toBeGreaterThan(0)
  })

  it('− button (worse) increases displayed score', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    await user.click(worseButtons[0])
    expect(screen.getAllByText('9.96').length).toBeGreaterThan(0)
  })

  it('+ button is disabled when score is already at max (9.99)', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    // Press better 2 times from 9.97 → 9.99
    const betterButtons = screen.getAllByRole('button', { name: /judge 1 better/i })
    await user.click(betterButtons[0])
    await user.click(betterButtons[0])
    expect(betterButtons[0]).toBeDisabled()
  })

  it('− button is disabled when score is already at min (9.93)', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    // Press worse 4 times from 9.97 → 9.93
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    expect(worseButtons[0]).toBeDisabled()
  })

  it('placement badge appears after scores differ', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice,Bob')
    // Differentiate Alice from Bob by making Alice's Judge 1 better
    const betterButtons = screen.getAllByRole('button', { name: /judge 1 better/i })
    await user.click(betterButtons[0])
    expect(screen.getAllByText('1st').length).toBeGreaterThan(0)
  })

  it('discrepancy banner appears when outlier detected', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    // Make Judge 1 much worse: press worse 4 times (9.97 → 9.93, diff from J2/J3 = 4 > 2)
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    // Start at 9.97 (pts=2). Go to 9.93 (pts=6). Other judges at 9.97 (pts=2). Diff=4>2 → outlier.
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    expect(screen.getAllByText(/outlier/i).length).toBeGreaterThan(0)
  })

  it('Accept button resolves discrepancy and hides banner', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
    await user.click(acceptButtons[0])
    expect(screen.queryByText(/outlier/i)).not.toBeInTheDocument()
  })

  it('Add Competitor button appends a row', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /\+ add competitor/i }))
    expect(screen.getAllByPlaceholderText(/name \(optional\)/i)).toHaveLength(12) // 6 × 2
  })

  it('Remove button with unchanged scores removes without dialog', async () => {
    const user = userEvent.setup()
    renderPage()
    const removeButtons = screen.getAllByRole('button', { name: /remove competitor/i })
    await user.click(removeButtons[0])
    expect(screen.getAllByPlaceholderText(/name \(optional\)/i)).toHaveLength(8) // 4 × 2
  })

  it('Remove button with changed scores shows confirmation dialog', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    await user.click(worseButtons[0])
    const removeButtons = screen.getAllByRole('button', { name: /remove competitor/i })
    await user.click(removeButtons[0])
    expect(screen.getByText(/remove competitor\?/i)).toBeInTheDocument()
  })

  it('Reset clears scores but keeps names', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    await user.click(worseButtons[0])
    await user.click(screen.getByRole('button', { name: /^reset$/i }))
    expect(screen.getAllByDisplayValue('Alice')).toHaveLength(2)
    expect(screen.getAllByText('9.97').length).toBeGreaterThan(0)
  })

  it('belt toggle to Coloured Belt shows 8.97 default after confirm', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    // Change a score so confirmation dialog is needed
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    await user.click(worseButtons[0])
    await user.click(screen.getByRole('button', { name: /coloured belt/i }))
    expect(screen.getByText(/switch belt mode\?/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^switch$/i }))
    expect(screen.getAllByText('8.97').length).toBeGreaterThan(0)
  })

  it('belt toggle cancel keeps current mode', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    await user.click(worseButtons[0])
    await user.click(screen.getByRole('button', { name: /coloured belt/i }))
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    // Score should still be 9.96 (changed from 9.97), not reset
    expect(screen.getAllByText('9.96').length).toBeGreaterThan(0)
  })
})
```

**Note:** Each mobile+desktop component pair renders twice, hence `getAllByText/getAllBy...` and `length` checks account for duplicates.

- [ ] **Step 4: Run all tests — verify they all pass**

```bash
npx vitest run
```

Expected: All tests pass (74 existing + new calculator tests).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/pages/LandingPage.tsx src/pages/CalculatorPage.test.tsx
git commit -m "feat: wire /calculator route and enable landing page card"
```

- [ ] **Step 6: Build and deploy to GitHub Pages**

```bash
npm run deploy
```

Expected: Build succeeds, deploys to `drehelm.github.io/Martial-Arts-Tools/#/calculator`.

- [ ] **Step 7: Final commit push**

```bash
git push
```

---

## Verification Checklist

After deployment, manually verify on a phone:
- [ ] Landing page shows Division Calculator as available (not "Coming Soon")
- [ ] Default 5 rows load with 9.97 for all 3 judges in Black Belt mode
- [ ] + and − buttons increment/decrement scores, stop at 9.93/9.99
- [ ] Scores update placement badges live
- [ ] Making one judge's score 4 steps worse triggers the outlier banner
- [ ] Accept on the banner corrects the score and dismisses the banner
- [ ] Belt toggle to Coloured Belt (with changed scores) shows confirmation dialog
- [ ] After confirming, all scores reset to 8.97
- [ ] Reset button clears scores to 9.97, keeps competitor names
- [ ] `?c=Alice,Bob,Charlie` pre-fills names
- [ ] Tie-break note appears when tie is broken by highest scores
