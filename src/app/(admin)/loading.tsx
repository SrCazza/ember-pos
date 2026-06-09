export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-zinc-100 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-zinc-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-zinc-100 rounded-xl animate-pulse" />
    </div>
  )
}
