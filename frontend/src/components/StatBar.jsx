import { useApi } from "../hooks/useApi"

function StatCard({ label, value, sub, color, loading, children }) {
  if (loading) {
    return (
      <div style={{
        flex: "1", minWidth: "150px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        padding: "18px 20px",
        borderTop: "2px solid " + (color || "transparent"),
      }}>
        <div className="skeleton" style={{ height: "9px", width: "55%", marginBottom: "12px" }} />
        <div className="skeleton" style={{ height: "26px", width: "70%", marginBottom: "8px" }} />
        <div className="skeleton" style={{ height: "9px", width: "85%" }} />
      </div>
    )
  }

  return (
    <div
      style={{
        flex: "1", minWidth: "150px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderTop: "2px solid " + (color || "transparent"),
        borderRadius: "var(--r-md)",
        padding: "18px 20px",
        transition: "border-color 0.2s",
        cursor: "default",
      }}
      onMouseEnter={function(e) {
        e.currentTarget.style.borderColor = color || "var(--border-mid)"
      }}
      onMouseLeave={function(e) {
        e.currentTarget.style.borderColor = color || "var(--border)"
        e.currentTarget.style.borderTopColor = color || "transparent"
      }}
    >
      <p style={{
        fontSize: "9px", fontWeight: "600",
        color: "var(--text-dim)",
        textTransform: "uppercase", letterSpacing: "0.1em",
        marginBottom: "10px",
      }}>
        {label}
      </p>

      {children ? children : (
        <>
          <p className="mono" style={{
            fontSize: "22px", fontWeight: "600",
            color: color || "var(--text-primary)",
            letterSpacing: "-0.5px",
            lineHeight: 1,
            marginBottom: sub ? "8px" : 0,
          }}>
            {value}
          </p>

          {sub && (
            <p style={{
              fontSize: "11px",
              color: "var(--text-dim)",
              lineHeight: 1.5,
              /* Allow wrapping — no overflow hidden */
              wordBreak: "break-word",
            }}>
              {sub}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default function StatBar() {
  const { data, loading, error } = useApi("/api/stats")

  if (error) {
    return (
      <div style={{
        padding: "14px 18px",
        background: "rgba(248,113,113,0.05)",
        border: "1px solid rgba(248,113,113,0.15)",
        borderRadius: "var(--r-md)",
        color: "#fca5a5", fontSize: "13px",
      }}>
        Failed to load statistics — check that the backend is running on port 5000
      </div>
    )
  }

  const fmt = function(n) {
    return n != null ? n.toLocaleString() : "—"
  }

  const dateStart = data ? (data.date_start || "").slice(0, 10) : "—"
  const dateEnd   = data ? (data.date_end   || "").slice(0, 10) : "—"

  // Truncate top post title more aggressively
  const topTitle = data && data.top_post
    ? data.top_post.title.slice(0, 50) + (data.top_post.title.length > 50 ? "..." : "")
    : ""

  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>

      {/* Total Posts */}
      <StatCard
        label="Total Posts"
        value={loading ? "" : fmt(data && data.total_posts)}
        color="var(--blue)" loading={loading}
      />

      {/* Unique Authors */}
      <StatCard
        label="Unique Authors"
        value={loading ? "" : fmt(data && data.total_authors)}
        color="var(--green)" loading={loading}
      />

      {/* Date Range — custom two-line layout */}
      <StatCard label="Date Range" color="var(--text-sec)" loading={loading}>
        {!loading && (
          <div>
            <p className="mono" style={{
              fontSize: "13px", fontWeight: "600",
              color: "var(--text-primary)",
              lineHeight: 1.6,
            }}>
              {dateStart}
            </p>
            <p style={{
              fontSize: "9px", color: "var(--text-dim)",
              textTransform: "uppercase", letterSpacing: "0.08em",
              marginBottom: "2px",
            }}>
              to
            </p>
            <p className="mono" style={{
              fontSize: "13px", fontWeight: "600",
              color: "var(--text-primary)",
              lineHeight: 1.6,
            }}>
              {dateEnd}
            </p>
          </div>
        )}
      </StatCard>

      {/* Top Post Score — wrapping sub text */}
      <StatCard
        label="Top Post Score"
        color="var(--yellow)"
        loading={loading}
      >
        {!loading && (
          <>
            <p className="mono" style={{
              fontSize: "22px", fontWeight: "600",
              color: "var(--yellow)",
              letterSpacing: "-0.5px",
              lineHeight: 1,
              marginBottom: "8px",
            }}>
              {fmt(data && data.top_post ? data.top_post.score : null)}
            </p>
            <p style={{
              fontSize: "11px",
              color: "var(--text-dim)",
              lineHeight: 1.5,
              wordBreak: "break-word",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {topTitle}
            </p>
          </>
        )}
      </StatCard>

      {/* Spam Filtered */}
      <StatCard
        label="Spam Filtered"
        value={loading ? "" : fmt(data && data.spam_flagged)}
        sub="r/worldpolitics off-topic posts"
        color="var(--purple)" loading={loading}
      />

    </div>
  )
}