import { useState, useCallback, useEffect, useRef } from "react"
import { useApi } from "../hooks/useApi"
import { BLOC_COLORS } from "../App"
import ForceGraph2D from "react-force-graph-2d"

const NET_TYPES = [
  { key: "subreddit", label: "Subreddit Crosspost" },
  { key: "author",    label: "Author Influence"    },
  { key: "source",    label: "Source Citation"     },
  { key: "bias",      label: "Source Bias"         },
]

const NET_DESCRIPTIONS = {
  subreddit:
    "Directed graph: arrows show crosspost flow between subreddits. Node size = PageRank. Colors = ideological bloc. Louvain community detection groups structurally similar nodes.",
  author:
    "Undirected graph: edges connect authors who posted in the same subreddit. Node size = PageRank. White ring = bridge author (posted across multiple ideological blocs).",
  source:
    "Bipartite graph: subreddit nodes connected to news domain nodes. Edge thickness = citation count. Domain color: blue = left-leaning, gray = center, orange = right-leaning.",
  bias:
    "Which news sources does each community cite? The echo chamber is visible as structure — right-bloc communities almost never cite left-leaning sources, and vice versa.",
}

const BIAS_COLORS = {
  left:   "#4f8ef7",
  center: "#7a8fa6",
  right:  "#fb923c",
}

const BIAS_LABELS = {
  left:   "Left-Leaning",
  center: "Center",
  right:  "Right-Leaning",
}

const DOMAIN_BIAS_MAP = {
  "theguardian.com": "left",  "nytimes.com":   "left",
  "msnbc.com":       "left",  "huffpost.com":  "left",
  "foxnews.com":     "right", "breitbart.com": "right",
  "nypost.com":      "right", "townhall.com":  "right",
  "apnews.com":      "center","reuters.com":   "center",
  "politico.com":    "center","nbcnews.com":   "center",
  "thehill.com":     "center","cnn.com":       "center",
  "newsweek.com":    "center",
}

const SUB_BLOC_MAP = {
  Anarchism: "left_radical", socialism: "left_radical",
  Liberal: "center_left", democrats: "center_left",
  politics: "center_left", neoliberal: "center_left",
  PoliticalDiscussion: "center_left",
  Conservative: "right", Republican: "right",
  worldpolitics: "mixed",
}

function getDomainBias(domain) {
  return DOMAIN_BIAS_MAP[domain] || "center"
}

function getSubBloc(subreddit) {
  return SUB_BLOC_MAP[subreddit] || "other"
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function ctrlBtn(isActive, activeColor) {
  return {
    padding: "4px 11px",
    borderRadius: "var(--r-sm)",
    fontSize: "11px", fontWeight: "500",
    border: "1px solid " + (isActive ? "transparent" : "var(--border)"),
    cursor: "pointer", transition: "all 0.15s",
    fontFamily: "inherit",
    background: isActive ? (activeColor || "var(--blue)") : "rgba(255,255,255,0.04)",
    color: isActive ? "white" : "var(--text-sec)",
  }
}

// ── Bias summary cards ────────────────────────────────────────────────────────
function BiasSummaryCards({ edges }) {
  const byCommunity = {}
  edges.forEach(function(e) {
    const bloc = getSubBloc(e.source)
    const bias = getDomainBias(e.target)
    if (!byCommunity[bloc]) {
      byCommunity[bloc] = { left: 0, center: 0, right: 0, total: 0 }
    }
    byCommunity[bloc][bias] = (byCommunity[bloc][bias] || 0) + e.weight
    byCommunity[bloc].total += e.weight
  })

  const BLOCS = [
    { key: "left_radical", label: "Left Radical" },
    { key: "center_left",  label: "Center Left"  },
    { key: "right",        label: "Right"         },
    { key: "mixed",        label: "Mixed"         },
  ]

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "10px",
      marginBottom: "20px",
    }}>
      {BLOCS.map(function(b) {
        const stats = byCommunity[b.key]
        if (!stats) return null
        const total     = stats.total || 1
        const leftPct   = (stats.left   / total * 100).toFixed(0)
        const centerPct = (stats.center / total * 100).toFixed(0)
        const rightPct  = (stats.right  / total * 100).toFixed(0)
        const color     = BLOC_COLORS[b.key] || "#6b7280"

        return (
          <div key={b.key} style={{
            padding: "14px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderTop: "2px solid " + color,
            borderRadius: "var(--r-md)",
          }}>
            <p style={{
              fontSize: "11px", fontWeight: "700",
              color: color, marginBottom: "10px",
              letterSpacing: "0.02em",
            }}>
              {b.label}
            </p>

            {/* Stacked bar */}
            <div style={{
              height: "6px", borderRadius: "999px",
              overflow: "hidden", display: "flex",
              marginBottom: "10px",
              background: "var(--bg-elevated)",
            }}>
              <div style={{ width: leftPct   + "%", background: BIAS_COLORS.left,   transition: "width 0.4s" }} />
              <div style={{ width: centerPct + "%", background: BIAS_COLORS.center, transition: "width 0.4s" }} />
              <div style={{ width: rightPct  + "%", background: BIAS_COLORS.right,  transition: "width 0.4s" }} />
            </div>

            {/* Counts */}
            {["left", "center", "right"].map(function(bk) {
              return (
                <div key={bk} style={{
                  display: "flex", justifyContent: "space-between",
                  marginBottom: "3px",
                }}>
                  <span style={{ fontSize: "10px", color: BIAS_COLORS[bk] }}>
                    {BIAS_LABELS[bk]}
                  </span>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--text-sec)" }}>
                    {stats[bk] || 0}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── Bias edge row ─────────────────────────────────────────────────────────────
function BiasEdgeRow({ edge }) {
  const bias      = getDomainBias(edge.target)
  const biasColor = BIAS_COLORS[bias]
  const subColor  = BLOC_COLORS[getSubBloc(edge.source)] || "#6b7280"
  const barWidth  = Math.min(100, edge.weight * 3)

  return (
    <div
      className="trow"
      style={{
        display: "flex", alignItems: "center",
        gap: "10px", padding: "9px 14px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span className="mono" style={{
        fontSize: "12px", fontWeight: "600",
        color: subColor, minWidth: "140px",
      }}>
        {"r/" + edge.source}
      </span>

      <div style={{
        flex: 1, display: "flex", alignItems: "center", gap: "8px",
      }}>
        <div style={{
          height: "3px", width: barWidth + "px",
          background: biasColor + "50",
          borderRadius: "2px", minWidth: "4px",
        }} />
        <span className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
          {edge.weight + "×"}
        </span>
      </div>

      <span style={{
        fontSize: "12px", color: "var(--text-sec)",
        minWidth: "160px", textAlign: "right",
      }}>
        {edge.target}
      </span>

      <span style={{
        fontSize: "10px", fontWeight: "600",
        color: biasColor,
        background: biasColor + "15",
        border: "1px solid " + biasColor + "30",
        borderRadius: "999px",
        padding: "2px 8px",
        minWidth: "80px", textAlign: "center",
        flexShrink: 0,
      }}>
        {BIAS_LABELS[bias]}
      </span>
    </div>
  )
}

// ── Source Bias tab ───────────────────────────────────────────────────────────
function SourceBiasTab({ sourceData }) {
  const [minWeight,  setMinWeight]  = useState(3)
  const [sortBy,     setSortBy]     = useState("weight")
  const [filterBias, setFilterBias] = useState("all")
  const [pageSize,   setPageSize]   = useState(15)

  const edges = sourceData ? sourceData.edges || [] : []

  const filtered = filterBias === "all"
    ? edges
    : edges.filter(function(e) { return getDomainBias(e.target) === filterBias })

  const sorted = filtered.slice().sort(function(a, b) {
    if (sortBy === "weight")    return b.weight - a.weight
    if (sortBy === "subreddit") return a.source.localeCompare(b.source)
    return a.target.localeCompare(b.target)
  })

  const minFiltered    = sorted.filter(function(e) { return e.weight >= minWeight })
  const totalCitations = edges.reduce(function(s, e) { return s + e.weight }, 0)
  const visible        = minFiltered.slice(0, pageSize)
  const remaining      = minFiltered.length - pageSize
  const hasMore        = remaining > 0

  // Reset page when filters change
  const handleFilter = function(setter, val) {
    setter(val)
    setPageSize(15)
  }

  return (
    <div>
      <BiasSummaryCards edges={edges} />

      {/* Controls row */}
      <div style={{
        display: "flex", flexWrap: "wrap",
        gap: "20px", marginBottom: "16px",
        alignItems: "center",
        padding: "12px 14px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-sm)",
      }}>
        {/* Min citations */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-dim)",
            textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Min
          </span>
          <div style={{ display: "flex", gap: "3px" }}>
            {[3, 5, 10, 20].map(function(v) {
              return (
                <button
                  key={v}
                  onClick={function() { handleFilter(setMinWeight, v) }}
                  style={ctrlBtn(minWeight === v, "var(--blue)")}
                >
                  {v + "+"}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bias filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-dim)",
            textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Bias
          </span>
          <div style={{ display: "flex", gap: "3px" }}>
            {["all", "left", "center", "right"].map(function(bk) {
              const activeColor = bk === "all"
                ? "var(--blue)"
                : BIAS_COLORS[bk]
              return (
                <button
                  key={bk}
                  onClick={function() { handleFilter(setFilterBias, bk) }}
                  style={ctrlBtn(filterBias === bk, activeColor)}
                >
                  {bk.charAt(0).toUpperCase() + bk.slice(1)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-dim)",
            textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Sort
          </span>
          <div style={{ display: "flex", gap: "3px" }}>
            {[
              { k: "weight",    l: "Citations" },
              { k: "subreddit", l: "Community" },
              { k: "domain",    l: "Domain"    },
            ].map(function(s) {
              return (
                <button
                  key={s.k}
                  onClick={function() { setSortBy(s.k) }}
                  style={ctrlBtn(sortBy === s.k, "var(--blue)")}
                >
                  {s.l}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stats strip + legend */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap",
        gap: "10px", marginBottom: "12px",
      }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-sec)" }}>
            <span className="mono" style={{ color: "var(--text-primary)", fontWeight: "600" }}>
              {minFiltered.length}
            </span>
            {" citation links"}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-sec)" }}>
            <span className="mono" style={{ color: "var(--text-primary)", fontWeight: "600" }}>
              {totalCitations.toLocaleString()}
            </span>
            {" total citations"}
          </span>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "12px" }}>
          {["left", "center", "right"].map(function(bk) {
            return (
              <div key={bk} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{
                  width: "8px", height: "8px",
                  borderRadius: "50%", background: BIAS_COLORS[bk],
                }} />
                <span style={{ fontSize: "10px", color: "var(--text-sec)" }}>
                  {BIAS_LABELS[bk]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Table */}
      {minFiltered.length === 0 ? (
        <div style={{
          padding: "48px", textAlign: "center",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
        }}>
          <p style={{ fontSize: "13px", color: "var(--text-sec)" }}>
            No citations match these filters
          </p>
        </div>
      ) : (
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          overflow: "hidden",
        }}>
          {/* Table header */}
          <div style={{
            display: "flex", gap: "10px",
            padding: "9px 14px",
            background: "var(--bg-elevated)",
            borderBottom: "1px solid var(--border)",
          }}>
            {[
              { label: "Community",   w: "140px"  },
              { label: "Volume",      flex: 1      },
              { label: "News Source", w: "160px", right: true },
              { label: "Bias",        w: "80px",  center: true },
            ].map(function(h) {
              return (
                <span key={h.label} style={{
                  fontSize: "9px", fontWeight: "700",
                  color: "var(--text-dim)",
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  minWidth: h.w || undefined,
                  flex: h.flex || undefined,
                  textAlign: h.right ? "right" : h.center ? "center" : "left",
                }}>
                  {h.label}
                </span>
              )
            })}
          </div>

          {/* Rows */}
          {visible.map(function(e, i) {
            return <BiasEdgeRow key={i} edge={e} />
          })}

          {/* Show more */}
          {hasMore && (
            <div style={{
              padding: "14px 16px",
              borderTop: "1px solid var(--border)",
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                {"Showing " + visible.length + " of " + minFiltered.length + " results"}
              </span>
              <button
                onClick={function() { setPageSize(function(p) { return p + 15 }) }}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-sm)",
                  color: "var(--text-sec)",
                  fontSize: "12px", padding: "6px 18px",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
                onMouseEnter={function(e) {
                  e.currentTarget.style.borderColor = "var(--border-mid)"
                  e.currentTarget.style.color = "var(--text-primary)"
                }}
                onMouseLeave={function(e) {
                  e.currentTarget.style.borderColor = "var(--border)"
                  e.currentTarget.style.color = "var(--text-sec)"
                }}
              >
                {"Show " + Math.min(15, remaining) + " more"}
              </button>
            </div>
          )}

          {/* All shown */}
          {!hasMore && minFiltered.length > 0 && (
            <div style={{
              padding: "10px 16px",
              borderTop: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: "11px", color: "var(--text-dim)", textAlign: "center" }}>
                {"All " + minFiltered.length + " results shown"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NetworkGraph() {
  const [netType,    setNetType]    = useState("subreddit")
  const [removeNode, setRemoveNode] = useState(null)
  const [selected,   setSelected]   = useState(null)
  const [dimensions, setDimensions] = useState({ w: 900, h: 420 })
  const containerRef = useRef(null)

  const isBiasTab = netType === "bias"

  const { data, loading, error } = useApi(
    isBiasTab ? null : "/api/network",
    isBiasTab ? {} : {
      type: netType,
      ...(removeNode ? { remove_node: removeNode } : {}),
    }
  )

  const { data: sourceData } = useApi(
    isBiasTab ? "/api/source_network" : null,
    { min_weight: 3 }
  )

  useEffect(function() {
    function measure() {
      if (!containerRef.current) return
      const w = containerRef.current.getBoundingClientRect().width
      if (w > 0) setDimensions({ w: Math.floor(w), h: 420 })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    const t = setTimeout(measure, 150)
    return function() { observer.disconnect(); clearTimeout(t) }
  }, [])

  useEffect(function() {
    setSelected(null)
    setRemoveNode(null)
  }, [netType])

  const topNode = data && data.nodes
    ? data.nodes.reduce(function(top, n) {
        return (n.pagerank || 0) > (top ? top.pagerank || 0 : 0) ? n : top
      }, null)
    : null

  const nodeColor = useCallback(function(node) {
    if (netType === "source") {
      if (node.type === "subreddit") return BLOC_COLORS[node.bloc] || "#6b7280"
      return node.bias === "left"  ? "#4f8ef7"
           : node.bias === "right" ? "#fb923c" : "#7a8fa6"
    }
    return BLOC_COLORS[node.bloc] || "#6b7280"
  }, [netType])

  const nodeVal = useCallback(function(node) {
    return Math.max(2, Math.min(20, (node.pagerank || 0) * 8000 + 3))
  }, [])

  const nodePainter = useCallback(function(node, ctx, globalScale) {
    const size  = Math.max(2, Math.min(20, (node.pagerank || 0) * 8000 + 3))
    const color = nodeColor(node)
    ctx.beginPath()
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
    if (node.is_bridge) {
      ctx.strokeStyle = "rgba(255,255,255,0.7)"
      ctx.lineWidth = 1.5 / globalScale
      ctx.stroke()
    }
    if (globalScale > 1.5) {
      ctx.font = (10 / globalScale) + "px Inter, sans-serif"
      ctx.fillStyle = "#e2e8f0"
      ctx.textAlign = "center"
      ctx.fillText(node.id, node.x, node.y + size + 8 / globalScale)
    }
  }, [nodeColor])

  const graphData = data
    ? {
        nodes: data.nodes.map(function(n) { return Object.assign({}, n) }),
        links: data.edges.map(function(e) {
          return Object.assign({}, e, { source: e.source, target: e.target })
        }),
      }
    : { nodes: [], links: [] }

  return (
    <section className="w-full">

      {/* Header */}
      <div className="sec-head">
        <div>
          <p className="sec-title">Network Analysis</p>
          {!isBiasTab && data && (
            <p className="sec-desc">
              {(data.nodes ? data.nodes.length : 0) + " nodes · " +
               (data.edges ? data.edges.length : 0) + " edges"}
            </p>
          )}
        </div>

        {/* Tabs + action buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
          {NET_TYPES.map(function(t) {
            const isActive = netType === t.key
            return (
              <button
                key={t.key}
                onClick={function() { setNetType(t.key) }}
                className={isActive ? "btn btn-active" : "btn btn-ghost"}
              >
                {t.label}
              </button>
            )
          })}

          {/* Remove / Restore top node */}
          {!isBiasTab && topNode && netType !== "source" && (
            <button
              onClick={function() {
                setRemoveNode(removeNode ? null : topNode.id)
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--r-sm)",
                fontSize: "12px", fontWeight: "500",
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
                background: removeNode
                  ? "rgba(52,211,153,0.1)"
                  : "rgba(248,113,113,0.1)",
                border: removeNode
                  ? "1px solid rgba(52,211,153,0.25)"
                  : "1px solid rgba(248,113,113,0.25)",
                color: removeNode ? "#6ee7b7" : "#fca5a5",
              }}
            >
              {removeNode
                ? "↩ Restore " + topNode.id
                : "✕ Remove " + topNode.id
              }
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="sec-desc" style={{ marginBottom: "20px" }}>
        {NET_DESCRIPTIONS[netType]}
      </p>

      {/* Remove node notice */}
      {removeNode && (
        <div style={{
          marginBottom: "16px", padding: "10px 14px",
          background: "rgba(251,191,36,0.05)",
          border: "1px solid rgba(251,191,36,0.15)",
          borderLeft: "3px solid rgba(251,191,36,0.5)",
          borderRadius: "var(--r-sm)",
          fontSize: "12px", color: "#fcd34d",
        }}>
          <strong>{removeNode}</strong>
          {" removed from graph. PageRank redistributes across " +
           (data && data.nodes ? data.nodes.length : 0) + " remaining nodes."}
        </div>
      )}

      {/* ── Bias tab ── */}
      {isBiasTab && (
        <div>
          {sourceData
            ? <SourceBiasTab sourceData={sourceData} />
            : <div className="skeleton" style={{ height: "200px" }} />
          }
        </div>
      )}

      {/* ── Graph tabs ── */}
      {!isBiasTab && (
        <div>
          {/* Loading */}
          {loading && (
            <div
              className="skeleton"
              style={{ height: "420px", borderRadius: "var(--r-md)" }}
            />
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{
              padding: "14px 16px",
              background: "rgba(248,113,113,0.05)",
              border: "1px solid rgba(248,113,113,0.15)",
              borderRadius: "var(--r-md)",
              color: "#fca5a5", fontSize: "13px",
            }}>
              Failed to load network data — check that the backend is running
            </div>
          )}

          {/* Empty */}
          {!loading && !error && data && data.nodes && data.nodes.length === 0 && (
            <div style={{
              height: "160px", display: "flex",
              alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: "8px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
            }}>
              <p style={{ fontSize: "13px", color: "var(--text-sec)" }}>
                No network data available
              </p>
            </div>
          )}

          {/* Force graph */}
          {!loading && !error && data && data.nodes && data.nodes.length > 0 && (
            <div
              ref={containerRef}
              style={{
                background: "#03070f",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                overflow: "hidden",
                width: "100%",
                height: dimensions.h + "px",
              }}
            >
              <ForceGraph2D
                graphData={graphData}
                nodeColor={nodeColor}
                nodeVal={nodeVal}
                nodeCanvasObject={nodePainter}
                nodeCanvasObjectMode={function() { return "replace" }}
                nodeLabel={function(n) {
                  return n.id +
                    "\nPageRank: " + (n.pagerank || 0).toFixed(4) +
                    "\nPosts: " + (n.post_count || 0) +
                    (n.is_bridge ? "\n★ Bridge author" : "")
                }}
                linkWidth={function(l) { return Math.sqrt((l.weight || 1) * 0.8) }}
                linkDirectionalArrowLength={netType === "subreddit" ? 5 : 0}
                linkDirectionalArrowRelPos={0.85}
                linkColor={function() { return "rgba(148,163,184,0.15)" }}
                backgroundColor="#03070f"
                width={dimensions.w}
                height={dimensions.h}
                onNodeClick={function(n) {
                  setSelected(function(prev) {
                    return prev && prev.id === n.id ? null : n
                  })
                }}
                cooldownTicks={120}
                d3AlphaDecay={0.025}
                d3VelocityDecay={0.4}
              />
            </div>
          )}

          {/* Selected node panel */}
          {selected && !loading && (
            <div style={{
              marginTop: "12px", padding: "16px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: "14px",
              }}>
                <p style={{
                  fontSize: "15px", fontWeight: "600",
                  color: "var(--text-primary)",
                }}>
                  {selected.id}
                </p>
                <button
                  onClick={function() { setSelected(null) }}
                  style={{
                    background: "none", border: "none",
                    color: "var(--text-dim)", cursor: "pointer",
                    fontSize: "12px", padding: "2px 6px",
                    borderRadius: "var(--r-sm)",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={function(e) {
                    e.currentTarget.style.color = "var(--text-primary)"
                  }}
                  onMouseLeave={function(e) {
                    e.currentTarget.style.color = "var(--text-dim)"
                  }}
                >
                  ✕ close
                </button>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "8px",
              }}>
                {[
                  selected.pagerank != null && {
                    label: "PageRank Score",
                    value: selected.pagerank.toFixed(6),
                    mono: true,
                  },
                  selected.post_count != null && {
                    label: "Total Posts",
                    value: selected.post_count.toLocaleString(),
                  },
                  selected.bloc && {
                    label: "Ideological Bloc",
                    value: selected.bloc.replace("_", " "),
                    color: BLOC_COLORS[selected.bloc],
                  },
                  selected.community != null && {
                    label: "Louvain Community",
                    value: String(selected.community),
                  },
                  selected.subreddits && selected.subreddits.length > 0 && {
                    label: "Active In",
                    value: selected.subreddits.map(function(s) { return "r/" + s }).join(", "),
                  },
                  selected.is_bridge && {
                    label: "Role",
                    value: "Bridge Author — posts across multiple blocs",
                    color: "#fbbf24",
                  },
                ].filter(Boolean).map(function(item) {
                  return (
                    <div key={item.label} style={{
                      padding: "10px 12px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                    }}>
                      <p style={{
                        fontSize: "9px", fontWeight: "600",
                        color: "var(--text-dim)",
                        textTransform: "uppercase", letterSpacing: "0.09em",
                        marginBottom: "5px",
                      }}>
                        {item.label}
                      </p>
                      <p style={{
                        fontSize: "12px", fontWeight: "500",
                        color: item.color || "var(--text-primary)",
                        fontFamily: item.mono ? "var(--text-mono)" : "inherit",
                      }}>
                        {item.value}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          {!loading && data && data.nodes && data.nodes.length > 0 && (
            <div style={{
              marginTop: "12px", display: "flex",
              flexWrap: "wrap", gap: "6px",
            }}>
              {[
                "Node size = PageRank",
                "Node color = Louvain community",
                netType === "author"    ? "White ring = bridge author" : null,
                netType === "subreddit" ? "Arrows = crosspost direction" : null,
              ].filter(Boolean).map(function(txt) {
                return (
                  <span key={txt} style={{
                    fontSize: "10px", color: "var(--text-sec)",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "999px",
                    padding: "3px 10px",
                  }}>
                    {txt}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

    </section>
  )
}