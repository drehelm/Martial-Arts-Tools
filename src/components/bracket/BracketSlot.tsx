import type { SlotType } from './bracketUtils'

interface Props {
  type: SlotType
}

export default function BracketSlot({ type }: Props) {
  return (
    <div className="h-7 border-b border-gray-800 flex items-center px-2 text-xs text-gray-400 italic">
      {type === 'bye' ? 'BYE' : null}
    </div>
  )
}
