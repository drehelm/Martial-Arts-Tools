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
