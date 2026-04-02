import { useState } from "react"
import axios from "axios"
import { BLOC_COLORS } from "../App"

const BASE = import.meta.env.VITE_API_URL || ""

const BLOCS = [
  { key: "left_radical", label: "Left Radical" },
  { key: "center_left",  label: "Center Left"  },
  { key: "right",        label: "Right"         },
  { key: "mixed",        label: "Mixed"         },
]

const EXAMPLE_QUERIES = [
  "federal workers fired",
  "nuclear weapons staff",
  "immigration policy",
  "government efficiency",
  "democratic institutions",
]

// ── Single post card ──────────────────────────────────────────────────────────
function PostCard({ post, bloc }) {
  const color = BLOC_COLORS[bloc] || "#6b7280"
  const similarity = Math.round((post.similarity || 0) * 100)
  const date = post.created_utc?.slice(0, 10)
  const redditUrl = "https://reddit.com" + (post.permalink || "")

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "8px",
    display: "block",
    padding: "12px",
    marginBottom: "8px",
    textDecoration: "none",
    transition: "background 0.15s",
  }

  const badgeStyle = {
    background: color + "33",
    border: "1px solid " + color + "55",
    borderRadius: "4px",
    padding: "2px 6px",
    fontSize: "11px",
    fontWeight: "500",
    color: "white",
  }

  const simStyle = {
    color: color,
    fontSize: "11px",
    fontWeight: "600",
    marginLeft: "auto",
  }

  return (
    <a href={redditUrl} target="_blank" rel="noreferrer" style={cardStyle}>
      <p style={{
        fontSize: "13px",
        color: "#e5e7eb",
        lineHeight: "1.4",
        marginBottom: "8px",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {post.title}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
        <span style={badgeStyle}>r/{post.subreddit}</span>

        {post.score > 0 && (
          <span style={{ fontSize: "11px", color: "#6b7280" }}>
            ↑ {post.score.toLocaleString()}
          </span>
        )}

        {date && (
          <span style={{ fontSize: "11px", color: "#4b5563" }}>{date}</span>
        )}

        <span style={simStyle}>{similarity}% match</span>
      </div>
    </a>
  )
}

// ── One bloc column ───────────────────────────────────────────────────────────
function BlocColumn({ bloc, label, posts, loading }) {
  const color = BLOC_COLORS[bloc] || "#6b7280"

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "12px",
        paddingBottom: "8px",
        borderBottom: "2px solid " + color,
      }}>
        <div style={{
          width: "10px", height: "10px",
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }} />
        <h3 style={{ fontSize: "13px", fontWeight: "600", color: "#e5e7eb" }}>
          {label}
        </h3>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: "80px", background: "#1f2937",
              borderRadius: "8px", animation: "pulse 2s infinite",
            }} />
          ))}
        </div>
      )}

      {!loading && posts && posts.length > 0 &&
        posts.map((p, i) => <PostCard key={i} post={p} bloc={bloc} />)
      }

      {!loading && (!posts || posts.length === 0) && (
        <div style={{
          padding: "24px 12px",
          textAlign: "center",
          background: "rgba(255,255,255,0.02)",
          border: "1px dashed rgba(255,255,255,0.08)",
          borderRadius: "8px",
        }}>
          <p style={{ fontSize: "12px", color: "#4b5563" }}>
            No relevant posts found in this community
          </p>
        </div>
      )}
    </div>
  )
}

// ── AI Framing Analysis box ───────────────────────────────────────────────────
function FramingAnalysis({ analysis, loading }) {
  if (!loading && !analysis) return null

  return (
    <div style={{
      marginTop: "20px",
      padding: "16px",
      background: "rgba(59,130,246,0.06)",
      border: "1px solid rgba(59,130,246,0.2)",
      borderLeft: "4px solid #3b82f6",
      borderRadius: "8px",
    }}>
      <p style={{
        fontSize: "11px",
        fontWeight: "700",
        color: "#60a5fa",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: "8px",
      }}>
        AI Framing Analysis
      </p>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[100, 83, 66].map((w, i) => (
            <div key={i} style={{
              height: "12px",
              width: w + "%",
              background: "#374151",
              borderRadius: "4px",
            }} />
          ))}
        </div>
      ) : (
        <p style={{ fontSize: "14px", color: "#d1d5db", lineHeight: "1.6" }}>
          {analysis}
        </p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NarrativeDivergence() {
  const [query,        setQuery]        = useState("")
  const [results,      setResults]      = useState(null)
  const [analysis,     setAnalysis]     = useState("")
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [loadingAI,    setLoadingAI]    = useState(false)
  const [error,        setError]        = useState(null)
  const [lastQuery,    setLastQuery]    = useState("")

  const handleSearch = async () => {
    const q = query.trim()
    if (!q || q.length < 2) return

    setLoadingPosts(true)
    setLoadingAI(true)
    setResults(null)
    setAnalysis("")
    setError(null)
    setLastQuery(q)

    try {
      const divRes = await axios.get(BASE + "/api/narrative_divergence", {
        params: { q },
      })
      setResults(divRes.data)
      setLoadingPosts(false)

      try {
        const anaRes = await axios.post(BASE + "/api/narrative_analysis", {
          query: q,
          blocs: divRes.data.divergence,
        })
        setAnalysis(anaRes.data.analysis)
      } catch {
        setAnalysis("Framing analysis temporarily unavailable.")
      } finally {
        setLoadingAI(false)
      }

    } catch (e) {
      setError("Search failed — check that the backend is running.")
      setLoadingPosts(false)
      setLoadingAI(false)
    }
  }

  const handleExampleClick = (exQuery) => {
    setQuery(exQuery)
    setTimeout(handleSearch, 50)
  }

  return (
    <section className="w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-200">
          Narrative Divergence Tracker
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          See how Left Radical, Center Left, Right, and Mixed communities frame
          the same topic differently — with AI analysis of the framing gaps.
        </p>
      </div>

      {/* Search input */}
      <div className="flex gap-2 mb-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder='Try "federal workers fired" or "immigration policy"...'
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5
            text-white placeholder-gray-500 text-sm focus:outline-none
            focus:border-blue-500 transition-colors"
        />
        <button
          onClick={handleSearch}
          disabled={loadingPosts || query.trim().length < 2}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700
            disabled:text-gray-500 rounded-lg text-sm font-semibold
            transition-colors whitespace-nowrap"
        >
          {loadingPosts ? "Searching..." : "Analyse"}
        </button>
      </div>

      {/* Short query warning */}
      {query.length > 0 && query.trim().length < 2 && (
        <p className="text-yellow-500 text-xs mb-3">
          Please enter at least 2 characters
        </p>
      )}

      {/* Example chips */}
      {!results && !loadingPosts && (
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs text-gray-600 self-center">Try:</span>
          {EXAMPLE_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => handleExampleClick(q)}
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

      {/* Results */}
      {(results || loadingPosts) && (
        <>
          {results && !loadingPosts && (
            <p className="text-xs text-gray-500 mb-4">
              {results.total_relevant || 0} relevant posts found for{" "}
              <strong className="text-gray-300">"{lastQuery}"</strong>
            </p>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {BLOCS.map(({ key, label }) => (
              <BlocColumn
                key={key}
                bloc={key}
                label={label}
                posts={results?.divergence?.[key]}
                loading={loadingPosts}
              />
            ))}
          </div>

          <FramingAnalysis analysis={analysis} loading={loadingAI} />
        </>
      )}

      {/* Pre-search bloc preview */}
      {!results && !loadingPosts && (
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {BLOCS.map(({ key, label }) => (
            <div
              key={key}
              className="p-3 rounded-lg text-center"
              style={{
                background: BLOC_COLORS[key] + "10",
                border: "1px solid " + BLOC_COLORS[key] + "25",
              }}
            >
              <div
                className="w-3 h-3 rounded-full mx-auto mb-2"
                style={{ background: BLOC_COLORS[key] }}
              />
              <p className="text-xs font-semibold mb-1"
                style={{ color: BLOC_COLORS[key] }}>
                {label}
              </p>
              <p className="text-xs text-gray-600">
                {key === "left_radical" && "r/Anarchism · r/socialism"}
                {key === "center_left"  && "r/Liberal · r/politics · r/neoliberal"}
                {key === "right"        && "r/Conservative · r/Republican"}
                {key === "mixed"        && "r/worldpolitics"}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}