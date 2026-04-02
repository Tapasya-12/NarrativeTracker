import { useApi } from "../hooks/useApi"

function Stat({ label, value, sub }) {
  return (
    <div className="bg-gray-900 rounded p-4 flex-1 min-w-0">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-white mt-1 truncate">{value}</p>
      {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
    </div>
  )
}

export default function StatBar() {
  const { data, loading, error } = useApi("/api/stats")

  if (loading)
    return <div className="h-20 animate-pulse bg-gray-900 rounded" />

  if (error)
    return (
      <div className="p-3 bg-red-950 border border-red-700 rounded text-red-300 text-sm">
        Failed to load stats — check that the backend is running
      </div>
    )

  if (!data) return null

  const fmt = (n) => n?.toLocaleString()
  const dateRange = `${data.date_start?.slice(0, 10)} → ${data.date_end?.slice(0, 10)}`

  return (
    <div className="flex gap-3 flex-wrap">
      <Stat label="Total Posts" value={fmt(data.total_posts)} />
      <Stat label="Unique Authors" value={fmt(data.total_authors)} />
      <Stat label="Date Range" value={dateRange} />
      <Stat
        label="Top Post Score"
        value={fmt(data.top_post?.score)}
        sub={data.top_post?.title?.slice(0, 60) + "..."}
      />
      <Stat label="Spam Filtered" value={fmt(data.spam_flagged)} />
    </div>
  )
}