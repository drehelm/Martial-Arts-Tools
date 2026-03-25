interface Props {
  pairCount: number
}

export default function BracketConnector({ pairCount }: Props) {
  return (
    <div className="flex flex-col w-6 shrink-0">
      {/* Spacer to align with round label height */}
      <div className="shrink-0" style={{ height: '25px' }} />
      <div className="flex flex-col flex-1">
        {Array.from({ length: pairCount }).map((_, i) => (
          <div key={i} className="flex flex-col flex-1">
            {/* Top half: connects upper match */}
            <div className="flex-1 border-r-2 border-b-2 border-gray-800" />
            {/* Bottom half: connects lower match */}
            <div className="flex-1 border-r-2 border-t-2 border-gray-800" />
          </div>
        ))}
      </div>
    </div>
  )
}
