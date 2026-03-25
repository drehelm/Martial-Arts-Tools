interface Props {
  activeId: string | null
  onRank: (ticks: number) => void
  onMax: () => void
}

const RANKS: [string, number][] = [
  ['1st', 1],
  ['2nd', 2],
  ['3rd', 3],
  ['4th', 4],
]

export default function DirectRankPanel({ activeId, onRank, onMax }: Props) {
  const disabled = !activeId

  return (
    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
      <div className="text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">
        {disabled ? 'Direct rank — tap +/− to select' : 'Direct rank → applying to selected'}
      </div>
      <div className="flex gap-2">
        {RANKS.map(([label, ticks]) => (
          <button
            key={label}
            type="button"
            disabled={disabled}
            onClick={() => onRank(ticks)}
            className="flex-1 py-2 rounded border border-gray-300 bg-white text-sm font-semibold text-gray-700 disabled:opacity-30"
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={onMax}
          className="flex-1 py-2 rounded border border-gray-300 bg-white text-sm font-semibold text-gray-700 disabled:opacity-30"
        >
          Max
        </button>
      </div>
    </div>
  )
}
