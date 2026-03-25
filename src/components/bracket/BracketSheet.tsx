import type { BracketData } from './bracketUtils'
import BracketRound from './BracketRound'
import BracketConnector from './BracketConnector'
import WinnersPanel from './WinnersPanel'
import BracketFooter from './BracketFooter'

interface Props {
  data: BracketData
  date: string
  division: string
}

export default function BracketSheet({ data, date, division }: Props) {
  return (
    <div
      id="bracket-sheet"
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none print:rounded-none print:p-4"
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-3 mb-4 border-b-2 border-gray-900">
        <div>
          <div className="text-lg font-black tracking-wide text-gray-900">
            Martial Arts Referee Association
          </div>
          <div className="text-[9px] uppercase tracking-[3px] text-gray-400 mt-0.5">
            Tournament Bracket
          </div>
        </div>
        <div className="flex gap-8 text-[10px] font-medium text-gray-500">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] uppercase tracking-widest text-gray-400">Date</span>
            <div className="border-b border-gray-800 min-w-[100px] h-4 text-gray-800 leading-4">
              {date}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] uppercase tracking-widest text-gray-400">Division</span>
            <div className="border-b border-gray-800 min-w-[120px] h-4 text-gray-800 leading-4">
              {division}
            </div>
          </div>
        </div>
      </div>

      {/* Bracket tree */}
      <div className="flex items-stretch min-h-[300px]">
        <div className="flex flex-1 items-stretch">
          {data.rounds.map((round, i) => {
            const isLast = i === data.rounds.length - 1
            return (
              <div key={i} className="flex items-stretch">
                {isLast ? (
                  // Final column: relative container so WinnersPanel can be
                  // absolutely pinned to the bottom without stealing height
                  // from BracketRound — Final match stays correctly centered
                  <div className="relative flex flex-col flex-1 min-w-[140px]">
                    <BracketRound label={round.label} matches={round.matches} />
                    <div className="absolute bottom-0 left-0">
                      <WinnersPanel />
                    </div>
                  </div>
                ) : (
                  <BracketRound label={round.label} matches={round.matches} />
                )}
                {!isLast && (
                  <BracketConnector pairCount={data.rounds[i + 1].matches.length} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <BracketFooter />
    </div>
  )
}
