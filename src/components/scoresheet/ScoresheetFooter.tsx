interface Props {
  onUpdate: () => void
  onAssignScores: () => void
  onAdd: () => void
  onReset: () => void
}

export default function ScoresheetFooter({ onUpdate, onAssignScores, onAdd, onReset }: Props) {
  return (
    <div className="px-4 py-3 bg-white border-t border-gray-200 flex gap-2">
      <button
        type="button"
        onClick={onUpdate}
        className="flex-1 py-2 rounded bg-blue-600 text-white text-sm font-semibold"
      >
        Update
      </button>
      <button
        type="button"
        onClick={onAssignScores}
        className="flex-1 py-2 rounded bg-green-600 text-white text-sm font-semibold"
      >
        Scores
      </button>
      <button
        type="button"
        onClick={onAdd}
        className="flex-1 py-2 rounded bg-gray-100 text-gray-700 text-sm font-semibold border border-gray-300"
      >
        + Add
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex-1 py-2 rounded bg-red-50 text-red-600 text-sm font-semibold border border-red-200"
      >
        Reset
      </button>
    </div>
  )
}
