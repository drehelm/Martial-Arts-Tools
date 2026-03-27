# Division Calculator — Design Spec

**Date:** 2026-03-26
**Status:** Approved

---

## Overview

A mobile-first, responsive tool for aggregating 3 judge scores per competitor, detecting scoring discrepancies in real-time, and displaying live placements. Used at tournaments by a score keeper on a phone or laptop/tablet.

---

## Architecture

Five files, consistent with the Ref Scoresheet pattern:

| File | Responsibility |
|------|---------------|
| `src/components/calculator/calculatorUtils.ts` | Pure logic: score↔points conversion, outlier detection, placement calculation, tie-breaking |
| `src/components/calculator/CompetitorRow.tsx` | Adaptive row: card on mobile (`< md`), table row on desktop (`md+`). Inline discrepancy banner. |
| `src/pages/CalculatorPage.tsx` | Page-level state, competitor list, URL param parsing, add/remove/reset |
| `src/components/calculator/calculatorUtils.test.ts` | Unit tests for all pure logic functions |
| `src/pages/CalculatorPage.test.tsx` | Integration tests using React Testing Library |

Route: `/#/calculator` — **engineer must add** this route to `App.tsx` and set `available: true` on the existing Division Calculator entry in `LandingPage.tsx` (the entry already exists as `available: false`).

---

## Belt Grade Toggle

A toggle at the top of the page switches the score range:

- **Black Belt** (default): scores range **9.93–9.99**, default score `9.97`
- **Coloured Belt / Kyu**: scores range **8.93–8.99**, default score `8.97`

The points mapping is identical in both modes — only the leading digit differs. All score display, +/− controls, outlier detection, and placement logic use the active range.

**Switching modes mid-session**: if any individual judge score (across all competitors, all 3 judge slots) differs from the current mode's default value (`9.97` for black belt, `8.97` for coloured belt), show a confirmation dialog before switching. On **confirm**, reset all scores to the new mode's default and clear any discrepancy flags — names and competitor count are preserved. This reset is silent (no animation or flash). On **cancel**, the toggle reverts to its previous position; no scores change. If no scores have been changed (all at default), switch silently with no dialog.

---

## Score Entry

Each competitor has 3 score slots — one per judge.

- **Default value**: middle of the active range (`9.97` for black belt, `8.97` for coloured belt)
- **Step**: 0.01
- **Controls**: +/− buttons (clamped to range min/max)
- **Display**: 2 decimal places (e.g. `9.97`)
- Scores are the only values shown to the scorer; points are a background calculation

### Floating-Point Handling

Score values must be stored and compared as integers internally to avoid floating-point precision errors. Represent each score as an integer step count from the range **maximum**:

```
scoreToPoints(score, rangeMax) = Math.round((rangeMax - score) * 100)
```

This gives `9.99 → 0 pts` and `9.93 → 6 pts`, matching the points mapping table. The 7 valid step values are 0–6. Points total is always an integer in the range 0–18.

---

## Discrepancy Detection

Runs on every render for every competitor — there is no "set" trigger. Three identical default scores (e.g. `[2, 2, 2]` points) never produce an outlier, so no banner appears on initial load.

All outlier logic operates on **integer point values** (consistent with the floating-point handling model). Point values are 0–6, where 0 = best (range max) and 6 = worst (range min).

### Outlier Rule
A score is an outlier if its point value differs from **both** other point values by more than 2:

```
isOutlier(sP, aP, bP) = abs(sP - aP) > 2 AND abs(sP - bP) > 2
```

### High vs Low Outlier
Point values increase as scores decrease (0 = best score, 6 = worst). For the outlier:
- **High-score outlier** (judge gave too high a score): `sP < midP` (outlier's points are below median — score is better than both others)
- **Low-score outlier** (judge gave too low a score): `sP > midP` (outlier's points are above median — score is worse than both others)

Where `midP` is the median of the 3 point values (the middle value when sorted).

### Suggestion
- **High-score outlier**: suggest point value `midP - 2` (clamped to min 0)
- **Low-score outlier**: suggest point value `midP + 2` (clamped to max 6)

After clamping, if the suggested point value equals the outlier's current point value (i.e. no change would result from accepting), `detectOutlier` returns `null` — the suppression is handled inside the function, not by the caller. The UI simply checks `detectOutlier(...) !== null` to decide whether to show the banner.

Display the suggestion as a score: `rangeMax - (suggestedPoints × 0.01)`, formatted to 2 decimal places. `rangeMax` is `9.99` in black belt mode and `8.99` in coloured belt mode — always derived from the active belt mode, never hardcoded.

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

Total points = sum of the 3 judges' points. Lower total = better placement. Points are displayed as a plain integer (e.g. `7`) with no label indicating direction — the scorer is expected to know the system. No "lower is better" annotation is needed in the UI.

### Tie-Breaking

1. Sort ascending by total points
2. On a tie: count each competitor's scores that equal the **range maximum** (`9.99` or `8.99`). The competitor with the higher count ranks higher.
3. If still tied after tie-break, competitors share the same placement (e.g. both show "2nd")
4. The page-level note _"Tie broken by highest scores"_ is shown if step 2 **actually changed** at least one pair's relative order — i.e. two competitors with equal total points were ranked differently because of differing max-score counts. If step 2 was evaluated but produced no separation (both tied competitors also have the same max-score count → step 3 shared placement), the note is **not** shown. Partial resolution of a multi-way tie (A separated from B and C by step 2; B and C remain shared at step 3) still counts as step-2 separation — show the note.

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
- **Remove**: × button per row; confirmation dialog if any of that competitor's scores differ from the current mode's default value
- **Reset**: clears all scores back to the current mode's default (9.97 or 8.97); **keeps names and competitor count**. No confirmation dialog — this intentional asymmetry with Remove is by design (Reset is non-destructive to names; Remove is permanent).
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
- `scoreToPoints(score, rangeMax)` — all 7 point values (0–6), both belt modes
- `detectOutlier(pA, pB, pC)` — returns `{ judgeIndex: 0|1|2, type: 'high'|'low', suggestedPoints: number } | null`. Covers: outlier present, no outlier, edge case (exactly 2 apart = not flagged)
- `suggestCorrection` (via `detectOutlier`) — high-score outlier, low-score outlier, suggestion clamped at boundary
- `assignPlacements` — basic ranking, tie-break applied, tied placement shared (both show "2nd")
- `tieBreak` — counts of max-value scores compared correctly; partial resolution of multi-way tie

Integration tests (React Testing Library):
- Belt toggle switches score range and default values
- +/− buttons increment/decrement within range bounds
- Discrepancy banner appears when outlier detected, disappears after Accept
- URL `?c=` param pre-fills competitor names
- Placement badges update live as scores change
