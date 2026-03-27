# Division Calculator — Design Spec

**Date:** 2026-03-26
**Status:** Approved

---

## Overview

A mobile-first, responsive tool for aggregating 3 judge scores per competitor, detecting scoring discrepancies in real-time, and displaying live placements. Used at tournaments by a score keeper on a phone or laptop/tablet.

---

## Architecture

Four files, consistent with the Ref Scoresheet pattern:

| File | Responsibility |
|------|---------------|
| `src/components/calculator/calculatorUtils.ts` | Pure logic: score↔points conversion, outlier detection, placement calculation, tie-breaking |
| `src/components/calculator/CompetitorRow.tsx` | Adaptive row: card on mobile (`< md`), table row on desktop (`md+`). Inline discrepancy banner. |
| `src/pages/CalculatorPage.tsx` | Page-level state, competitor list, URL param parsing, add/remove/reset |
| `src/components/calculator/calculatorUtils.test.ts` | Unit tests for all logic functions |

Route: `/#/calculator` (already registered in `App.tsx` and `LandingPage.tsx` as `available: false` — set to `true` on completion).

---

## Belt Grade Toggle

A toggle at the top of the page switches the score range for the entire session:

- **Black Belt** (default): scores range **9.93–9.99**
- **Coloured Belt / Kyu**: scores range **8.93–8.99**

The points mapping is identical in both modes — only the leading digit differs. All score display, +/− controls, outlier detection, and placement logic use the active range.

---

## Score Entry

Each competitor has 3 score slots — one per judge.

- **Default value**: middle of the active range (`9.97` for black belt, `8.97` for coloured belt)
- **Step**: 0.01
- **Controls**: +/− buttons (clamped to range min/max)
- **Display**: 2 decimal places (e.g. `9.97`)
- Scores are the only values shown to the scorer; points are a background calculation

---

## Discrepancy Detection

Runs automatically as soon as all 3 scores for a competitor are set.

### Outlier Rule
A score is an outlier if it differs from **both** other scores by more than `0.02`.

```
isOutlier(s, a, b) = abs(s - a) > 0.02 AND abs(s - b) > 0.02
```

### Suggestion
- **High outlier** (score too high relative to others): suggest `mid + 0.02`
- **Low outlier** (score too low relative to others): suggest `mid - 0.02`

Where `mid` is the median of the 3 scores (the middle value when sorted).

### UI
An amber inline banner appears below the score row:

> ⚠️ Judge 1 outlier (9.93) — suggested: 9.95 · **[Accept]**

Tapping **Accept** replaces the outlier score with the suggested value. The banner disappears. No audit trail in this version.

---

## Placement Calculation

Placements update live whenever any score changes. No "Calculate" button.

### Points Mapping

```
9.99 (or 8.99) → 0 pts
9.98 (or 8.98) → 1 pt
9.97 (or 8.97) → 2 pts
9.96 (or 8.96) → 3 pts
9.95 (or 8.95) → 4 pts
9.94 (or 8.94) → 5 pts
9.93 (or 8.93) → 6 pts
```

Total points = sum of the 3 judges' points. Lower total = better placement.

### Tie-Breaking

1. Sort ascending by total points
2. On a tie: the competitor with more top-value individual scores (e.g. more 9.99s) ranks higher
3. If still tied after tie-break, competitors share the placement (e.g. both show "2nd")
4. A small note appears when tie-break is applied: _"Tie broken by highest scores"_

### Incomplete Scores

Competitors with all 3 scores at the default value are treated as scored. Competitors are always included in placement. (No "incomplete" state — the scorer adjusts scores from the default.)

### Placement Badges

| Place | Color |
|-------|-------|
| 1st | Green (`bg-green-100 text-green-800`) |
| 2nd | Yellow (`bg-yellow-100 text-yellow-800`) |
| 3rd | Gray (`bg-gray-100 text-gray-700`) |
| 4th+ | Neutral |

---

## Competitor Management

- **Default**: 5 unnamed competitors on load
- **Add**: "+ Add Competitor" button appended at bottom
- **Remove**: × button per row; confirmation dialog if any score has been changed from the default
- **Reset**: clears all scores back to the range default (9.97/8.97), keeps names and competitor count
- **URL pre-fill**: `/#/calculator?c=Alice,Bob,Carol` — names parsed from `?c=` param on mount, same pattern as Ref Scoresheet

---

## Layout (Adaptive)

### Mobile (`< md`)
Each competitor renders as a **card**:
```
┌─────────────────────────────────────┐
│ Alice                          7 pts │
│                                 1st  │
│  [JUDGE 1]  [JUDGE 2]  [JUDGE 3]    │
│   − 9.97 +   − 9.97 +   − 9.96 +   │
│ ⚠️ [discrepancy banner if flagged]  │
└─────────────────────────────────────┘
```

### Desktop (`md+`)
Competitors render as **table rows** with a sticky header:
```
Name   │ Judge 1    │ Judge 2    │ Judge 3    │ Pts │ Place
───────┼────────────┼────────────┼────────────┼─────┼──────
Alice  │ − 9.97 +   │ − 9.97 +   │ − 9.96 +   │  7  │  1st
Bob ⚠️ │ − 9.93 +   │ − 9.97 +   │ − 9.96 +   │  9  │  2nd
```
Discrepancy banner spans full width below the flagged row.

---

## Testing

Unit tests cover:
- `scoreToPoints` — all 7 score values, both belt modes
- `detectOutlier` — outlier present, no outlier, edge cases (exactly 0.02 apart = not an outlier)
- `suggestCorrection` — high outlier, low outlier
- `assignPlacements` — basic ranking, tie-break applied, tied placement shared
- `tieBreak` — counts of top scores compared correctly

Integration tests (React Testing Library):
- Belt toggle switches score range and default values
- +/− buttons increment/decrement within range bounds
- Discrepancy banner appears when outlier detected, disappears after Accept
- URL `?c=` param pre-fills competitor names
- Placement badges update live as scores change
