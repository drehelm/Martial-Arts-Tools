import type { BracketData } from './bracketUtils'

interface Props {
  data: BracketData
}

export default function BracketSummary({ data }: Props) {
  return (
    <div className="sm:hidden mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 print:hidden">
      <div className="flex justify-around text-center mb-3">
        <div>
          <div className="text-2xl font-black text-gray-900">{data.competitorCount}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Competitors</div>
        </div>
        <div>
          <div className="text-2xl font-black text-gray-900">{data.byeCount}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Byes</div>
        </div>
        <div>
          <div className="text-2xl font-black text-gray-900">{data.rounds.length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Rounds</div>
        </div>
      </div>
      <p className="text-xs text-center text-gray-500">
        Byes are placed at the bottom of Round 1 and advance automatically
      </p>
    </div>
  )
}
