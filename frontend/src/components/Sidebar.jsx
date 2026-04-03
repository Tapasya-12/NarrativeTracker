import { useApi } from "../hooks/useApi"
import WorldPoliticsWarning from "./WorldPoliticsWarning"
import { BLOC_COLORS } from "../App"

const BLOC_LABELS = {
  left_radical: "Left Radical",
  center_left:  "Center Left",
  right:        "Right",
  mixed:        "Mixed",
}

const BLOC_ORDER = ["left_radical", "center_left", "right", "mixed"]

export default function Sidebar({ filters, onChange }) {
  const { data, loading, error } = useApi("/api/subreddits")

  const showWPWarning = filters.subreddit === "worldpolitics"

  // Group subreddits by bloc outside JSX
  const groups = {}
  if (data) {
    data.forEach(function(s) {
      if (!groups[s.bloc]) groups[s.bloc] = []
      groups[s.bloc].push(s)
    })
  }

  function selectSubreddit(sub) {
    onChange({ subreddit: sub, granularity: filters.granularity })
  }

  function selectGranularity(g) {
    onChange({ subreddit: filters.subreddit, granularity: g })
  }

  function getSubBtnStyle(isActive) {
    return {
      width: "100%",
      textAlign: "left",
      padding: "6px 10px",
      borderRadius: "6px",
      fontSize: "12px",
      marginBottom: "2px",
      border: "none",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
      color: isActive ? "white" : "#6b7280",
      transition: "background 0.15s",
    }
  }

  function getAllBtnStyle() {
    const isActive = filters.subreddit === "all"
    return {
      width: "100%",
      textAlign: "left",
      padding: "6px 10px",
      borderRadius: "6px",
      fontSize: "13px",
      marginBottom: "10px",
      border: isActive ? "1px solid rgba(59,130,246,0.4)" : "1px solid transparent",
      cursor: "pointer",
      background: isActive ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
      color: isActive ? "#93c5fd" : "#9ca3af",
    }
  }

  function getGranBtnStyle(g) {
    const isActive = filters.granularity === g
    return {
      flex: 1,
      padding: "5px 0",
      borderRadius: "6px",
      fontSize: "11px",
      border: "none",
      cursor: "pointer",
      background: isActive ? "#1d4ed8" : "#1f2937",
      color: isActive ? "white" : "#6b7280",
    }
  }

  return (
    <div style={{
      width: "260px",
      minWidth: "260px",
      background: "#0a0f1a",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      overflowY: "auto",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      height: "100vh",
    }}>

      {/* Logo */}
      <div style={{
        padding: "20px 16px 14px",
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

      <div style={{ padding: "14px 16px", flex: 1, overflowY: "auto" }}>

        {/* Section label */}
        <p style={{
          fontSize: "10px", color: "#4b5563",
          textTransform: "uppercase", letterSpacing: "0.07em",
          marginBottom: "8px",
        }}>
          Filter by Subreddit
        </p>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[1,2,3,4,5,6,7].map(function(i) {
              return (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{
                    height: "26px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.05)",
                    width: i % 3 === 0 ? "55%" : "100%",
                  }}
                />
              )
            })}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p style={{ fontSize: "12px", color: "#ef4444" }}>
            Failed to load subreddits
          </p>
        )}

        {/* Subreddit buttons */}
        {data && !loading && (
          <div>
            {/* All subreddits */}
            <button
              style={getAllBtnStyle()}
              onClick={function() { selectSubreddit("all") }}
            >
              All subreddits
            </button>

            {/* Each bloc group */}
            {BLOC_ORDER.map(function(bloc) {
              const subs = groups[bloc]
              if (!subs || subs.length === 0) return null
              return (
                <div key={bloc} style={{ marginBottom: "14px" }}>
                  {/* Bloc label */}
                  <p style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: BLOC_COLORS[bloc] || "#6b7280",
                    marginBottom: "4px",
                    paddingLeft: "10px",
                  }}>
                    {BLOC_LABELS[bloc] || bloc}
                  </p>

                  {/* Subreddit buttons in this bloc */}
                  {subs.map(function(s) {
                    const isActive = filters.subreddit === s.subreddit
                    return (
                      <button
                        key={s.subreddit}
                        style={getSubBtnStyle(isActive)}
                        onClick={function() { selectSubreddit(s.subreddit) }}
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
            })}
          </div>
        )}

        {/* Granularity */}
        <div style={{ marginTop: "4px", marginBottom: "14px" }}>
          <p style={{
            fontSize: "10px", color: "#4b5563",
            textTransform: "uppercase", letterSpacing: "0.07em",
            marginBottom: "8px",
          }}>
            Time Granularity
          </p>
          <div style={{ display: "flex", gap: "4px" }}>
            {["day", "week", "month"].map(function(g) {
              return (
                <button
                  key={g}
                  style={getGranBtnStyle(g)}
                  onClick={function() { selectGranularity(g) }}
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