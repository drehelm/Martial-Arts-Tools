import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  competitorCount: string
  date: string
  division: string
  onCompetitorCountChange: (v: string) => void
  onDateChange: (v: string) => void
  onDivisionChange: (v: string) => void
  onGenerate: (count: number) => void
}

function isValidCount(value: string): boolean {
  if (value === '') return false
  const floored = Math.floor(parseFloat(value))
  if (isNaN(floored)) return false
  return floored >= 2 && floored <= 32
}

export default function BracketControls({
  competitorCount,
  date,
  division,
  onCompetitorCountChange,
  onDateChange,
  onDivisionChange,
  onGenerate,
}: Props) {
  const valid = isValidCount(competitorCount)

  function handleGenerate() {
    if (!valid) return
    onGenerate(Math.floor(parseFloat(competitorCount)))
  }

  return (
    <div className="flex flex-wrap items-end gap-4 mb-6 print:hidden">
      <div className="flex flex-col gap-1">
        <label htmlFor="competitor-count" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Competitors (2–32)
        </label>
        <Input
          id="competitor-count"
          type="number"
          min={2}
          max={32}
          step={1}
          value={competitorCount}
          onChange={(e) => onCompetitorCountChange(e.target.value)}
          className="w-28"
          placeholder="e.g. 8"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="bracket-date" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Date (optional)
        </label>
        <Input
          id="bracket-date"
          type="text"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-36"
          placeholder="e.g. May 3, 2026"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="bracket-division" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Division (optional)
        </label>
        <Input
          id="bracket-division"
          type="text"
          value={division}
          onChange={(e) => onDivisionChange(e.target.value)}
          className="w-48"
          placeholder="e.g. Adult Black Belt"
        />
      </div>
      <Button onClick={handleGenerate} disabled={!valid}>
        Generate Bracket
      </Button>
    </div>
  )
}
