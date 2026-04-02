import { useApi } from "../hooks/useApi"
import WorldPoliticsWarning from "./WorldPoliticsWarning"
import { BLOC_COLORS } from "../App"

const BLOC_LABELS = {
  left_radical: "Left Radical",
  center_left:  "Center Left",
  right:        "Right",
  mixed:        "Mixed",
}

function SidebarSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px" }}>
      {[1,2,3,4,5,6,7,8].map(function(i) {
        return (
          <div
            key={i}
            className="animate-pulse"
            style={{
              height: "28px", borderRadius: "6px",
              background: "rgba(255,255,255,0.05)",
              width: i % 3 === 0 ? "60%" : "100%",
            }}
          />
        )
      })}
    </div>
  )
}

export default function Sidebar({ filters, onChange }) {
  const { data, loading, error } = useApi("/api/subreddits")

  const showWPWarning =
    filters.subreddit === "worldpolitics" ||
    filters.subreddit === "all"

  return (
    <div style={{
      width: "260px",
      background: "#0a0f1a",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      overflowY: "auto",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Logo area */}
      <div style={{
        padding: "20px 16px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <h2 style={{
          fontSize: "16px", fontWeight: "700",
          color: "#3b82f6", marginBottom: "2px",
        }}>
          NarrativeTracker
        </h2>
        <p style={{ fontSize: "11px", color: "#374151" }}>
          Political narrative analysis
        </p>
      </div>

      <div style={{ padding: "12px 16px", flex: 1 }}>

        {/* Filter label */}
        <p style={{
          fontSize: "10px", color: "#4b5563",
          textTransform: "uppercase", letterSpacing: "0.07em",
          marginBottom: "8px",
        }}>
          Filter by Subreddit
        </p>

        {/* Loading skeleton */}
        {loading && <SidebarSkeleton />}

        {/* Error */}
        {error && !loading && (
          <p style={{ fontSize: "12px", color: "#ef4444" }}>
            Failed to load subreddits
          </p>
        )}

        {/* Subreddit list */}
        {data && !loading && (
          <div>
            {/* All subreddits button */}
            <button
              onClick={function() { onChange(Object.assign({}, filters, { subreddit: "all" })) }}
              style={{
                width: "100%", textAlign: "left",
                padding: "6px 8px", borderRadius: "6px",
                fontSize: "13px", marginBottom: "8px",
                border: "none", cursor: "pointer",
                background: filters.subreddit === "all"
                  ? "rgba(59,130,246,0.15)"
                  : "transparent",
                color: filters.subreddit === "all" ? "#93c5fd" : "#9ca3af",
              }}
            >
              All subreddits
            </button>

            {/* Grouped by bloc */}
            {(function() {
              const groups = {}
              data.forEach(function(s) {
                if (!groups[s.bloc]) groups[s.bloc] = []
                groups[s.bloc].push(s)
              })
              return Object.entries(groups).map(function(entry) {
                const bloc = entry[0]
                const subs = entry[1]
                return (
                  <div key={bloc} style={{ marginBottom: "12px" }}>
                    <p style={{
                      fontSize: "10px", fontWeight: "700",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      color: BLOC_COLORS[bloc] || "#6b7280",
                      marginBottom: "4px", padding: "0 8px",
                    }}>
                      {BLOC_LABELS[bloc] || bloc}
                    </p>
                    {subs.map(function(s) {
                      const isActive = filters.subreddit === s.subreddit
                      return (
                        <button
                          key={s.subreddit}
                          onClick={function() {
                            onChange(Object.assign({}, filters, { subreddit: s.subreddit }))
                          }}
                          style={{
                            width: "100%", textAlign: "left",
                            padding: "5px 8px", borderRadius: "6px",
                            fontSize: "12px", marginBottom: "2px",
                            border: "none", cursor: "pointer",
                            background: isActive
                              ? "rgba(255,255,255,0.08)"
                              : "transparent",
                            color: isActive ? "white" : "#6b7280",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{"r/" + s.subreddit}</span>
                          <span style={{
                            fontSize: "10px",
                            color: isActive ? "#9ca3af" : "#374151",
                          }}>
                            {s.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )
              })
            })()}
          </div>
        )}

        {/* Granularity toggle */}
        <div style={{ marginTop: "8px", marginBottom: "12px" }}>
          <p style={{
            fontSize: "10px", color: "#4b5563",
            textTransform: "uppercase", letterSpacing: "0.07em",
            marginBottom: "8px",
          }}>
            Time Granularity
          </p>
          <div style={{ display: "flex", gap: "4px" }}>
            {["day", "week", "month"].map(function(g) {
              const isActive = filters.granularity === g
              return (
                <button
                  key={g}
                  onClick={function() {
                    onChange(Object.assign({}, filters, { granularity: g }))
                  }}
                  style={{
                    flex: 1, padding: "5px 0",
                    borderRadius: "6px", fontSize: "11px",
                    border: "none", cursor: "pointer",
                    background: isActive ? "#1d4ed8" : "#1f2937",
                    color: isActive ? "white" : "#6b7280",
                  }}
                >
                  {g}
                </button>
              )
            })}
          </div>
        </div>

        <WorldPoliticsWarning visible={showWPWarning} />

      </div>
    </div>
  )
}