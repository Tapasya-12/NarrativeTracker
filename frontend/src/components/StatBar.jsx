import { useApi } from "../hooks/useApi"

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "10px",
      padding: "16px",
      flex: "1",
      minWidth: "140px",
    }}>
      <p style={{
        fontSize: "10px", color: "#6b7280",
        textTransform: "uppercase", letterSpacing: "0.07em",
        marginBottom: "6px",
      }}>
        {label}
      </p>
      <p style={{
        fontSize: "20px", fontWeight: "700",
        color: color || "white",
        marginBottom: sub ? "4px" : 0,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {value}
      </p>
      {sub && (
        <p style={{
          fontSize: "11px", color: "#4b5563",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      className="animate-pulse"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "10px",
        padding: "16px",
        flex: "1",
        minWidth: "140px",
        height: "80px",
      }}
    />
  )
}

export default function StatBar() {
  const { data, loading, error } = useApi("/api/stats")

  if (loading) {
    return (
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {[1,2,3,4,5].map(function(i) {
          return <SkeletonCard key={i} />
        })}
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: "12px 16px",
        background: "#1c0a0a",
        border: "1px solid #7f1d1d",
        borderRadius: "10px",
        color: "#fca5a5",
        fontSize: "13px",
      }}>
        Failed to load statistics — check that the backend is running on port 5000
      </div>
    )
  }

  if (!data) return null

  const fmt       = function(n) { return n != null ? n.toLocaleString() : "—" }
  const dateStart = data.date_start ? data.date_start.slice(0, 10) : ""
  const dateEnd   = data.date_end   ? data.date_end.slice(0, 10)   : ""
  const dateRange = dateStart + " → " + dateEnd
  const topTitle  = data.top_post
    ? data.top_post.title.slice(0, 55) + "..."
    : ""

  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
      <StatCard
        label="Total Posts"
        value={fmt(data.total_posts)}
        color="#3b82f6"
      />
      <StatCard
        label="Unique Authors"
        value={fmt(data.total_authors)}
        color="#10b981"
      />
      <StatCard
        label="Date Range"
        value={dateRange}
        color="#e5e7eb"
      />
      <StatCard
        label="Top Post Score"
        value={fmt(data.top_post?.score)}
        sub={topTitle}
        color="#f59e0b"
      />
      <StatCard
        label="Spam Filtered"
        value={fmt(data.spam_flagged)}
        sub="r/worldpolitics off-topic"
        color="#a855f7"
      />
    </div>
  )
}