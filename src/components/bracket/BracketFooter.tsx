const FIELDS = ['Centre', 'Corner', 'Corner']

export default function BracketFooter() {
  return (
    <div className="flex gap-8 mt-4 pt-3 border-t border-gray-200 text-[10px] text-gray-500 font-medium">
      {FIELDS.map((label, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span>{label}:</span>
          <div className="w-36 border-b border-gray-400" />
        </div>
      ))}
    </div>
  )
}
