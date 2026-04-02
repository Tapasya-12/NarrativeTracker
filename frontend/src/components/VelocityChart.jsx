import { useState } from "react"
import axios from "axios"
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from "recharts"
import { BLOC_COLORS } from "../App"

const BASE = import.meta.env.VITE_API_URL || ""

const EXAMPLE_QUERIES = [
  "nuclear weapons staff fired",
  "federal worker layoffs",
  "inauguration executive orders",
  "DOGE government efficiency",
  "FAA staffing crisis",
]

// ── helpers ───────────────────────────────────────────────────────────────────
function getBlocForSub(subreddit) {
  const map = {
    Anarchism: "left_radical", socialism: "left_radical",
    Liberal: "center_left", democrats: "center_left",
    politics: "center_left", neoliberal: "center_left",
    PoliticalDiscussion: "center_left",
    Conservative: "right", Republican: "right",
    worldpolitics: "mixed",
  }
  return map[subreddit] || "other"
}

function getSubColor(subreddit) {
  return BLOC_COLORS[getBlocForSub(subreddit)] || "#6b7280"
}

// ── First mover badge ─────────────────────────────────────────────────────────
function FirstMoverBadge({ firstMover, firstPosts }) {
  if (!firstMover) return null
  const fp   = firstPosts[0] || {}
  const color = getSubColor(firstMover)
  const date  = fp.created_utc ? fp.created_utc.slice(0, 10) : ""

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "16px",
      padding: "16px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "10px",
      marginBottom: "20px",
    }}>
      {/* Circle badge */}
      <div style={{
        width: "52px", height: "52px",
        borderRadius: "50%",
        background: color,
        display: "flex", alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        flexDirection: "column",
      }}>
        <span style={{ color: "white", fontSize: "9px", fontWeight: "700", lineHeight: 1 }}>
          1ST
        </span>
        <span style={{ color: "white", fontSize: "8px", opacity: 0.8, lineHeight: 1 }}>
          MOVER
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase",
          letterSpacing: "0.06em", marginBottom: "2px" }}>
          First Community to Post
        </p>
        <p style={{ fontSize: "18px", fontWeight: "700", color: color, marginBottom: "4px" }}>
          {"r/" + firstMover}
        </p>
        {date !== "" && (
          <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>
            {date}
          </p>
        )}
        {fp.title && (
          <p style={{
            fontSize: "12px", color: "#6b7280",
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {fp.title}
          </p>
        )}
      </div>

      {/* Similarity */}
      {fp.similarity != null && (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: "11px", color: "#6b7280" }}>relevance</p>
          <p style={{ fontSize: "20px", fontWeight: "700", color: color }}>
            {Math.round(fp.similarity * 100) + "%"}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Propagation order list ────────────────────────────────────────────────────
function PropagationOrder({ firstPosts }) {
  if (!firstPosts || firstPosts.length < 2) return null

  return (
    <div style={{ marginBottom: "20px" }}>
      <p style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase",
        letterSpacing: "0.06em", marginBottom: "10px" }}>
        Propagation Order
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {firstPosts.map((fp, idx) => {
          const color = getSubColor(fp.subreddit)
          const date  = fp.created_utc ? fp.created_utc.slice(0, 10) : ""
          return (
            <div key={fp.subreddit} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "8px 12px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "6px",
              borderLeft: "3px solid " + color,
            }}>
              <span style={{
                width: "22px", height: "22px", borderRadius: "50%",
                background: color + "30", color: color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: "700", flexShrink: 0,
              }}>
                {idx + 1}
              </span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: color }}>
                {"r/" + fp.subreddit}
              </span>
              <span style={{ fontSize: "11px", color: "#6b7280" }}>{date}</span>
              {idx === 0 && (
                <span style={{
                  marginLeft: "auto", fontSize: "10px", color: "#fbbf24",
                  fontWeight: "600",
                }}>
                  ★ FIRST
                </span>
              )}
              {idx > 0 && (
                <span style={{ marginLeft: "auto", fontSize: "10px", color: "#4b5563" }}>
                  {"+" + idx + (idx === 1 ? " community" : " communities") + " later"}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Mini timeline chart per subreddit ─────────────────────────────────────────
function MiniTimeline({ subreddit, timelineData }) {
  const color = getSubColor(subreddit)

  const tooltipStyle = {
    background: "#1f2937",
    border: "none",
    borderRadius: "6px",
    fontSize: "11px",
    padding: "4px 8px",
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "8px",
      padding: "10px 12px",
    }}>
      <p style={{
        fontSize: "12px", fontWeight: "600",
        color: color, marginBottom: "8px",
      }}>
        {"r/" + subreddit}
      </p>
      <ResponsiveContainer width="100%" height={70}>
        <LineChart data={timelineData}>
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#9ca3af" }}
            formatter={v => [v, "posts"]}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VelocityChart() {
  const [query,   setQuery]   = useState("")
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [lastQ,   setLastQ]   = useState("")

  const handleSearch = async () => {
    const q = query.trim()
    if (!q || q.length < 2) return

    setLoading(true)
    setData(null)
    setError(null)
    setLastQ(q)

    try {
      const res = await axios.get(BASE + "/api/velocity", { params: { q } })
      setData(res.data)
    } catch (e) {
      setError("Request failed — check that the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  const handleExample = (q) => {
    setQuery(q)
    setTimeout(() => {
      document.getElementById("velocity-btn").click()
    }, 50)
  }

  // Group timeline rows by subreddit
  const timelinesBySub = {}
  if (data && data.timeline) {
    data.timeline.forEach(row => {
      if (!timelinesBySub[row.subreddit]) timelinesBySub[row.subreddit] = []
      timelinesBySub[row.subreddit].push({ date: row.date, count: row.count })
    })
  }

  // Order subreddits by propagation order
  const orderedSubs = data && data.first_posts
    ? data.first_posts
        .map(fp => fp.subreddit)
        .filter(sub => timelinesBySub[sub] && timelinesBySub[sub].length > 0)
    : []

  return (
    <section className="w-full">

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-200">
          Information Velocity
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Which community posted about a topic first? Track how narratives
          spread across ideological communities over time.
        </p>
      </div>

      {/* Search input */}
      <div className="flex gap-2 mb-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSearch() }}
          placeholder="Search for a topic or event..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5
            text-white placeholder-gray-500 text-sm focus:outline-none
            focus:border-blue-500 transition-colors"
        />
        <button
          id="velocity-btn"
          onClick={handleSearch}
          disabled={loading || query.trim().length < 2}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700
            disabled:text-gray-500 rounded-lg text-sm font-semibold
            transition-colors whitespace-nowrap"
        >
          {loading ? "Tracing..." : "Trace"}
        </button>
      </div>

      {/* Example chips */}
      {!data && !loading && (
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs text-gray-600 self-center">Try:</span>
          {EXAMPLE_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => handleExample(q)}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700
                rounded-full text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-950 border border-red-700 rounded-lg
          text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <div className="h-24 bg-gray-900 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 bg-gray-900 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {data && !loading && !data.first_mover && (
        <div className="py-12 text-center">
          <p className="text-gray-500 text-sm mb-1">
            No posts found for this query
          </p>
          <p className="text-gray-700 text-xs">
            Try a broader term or check the spelling
          </p>
        </div>
      )}

      {/* Results */}
      {data && data.first_mover && !loading && (
        <div>
          {/* Stats strip */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500">
            <span>
              Query: <strong className="text-gray-300">"{lastQ}"</strong>
            </span>
            <span>
              <strong className="text-gray-300">{data.total}</strong> relevant posts
            </span>
            <span>
              <strong className="text-gray-300">{orderedSubs.length}</strong> communities
            </span>
          </div>

          {/* First mover badge */}
          <FirstMoverBadge
            firstMover={data.first_mover}
            firstPosts={data.first_posts || []}
          />

          {/* Propagation order */}
          <PropagationOrder firstPosts={data.first_posts || []} />

          {/* Timeline grid */}
          <p style={{
            fontSize: "11px", color: "#6b7280",
            textTransform: "uppercase", letterSpacing: "0.06em",
            marginBottom: "10px",
          }}>
            Daily Post Volume — Ordered by First Appearance
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {orderedSubs.map(sub => (
              <MiniTimeline
                key={sub}
                subreddit={sub}
                timelineData={timelinesBySub[sub]}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}