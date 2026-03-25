import { useState } from 'react'
import { Link } from 'react-router-dom'
import BracketControls from '@/components/bracket/BracketControls'
import BracketSheet from '@/components/bracket/BracketSheet'
import { generateBracket, type BracketData } from '@/components/bracket/bracketUtils'

export default function BracketPage() {
  const [competitorCount, setCompetitorCount] = useState('')
  const [date, setDate] = useState('')
  const [division, setDivision] = useState('')
  const [bracketData, setBracketData] = useState<BracketData | null>(null)

  function handleGenerate(count: number) {
    setBracketData(generateBracket(count))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav — hidden on print */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 print:hidden">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          ← Martial Arts Tools
        </Link>
        <span className="text-gray-300">|</span>
        <span className="text-sm font-semibold text-gray-900">Tournament Bracket</span>
        {bracketData && (
          <button
            onClick={() => window.print()}
            className="ml-auto text-sm font-medium text-gray-700 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            Print / Save PDF
          </button>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 print:p-0 print:max-w-none">
        <BracketControls
          competitorCount={competitorCount}
          date={date}
          division={division}
          onCompetitorCountChange={setCompetitorCount}
          onDateChange={setDate}
          onDivisionChange={setDivision}
          onGenerate={handleGenerate}
        />

        {bracketData ? (
          <BracketSheet data={bracketData} date={date} division={division} />
        ) : (
          <div className="text-center text-gray-400 py-24 print:hidden">
            Enter a competitor count and click Generate Bracket to begin.
          </div>
        )}
      </div>
    </div>
  )
}
