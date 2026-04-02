import { useState } from "react"
import { useApi } from "../hooks/useApi"
import { BLOC_COLORS } from "../App"

// Domain bias colors
const BIAS_COLORS = {
  left:   "#3b82f6",
  center: "#9ca3af",
  right:  "#f97316",
}

const BIAS_LABELS = {
  left:   "Left-Leaning",
  center: "Center",
  right:  "Right-Leaning",
}

// Known domain bias (matches backend)
const DOMAIN_BIAS = {
  "theguardian.com":        "left",
  "nytimes.com":            "left",
  "msnbc.com":              "left",
  "huffpost.com":           "left",
  "foxnews.com":            "right",
  "breitbart.com":          "right",
  "nypost.com":             "right",
  "townhall.com":           "right",
  "apnews.com":             "center",
  "reuters.com":            "center",
  "politico.com":           "center",
  "nbcnews.com":            "center",
  "thehill.com":            "center",
  "cnn.com":                "center",
  "newsweek.com":           "center",
}

function getDomainBias(domain) {
  return DOMAIN_BIAS[domain] || "center"
}

function getSubBloc(subreddit) {
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

// ── Edge row in the table view ────────────────────────────────────────────────
function EdgeRow({ edge }) {
  const bias      = getDomainBias(edge.target)
  const biasColor = BIAS_COLORS[bias]
  const subColor  = BLOC_COLORS[getSubBloc(edge.source)] || "#6b7280"

  return (
    <div style={{
      display: "flex", alignItems: "center",
      gap: "10px", padding: "8px 10px",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      {/* Subreddit */}
      <span style={{
        fontSize: "12px", fontWeight: "600",
        color: subColor, minWidth: "120px",
      }}>
        {"r/" + edge.source}
      </span>

      {/* Arrow + edge weight bar */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", gap: "8px",
      }}>
        <div style={{
          height: "4px",
          width: Math.min(120, edge.weight * 4) + "px",
          background: biasColor + "60",
          borderRadius: "2px",
          minWidth: "4px",
        }} />
        <span style={{ fontSize: "10px", color: "#4b5563" }}>
          {edge.weight + "x"}
        </span>
      </div>

      {/* Domain */}
      <span style={{
        fontSize: "12px", fontWeight: "500",
        color: biasColor, textAlign: "right", minWidth: "160px",
      }}>
        {edge.target}
      </span>

      {/* Bias badge */}
      <span style={{
        fontSize: "10px", fontWeight: "600",
        color: biasColor,
        background: biasColor + "20",
        borderRadius: "4px", padding: "2px 6px",
        minWidth: "70px", textAlign: "center",
        flexShrink: 0,
      }}>
        {BIAS_LABELS[bias]}
      </span>
    </div>
  )
}

// ── Summary cards ─────────────────────────────────────────────────────────────
function BiasSummaryCards({ edges }) {
  const byCommunity = {}

  edges.forEach(e => {
    const bloc = getSubBloc(e.source)
    const bias = getDomainBias(e.target)
    if (!byCommunity[bloc]) byCommunity[bloc] = { left: 0, center: 0, right: 0, total: 0 }
    byCommunity[bloc][bias] = (byCommunity[bloc][bias] || 0) + e.weight
    byCommunity[bloc].total += e.weight
  })

  const BLOC_DISPLAY = [
    { key: "left_radical", label: "Left Radical" },
    { key: "center_left",  label: "Center Left"  },
    { key: "right",        label: "Right"         },
    { key: "mixed",        label: "Mixed"         },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {BLOC_DISPLAY.map(({ key, label }) => {
        const stats = byCommunity[key]
        if (!stats) return null
        const total = stats.total || 1

        return (
          <div key={key} style={{
            padding: "12px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid " + (BLOC_COLORS[key] || "#6b7280") + "30",
            borderRadius: "8px",
          }}>
            <p style={{
              fontSize: "12px", fontWeight: "600",
              color: BLOC_COLORS[key] || "#9ca3af",
              marginBottom: "10px",
            }}>
              {label}
            </p>

            {/* Stacked bar */}
            <div style={{
              height: "8px", borderRadius: "4px",
              overflow: "hidden", display: "flex",
              marginBottom: "8px",
            }}>
              <div style={{
                width: (stats.left / total * 100) + "%",
                background: BIAS_COLORS.left,
              }} />
              <div style={{
                width: (stats.center / total * 100) + "%",
                background: BIAS_COLORS.center,
              }} />
              <div style={{
                width: (stats.right / total * 100) + "%",
                background: BIAS_COLORS.right,
              }} />
            </div>

            {/* Counts */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {[
                { k: "left",   label: "Left",   v: stats.left   },
                { k: "center", label: "Center", v: stats.center },
                { k: "right",  label: "Right",  v: stats.right  },
              ].map(item => (
                <div key={item.k} style={{
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: "10px", color: BIAS_COLORS[item.k] }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: "10px", color: "#6b7280" }}>
                    {item.v || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SourceBiasNetwork() {
  const [minWeight,   setMinWeight]   = useState(3)
  const [sortBy,      setSortBy]      = useState("weight")
  const [filterBias,  setFilterBias]  = useState("all")

  const { data, loading, error } = useApi("/api/source_network", {
    min_weight: minWeight,
  })

  const edges = data ? data.edges || [] : []

  // Filter by bias
  const filtered = filterBias === "all"
    ? edges
    : edges.filter(e => getDomainBias(e.target) === filterBias)

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "weight") return b.weight - a.weight
    if (sortBy === "subreddit") return a.source.localeCompare(b.source)
    return a.target.localeCompare(b.target)
  })

  const totalCitations = edges.reduce((s, e) => s + e.weight, 0)

  return (
    <section className="w-full">

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-200">
          Source Bias Citation Network
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Which news sources does each community cite? The echo chamber is
          visible as structure — right-bloc communities almost never cite
          left-leaning sources, and vice versa.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        {/* Min weight filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>Min citations:</span>
          <div className="flex gap-1">
            {[3, 5, 10, 20].map(v => (
              <button
                key={v}
                onClick={() => setMinWeight(v)}
                className="px-2.5 py-0.5 rounded text-xs transition-colors"
                style={minWeight === v
                  ? { background: "#3b82f6", color: "white" }
                  : { background: "#1f2937", color: "#9ca3af" }}
              >
                {v + "+"}
              </button>
            ))}
          </div>
        </div>

        {/* Bias filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>Source bias:</span>
          <div className="flex gap-1">
            {[
              { key: "all",    label: "All"    },
              { key: "left",   label: "Left"   },
              { key: "center", label: "Center" },
              { key: "right",  label: "Right"  },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterBias(f.key)}
                className="px-2.5 py-0.5 rounded text-xs transition-colors"
                style={filterBias === f.key
                  ? { background: f.key === "all" ? "#6b7280" : BIAS_COLORS[f.key], color: "white" }
                  : { background: "#1f2937", color: "#9ca3af" }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>Sort:</span>
          <div className="flex gap-1">
            {[
              { key: "weight",    label: "Citations" },
              { key: "subreddit", label: "Community" },
              { key: "domain",    label: "Domain"    },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className="px-2.5 py-0.5 rounded text-xs transition-colors"
                style={sortBy === s.key
                  ? { background: "#3b82f6", color: "white" }
                  : { background: "#1f2937", color: "#9ca3af" }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="h-64 bg-gray-900 rounded-lg animate-pulse" />
      )}

      {/* Error */}
      {error && !loading && (
        <div className="p-3 bg-red-950 border border-red-700 rounded-lg
          text-red-300 text-sm mb-4">
          Failed to load source network — check that the backend is running
        </div>
      )}

      {data && !loading && (
        <div>
          {/* Stats strip */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500">
            <span>
              <strong className="text-gray-300">{sorted.length}</strong> citation links
            </span>
            <span>
              <strong className="text-gray-300">{totalCitations}</strong> total citations
            </span>
          </div>

          {/* Summary stacked bar cards */}
          <BiasSummaryCards edges={edges} />

          {/* Legend */}
          <div className="flex gap-4 mb-3 flex-wrap">
            {Object.entries(BIAS_COLORS).map(([bias, color]) => (
              <div key={bias} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: color }} />
                <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                  {BIAS_LABELS[bias]}
                </span>
              </div>
            ))}
          </div>

          {/* Citation table */}
          {sorted.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">
                No citations match these filters
              </p>
            </div>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "10px",
              overflow: "hidden",
            }}>
              {/* Table header */}
              <div style={{
                display: "flex", gap: "10px",
                padding: "8px 10px",
                background: "rgba(255,255,255,0.04)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}>
                <span style={{ fontSize: "10px", color: "#6b7280",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  minWidth: "120px" }}>
                  Community
                </span>
                <span style={{ fontSize: "10px", color: "#6b7280",
                  textTransform: "uppercase", letterSpacing: "0.06em", flex: 1 }}>
                  Citations
                </span>
                <span style={{ fontSize: "10px", color: "#6b7280",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  minWidth: "160px", textAlign: "right" }}>
                  News Source
                </span>
                <span style={{ fontSize: "10px", color: "#6b7280",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  minWidth: "70px", textAlign: "center" }}>
                  Bias
                </span>
              </div>

              {/* Rows */}
              {sorted.map((e, i) => (
                <EdgeRow key={i} edge={e} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}