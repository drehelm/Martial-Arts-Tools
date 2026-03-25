import type { SlotType } from './bracketUtils'

interface Props {
  type: SlotType
  position: 'top' | 'bottom'
}

export default function BracketSlot({ type, position }: Props) {
  return (
    <div className={`h-7 flex items-center px-2 text-xs text-gray-400 italic${position === 'top' ? ' border-b border-gray-700' : ''}`}>
      {type === 'bye' ? 'BYE' : null}
    </div>
  )
}
