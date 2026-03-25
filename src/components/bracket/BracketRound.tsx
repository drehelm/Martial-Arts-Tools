import type { Match } from './bracketUtils'
import BracketSlot from './BracketSlot'

interface Props {
  label: string
  matches: Match[]
}

export default function BracketRound({ label, matches }: Props) {
  return (
    <div className="flex flex-col flex-1 min-w-[140px]">
      {/* Round label */}
      <div className="text-center text-[9px] font-bold uppercase tracking-widest text-gray-400 pb-2 shrink-0">
        {label}
      </div>
      {/* Matches */}
      <div className="flex flex-col flex-1">
        {matches.map((match, i) => (
          <div key={i} className="flex flex-col flex-1 justify-center px-2 py-1">
            <div className="border border-gray-700 rounded overflow-hidden">
              <BracketSlot type={match.top.type} position="top" />
              <BracketSlot type={match.bottom.type} position="bottom" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
