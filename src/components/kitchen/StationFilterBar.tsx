"use client"

interface Station {
  id: string
  name: string
  color: string
}

interface StationFilterBarProps {
  stations: Station[]
  activeStation: string | null
  onSelect: (id: string | null) => void
}

export function StationFilterBar({ stations, activeStation, onSelect }: StationFilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] cursor-pointer ${
          activeStation === null
            ? "bg-zinc-100 text-zinc-900"
            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-white"
        }`}
      >
        Todas
      </button>
      {stations.map((station) => (
        <button
          key={station.id}
          onClick={() => onSelect(station.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] cursor-pointer ${
            activeStation === station.id
              ? "text-white"
              : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-white"
          }`}
          style={activeStation === station.id ? { backgroundColor: station.color } : {}}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: station.color }}
          />
          {station.name}
        </button>
      ))}
    </div>
  )
}
