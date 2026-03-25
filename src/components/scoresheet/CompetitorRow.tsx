import type { Competitor } from './scoresheetUtils'
import { formatTicks } from './scoresheetUtils'

interface Props {
  competitor: Competitor
  isActive: boolean
  onTickChange: (delta: number) => void
  onNameChange: (name: string) => void
  onRemove: () => void
}

const statusDot: Record<string, string> = {
  empty: 'bg-gray-300',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
}

export default function CompetitorRow({ competitor, isActive, onTickChange, onNameChange, onRemove }: Props) {
  return (
    <div
      className={`flex items-center px-4 py-3 border-b border-gray-200 gap-3${
        isActive ? ' border-l-4 border-l-blue-500 bg-blue-50' : ''
      }`}
    >
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot[competitor.status]}`} />
      <input
        type="text"
        value={competitor.name}
        onChange={e => onNameChange(e.target.value)}
        placeholder="Name (optional)"
        className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-400 min-w-0"
      />
      <span className="text-sm text-gray-500 min-w-[32px] text-center font-mono shrink-0">
        {formatTicks(competitor.ticks)}
      </span>
      {competitor.score !== undefined && (
        <span className="text-xs font-mono text-gray-400 shrink-0">{competitor.score.toFixed(2)}</span>
      )}
      <button
        type="button"
        onClick={() => onTickChange(-1)}
        disabled={competitor.ticks === 0}
        className="w-8 h-8 rounded border border-gray-300 bg-gray-100 text-gray-700 font-bold text-lg flex items-center justify-center disabled:opacity-30"
        aria-label="Decrease ticks"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => onTickChange(1)}
        className="w-8 h-8 rounded border border-gray-300 bg-gray-100 text-gray-700 font-bold text-lg flex items-center justify-center"
        aria-label="Increase ticks"
      >
        +
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="w-6 h-6 text-gray-400 hover:text-red-500 flex items-center justify-center text-lg leading-none shrink-0"
        aria-label="Remove competitor"
      >
        ×
      </button>
    </div>
  )
}
