const PLACES = [1, 2, 3, 4, 5, 5, 5, 5]

export default function WinnersPanel() {
  return (
    <div className="shrink-0 self-start border border-gray-800 rounded-sm overflow-hidden w-44 ml-4">
      <div className="bg-gray-900 text-white text-[9px] font-bold uppercase tracking-widest text-center py-1.5 px-2">
        Winners / First &amp; Last Name
      </div>
      {PLACES.map((place, i) => (
        <div key={i} className="flex border-t border-gray-300">
          <div className="w-7 h-6 border-r border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-700 bg-gray-50 shrink-0">
            {place}
          </div>
          <div className="flex-1 h-6" />
        </div>
      ))}
    </div>
  )
}
