import { useState, useRef } from "react"
import axios from "axios"
import { BLOC_COLORS } from "../App"

const BASE = import.meta.env.VITE_API_URL || ""

const SEMANTIC_EXAMPLES = [
  {
    query: "anger about government overreach",
    note: "Zero overlap — finds posts about DOGE layoffs, nuclear firings",
    lang: "EN",
  },
  {
    query: "economic anxiety workers losing income",
    note: "Zero overlap — finds posts about federal employee terminations",
    lang: "EN",
  },
  {
    query: "लोकतंत्र में सत्ता का दुरुपयोग",
    note: "Hindi query — multilingual model maps to English posts",
    lang: "HI",
  },
]

const BLOC_FILTERS = [
  { key: "all",          label: "All"          },
  { key: "left_radical", label: "Left Radical" },
  { key: "center_left",  label: "Center Left"  },
  { key: "right",        label: "Right"        },
  { key: "mixed",        label: "Mixed"        },
]

// ── All style helpers live outside components ─────────────────────────────────
function getSimColor(score) {
  if (score >= 0.7) return "#10b981"
  if (score >= 0.5) return "#f59e0b"
  return "#6b7280"
}

function getFilterBtnStyle(isActive, blocKey) {
  const base = {
    borderRadius: "999px",
    padding: "2px 10px",
    fontSize: "11px",
    border: "none",
    cursor: "pointer",
  }
  if (isActive) {
    const bg = blocKey === "all" ? "#3b82f6" : (BLOC_COLORS[blocKey] || "#3b82f6")
    return Object.assign({}, base, { background: bg, color: "white" })
  }
  return Object.assign({}, base, { background: "#1f2937", color: "#9ca3af" })
}

function getExampleLangStyle(lang) {
  return {
    background: lang === "HI" ? "#f9743630" : "#3b82f630",
    color: lang === "HI" ? "#f97316" : "#3b82f6",
    borderRadius: "4px",
    padding: "2px 6px",
    fontSize: "11px",
    fontWeight: "700",
    flexShrink: 0,
    marginTop: "2px",
  }
}

const cardStyle = {
  display: "flex",
  gap: "12px",
  padding: "12px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  textDecoration: "none",
  marginBottom: "6px",
}

const rankStyle = {
  color: "#374151",
  fontSize: "11px",
  fontFamily: "monospace",
  width: "20px",
  flexShrink: 0,
  paddingTop: "2px",
}

const titleStyle = {
  fontSize: "13px",
  color: "#e5e7eb",
  lineHeight: "1.4",
  marginBottom: "8px",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
}

const metaRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "6px",
}

function getBadgeStyle(color) {
  return {
    background: color + "40",
    borderRadius: "4px",
    padding: "2px 7px",
    fontSize: "11px",
    fontWeight: "500",
    color: "white",
  }
}

function getSimStyle(score) {
  return {
    marginLeft: "auto",
    fontSize: "11px",
    fontWeight: "600",
    color: getSimColor(score),
  }
}

// ── Result card ───────────────────────────────────────────────────────────────
function ResultCard({ result, index }) {
  const bloc  = result.ideological_bloc
  const color = BLOC_COLORS[bloc] || "#6b7280"
  const sim   = Math.round((result.similarity || 0) * 100)
  const date  = result.created_utc ? result.created_utc.slice(0, 10) : ""
  const href  = "https://reddit.com" + (result.permalink || "")
  const sub   = "r/" + result.subreddit
  const score = result.score || 0

  return (
    <a href={href} target="_blank" rel="noreferrer" style={cardStyle}>
      <span style={rankStyle}>{index + 1}.</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={titleStyle}>{result.title}</p>

        <div style={metaRowStyle}>
          <span style={getBadgeStyle(color)}>{sub}</span>

          {score > 0 && (
            <span style={{ fontSize: "11px", color: "#6b7280" }}>
              {"↑ " + score.toLocaleString()}
            </span>
          )}

          {date !== "" && (
            <span style={{ fontSize: "11px", color: "#4b5563" }}>{date}</span>
          )}

          <span style={getSimStyle(result.similarity || 0)}>
            {sim + "% match"}
          </span>
        </div>
      </div>
    </a>
  )
}

// ── Suggestion chip ───────────────────────────────────────────────────────────
function SuggestionChip({ text, onClick }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700
        hover:border-blue-600 rounded-full text-sm text-blue-300 hover:text-blue-200
        transition-colors"
    >
      {text + " →"}
    </button>
  )
}

// ── Skeleton loader row ───────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div
      style={{
        height: "64px",
        background: "#111827",
        borderRadius: "8px",
        marginBottom: "6px",
      }}
      className="animate-pulse"
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SearchPanel() {
  const [query,        setQuery]        = useState("")
  const [results,      setResults]      = useState(null)
  const [suggestions,  setSuggestions]  = useState([])
  const [loading,      setLoading]      = useState(false)
  const [loadingSugg,  setLoadingSugg]  = useState(false)
  const [error,        setError]        = useState(null)
  const [lastQuery,    setLastQuery]    = useState("")
  const [blocFilter,   setBlocFilter]   = useState("all")
  const [showExamples, setShowExamples] = useState(false)
  const inputRef = useRef(null)

  const doSearch = async (q) => {
    const trimmed = (q || "").trim()

    if (!trimmed || trimmed.length < 2) {
      setResults({ results: [], total: 0, query: trimmed, warning: true })
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)
    setSuggestions([])
    setLastQuery(trimmed)
    setBlocFilter("all")

    try {
      const res = await axios.get(BASE + "/api/search", {
        params: { q: trimmed, limit: 25 },
      })
      setResults(res.data)
      setLoading(false)

      if (res.data.results && res.data.results.length > 0) {
        setLoadingSugg(true)
        axios
          .post(BASE + "/api/suggest_queries", {
            query: trimmed,
            results: res.data.results.slice(0, 5),
          })
          .then(r => {
            setSuggestions(r.data.suggestions || [])
            setLoadingSugg(false)
          })
          .catch(() => setLoadingSugg(false))
      }
    } catch (e) {
      setError("Search failed — check that the backend is running.")
      setLoading(false)
    }
  }

  const handleSuggestionClick = (s) => {
    setQuery(s)
    doSearch(s)
    if (inputRef.current) inputRef.current.focus()
  }

  const allResults   = (results && results.results) ? results.results : []
  const displayed    = blocFilter === "all"
    ? allResults
    : allResults.filter(r => r.ideological_bloc === blocFilter)

  const examplesLabel = showExamples ? "▲ Hide" : "▼ Show"

  return (
    <section className="w-full">

      {/* ── Header ── */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-200">Semantic Search</h2>
        <p className="text-gray-500 text-sm mt-1">
          Search by meaning — works across languages and with zero keyword overlap.
          Powered by all-MiniLM-L6-v2 + FAISS IndexFlatIP.
        </p>
      </div>

      {/* ── Search input ── */}
      <div className="flex gap-2 mb-3">
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") doSearch(query) }}
          placeholder="Search by topic, theme, or concept (any language)..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5
            text-white placeholder-gray-500 text-sm focus:outline-none
            focus:border-blue-500 transition-colors"
        />
        <button
          onClick={() => doSearch(query)}
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700
            disabled:text-gray-500 rounded-lg text-sm font-semibold
            transition-colors whitespace-nowrap"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* ── Short query warning ── */}
      {query.length > 0 && query.trim().length < 2 && (
        <p className="text-yellow-500 text-xs mb-3">
          Please enter at least 2 characters
        </p>
      )}

      {/* ── Semantic examples ── */}
      <div className="mb-4">
        <button
          onClick={() => setShowExamples(v => !v)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {examplesLabel + " semantic search examples (zero keyword overlap)"}
        </button>

        {showExamples && (
          <div className="mt-2 space-y-2">
            {SEMANTIC_EXAMPLES.map((ex, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg
                  border border-gray-800"
              >
                <span style={getExampleLangStyle(ex.lang)}>{ex.lang}</span>

                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => { setQuery(ex.query); doSearch(ex.query) }}
                    className="text-sm text-blue-300 hover:text-blue-200
                      text-left transition-colors block"
                  >
                    {'"' + ex.query + '"'}
                  </button>
                  <p className="text-xs text-gray-600 mt-0.5">{ex.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="p-3 bg-red-950 border border-red-700 rounded-lg
          text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {/* ── Results ── */}
      {results && !loading && (
        <div>
          {/* Count row */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-xs text-gray-500">
              {results.warning && (
                <span className="text-yellow-500">
                  Query too short — enter at least 2 characters
                </span>
              )}
              {!results.warning && results.total === 0 && (
                <span>{"No results found for \"" + lastQuery + "\""}</span>
              )}
              {!results.warning && results.total > 0 && (
                <span>
                  <strong className="text-gray-300">{results.total}</strong>
                  {" results for "}
                  <strong className="text-gray-300">
                    {'"' + lastQuery + '"'}
                  </strong>
                </span>
              )}
            </p>

            {/* Bloc filter pills */}
            {results.total > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {BLOC_FILTERS.map(f => {
                  const cnt = f.key === "all"
                    ? allResults.length
                    : allResults.filter(r => r.ideological_bloc === f.key).length
                  const isActive = blocFilter === f.key
                  const btnStyle = getFilterBtnStyle(isActive, f.key)
                  return (
                    <button
                      key={f.key}
                      onClick={() => setBlocFilter(f.key)}
                      style={btnStyle}
                    >
                      {f.label + " " + cnt}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Zero results */}
          {results.total === 0 && !results.warning && (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-sm mb-1">
                No posts found matching that query
              </p>
              <p className="text-gray-700 text-xs">
                Try a broader or different term
              </p>
            </div>
          )}

          {/* Cards */}
          {displayed.length > 0 && (
            <div className="mb-4">
              {displayed.map((r, i) => (
                <ResultCard key={i} result={r} index={i} />
              ))}
            </div>
          )}

          {/* Bloc filter returned zero */}
          {results.total > 0 && displayed.length === 0 && (
            <p className="text-gray-500 text-sm py-6 text-center">
              No results from this community for that query
            </p>
          )}

          {/* Query suggestions */}
          {(suggestions.length > 0 || loadingSugg) && (
            <div className="mt-5 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                Explore related topics
              </p>
              {loadingSugg ? (
                <div className="flex gap-2">
                  <div className="h-8 w-32 bg-gray-800 rounded-full animate-pulse" />
                  <div className="h-8 w-32 bg-gray-800 rounded-full animate-pulse" />
                  <div className="h-8 w-32 bg-gray-800 rounded-full animate-pulse" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <SuggestionChip
                      key={i}
                      text={s}
                      onClick={handleSuggestionClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}