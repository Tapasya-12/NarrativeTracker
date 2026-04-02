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
  left:   "#3b82f6",
  center: "#9ca3af",
  right:  "#f97316",
}

const BIAS_LABELS = {
  left:   "Left-Leaning",
  center: "Center",
  right:  "Right-Leaning",
}

const DOMAIN_BIAS_MAP = {
  "theguardian.com": "left",  "nytimes.com":  "left",
  "msnbc.com":       "left",  "huffpost.com": "left",
  "foxnews.com":     "right", "breitbart.com":"right",
  "nypost.com":      "right", "townhall.com": "right",
  "apnews.com":      "center","reuters.com":  "center",
  "politico.com":    "center","nbcnews.com":  "center",
  "thehill.com":     "center","cnn.com":      "center",
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

function getTabBtnStyle(isActive) {
  return {
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    border: "none",
    cursor: "pointer",
    background: isActive ? "#1d4ed8" : "#1f2937",
    color: isActive ? "white" : "#9ca3af",
  }
}

function getCtrlBtnStyle(isActive, activeColor) {
  return {
    borderRadius: "6px",
    padding: "3px 10px",
    fontSize: "11px",
    border: "none",
    cursor: "pointer",
    background: isActive ? (activeColor || "#3b82f6") : "#1f2937",
    color: isActive ? "white" : "#9ca3af",
  }
}

// ── Source Bias sub-components ────────────────────────────────────────────────
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {BLOCS.map(function(b) {
        const stats = byCommunity[b.key]
        if (!stats) return null
        const total     = stats.total || 1
        const leftPct   = (stats.left   / total * 100).toFixed(0)
        const centerPct = (stats.center / total * 100).toFixed(0)
        const rightPct  = (stats.right  / total * 100).toFixed(0)

        return (
          <div key={b.key} style={{
            padding: "12px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid " + (BLOC_COLORS[b.key] || "#6b7280") + "30",
            borderRadius: "8px",
          }}>
            <p style={{
              fontSize: "12px", fontWeight: "600",
              color: BLOC_COLORS[b.key] || "#9ca3af",
              marginBottom: "10px",
            }}>
              {b.label}
            </p>

            <div style={{
              height: "8px", borderRadius: "4px",
              overflow: "hidden", display: "flex", marginBottom: "8px",
            }}>
              <div style={{ width: leftPct + "%",   background: BIAS_COLORS.left   }} />
              <div style={{ width: centerPct + "%", background: BIAS_COLORS.center }} />
              <div style={{ width: rightPct + "%",  background: BIAS_COLORS.right  }} />
            </div>

            {["left", "center", "right"].map(function(bk) {
              return (
                <div key={bk} style={{
                  display: "flex", justifyContent: "space-between",
                  marginBottom: "2px",
                }}>
                  <span style={{ fontSize: "10px", color: BIAS_COLORS[bk] }}>
                    {BIAS_LABELS[bk]}
                  </span>
                  <span style={{ fontSize: "10px", color: "#6b7280" }}>
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

function BiasEdgeRow({ edge }) {
  const bias      = getDomainBias(edge.target)
  const biasColor = BIAS_COLORS[bias]
  const subColor  = BLOC_COLORS[getSubBloc(edge.source)] || "#6b7280"
  const barWidth  = Math.min(120, edge.weight * 4)

  return (
    <div style={{
      display: "flex", alignItems: "center",
      gap: "10px", padding: "8px 12px",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <span style={{
        fontSize: "12px", fontWeight: "600",
        color: subColor, minWidth: "130px",
      }}>
        {"r/" + edge.source}
      </span>
      <div style={{
        flex: 1, display: "flex", alignItems: "center", gap: "6px",
      }}>
        <div style={{
          height: "4px", width: barWidth + "px",
          background: biasColor + "60",
          borderRadius: "2px", minWidth: "4px",
        }} />
        <span style={{ fontSize: "10px", color: "#4b5563" }}>
          {edge.weight + "x"}
        </span>
      </div>
      <span style={{
        fontSize: "12px", fontWeight: "500",
        color: biasColor, minWidth: "160px", textAlign: "right",
      }}>
        {edge.target}
      </span>
      <span style={{
        fontSize: "10px", fontWeight: "600",
        color: biasColor, background: biasColor + "20",
        borderRadius: "4px", padding: "2px 6px",
        minWidth: "75px", textAlign: "center", flexShrink: 0,
      }}>
        {BIAS_LABELS[bias]}
      </span>
    </div>
  )
}

function SourceBiasTab({ sourceData }) {
  const [minWeight,  setMinWeight]  = useState(3)
  const [sortBy,     setSortBy]     = useState("weight")
  const [filterBias, setFilterBias] = useState("all")

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

  return (
    <div>
      <BiasSummaryCards edges={edges} />

      {/* Controls */}
      <div style={{
        display: "flex", flexWrap: "wrap",
        gap: "16px", marginBottom: "16px", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#6b7280" }}>Min citations:</span>
          <div style={{ display: "flex", gap: "4px" }}>
            {[3, 5, 10, 20].map(function(v) {
              return (
                <button
                  key={v}
                  onClick={function() { setMinWeight(v) }}
                  style={getCtrlBtnStyle(minWeight === v, "#3b82f6")}
                >
                  {v + "+"}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#6b7280" }}>Bias:</span>
          <div style={{ display: "flex", gap: "4px" }}>
            {["all", "left", "center", "right"].map(function(bk) {
              const activeColor = bk === "all" ? "#6b7280" : BIAS_COLORS[bk]
              return (
                <button
                  key={bk}
                  onClick={function() { setFilterBias(bk) }}
                  style={getCtrlBtnStyle(filterBias === bk, activeColor)}
                >
                  {bk.charAt(0).toUpperCase() + bk.slice(1)}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#6b7280" }}>Sort:</span>
          <div style={{ display: "flex", gap: "4px" }}>
            {[
              { k: "weight",    l: "Citations" },
              { k: "subreddit", l: "Community" },
              { k: "domain",    l: "Domain"    },
            ].map(function(s) {
              return (
                <button
                  key={s.k}
                  onClick={function() { setSortBy(s.k) }}
                  style={getCtrlBtnStyle(sortBy === s.k, "#3b82f6")}
                >
                  {s.l}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stats + legend */}
      <div style={{
        display: "flex", flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px", gap: "10px",
      }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <span style={{ fontSize: "11px", color: "#6b7280" }}>
            <strong style={{ color: "#d1d5db" }}>{minFiltered.length}</strong>
            {" citation links"}
          </span>
          <span style={{ fontSize: "11px", color: "#6b7280" }}>
            <strong style={{ color: "#d1d5db" }}>{totalCitations}</strong>
            {" total citations"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {["left", "center", "right"].map(function(bk) {
            return (
              <div key={bk} style={{
                display: "flex", alignItems: "center", gap: "5px",
              }}>
                <div style={{
                  width: "10px", height: "10px",
                  borderRadius: "50%", background: BIAS_COLORS[bk],
                }} />
                <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                  {BIAS_LABELS[bk]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Table */}
      {minFiltered.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#6b7280" }}>
            No citations match these filters
          </p>
        </div>
      ) : (
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "10px", overflow: "hidden",
        }}>
          <div style={{
            display: "flex", gap: "10px",
            padding: "8px 12px",
            background: "rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            {[
              { label: "Community",   style: { fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: "130px" } },
              { label: "Volume",      style: { fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", flex: 1 } },
              { label: "News Source", style: { fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: "160px", textAlign: "right" } },
              { label: "Bias",        style: { fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: "75px",  textAlign: "center" } },
            ].map(function(h) {
              return <span key={h.label} style={h.style}>{h.label}</span>
            })}
          </div>
          {minFiltered.map(function(e, i) {
            return <BiasEdgeRow key={i} edge={e} />
          })}
        </div>
      )}
    </div>
  )
}

// ── Main NetworkGraph component ───────────────────────────────────────────────
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
      return node.bias === "left" ? "#3b82f6"
        : node.bias === "right"   ? "#f97316" : "#9ca3af"
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
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 1.5 / globalScale
      ctx.stroke()
    }
    if (globalScale > 1.5) {
      ctx.font = (10 / globalScale) + "px sans-serif"
      ctx.fillStyle = "#e5e7eb"
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

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "12px", flexWrap: "wrap", gap: "12px",
      }}>
        <div>
          <h2 className="text-lg font-semibold text-gray-200">
            Network Analysis
          </h2>
          {!isBiasTab && data && (
            <p className="text-gray-500 text-xs mt-0.5">
              {(data.nodes ? data.nodes.length : 0) + " nodes · " +
               (data.edges ? data.edges.length : 0) + " edges"}
            </p>
          )}
        </div>

        {/* Tab buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          {NET_TYPES.map(function(t) {
            return (
              <button
                key={t.key}
                onClick={function() { setNetType(t.key) }}
                style={getTabBtnStyle(netType === t.key)}
              >
                {t.label}
              </button>
            )
          })}

          {!isBiasTab && topNode && netType !== "source" && (
            <button
              onClick={function() {
                setRemoveNode(removeNode ? null : topNode.id)
              }}
              style={{
                padding: "4px 12px", borderRadius: "6px",
                fontSize: "12px", fontWeight: "500",
                border: "none", cursor: "pointer",
                background: removeNode ? "#065f46" : "#7f1d1d",
                color: removeNode ? "#6ee7b7" : "#fca5a5",
              }}
            >
              {removeNode
                ? "↩ Restore " + topNode.id
                : "✕ Remove Top Node (" + topNode.id + ")"
              }
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-500 text-xs mb-4">
        {NET_DESCRIPTIONS[netType]}
      </p>

      {/* Remove node notice */}
      {removeNode && (
        <div style={{
          marginBottom: "12px", padding: "8px 12px",
          background: "#422006", border: "1px solid #92400e",
          borderRadius: "6px", fontSize: "12px", color: "#fcd34d",
        }}>
          <strong>{removeNode}</strong>
          {" removed. PageRank redistributes across remaining " +
           (data && data.nodes ? data.nodes.length : 0) + " nodes."}
        </div>
      )}

      {/* ── BIAS TAB ── */}
      {isBiasTab && (
        <div>
          {sourceData
            ? <SourceBiasTab sourceData={sourceData} />
            : <div className="h-32 bg-gray-900 rounded-lg animate-pulse" />
          }
        </div>
      )}

      {/* ── GRAPH TABS ── */}
      {!isBiasTab && (
        <div>
          {loading && (
            <div style={{ height: "420px", background: "#0d1117",
              borderRadius: "10px" }}
              className="animate-pulse"
            />
          )}

          {error && !loading && (
            <div style={{
              padding: "12px", background: "#1c0a0a",
              border: "1px solid #7f1d1d", borderRadius: "8px",
              color: "#fca5a5", fontSize: "13px",
            }}>
              Failed to load network data — check that the backend is running
            </div>
          )}

          {!loading && !error && data && data.nodes && data.nodes.length === 0 && (
            <div style={{
              height: "120px", display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "#0d1117", borderRadius: "10px",
              color: "#6b7280", fontSize: "13px",
            }}>
              No network data available
            </div>
          )}

          {!loading && !error && data && data.nodes && data.nodes.length > 0 && (
            <div
              ref={containerRef}
              style={{
                background: "#0d1117", borderRadius: "10px",
                overflow: "hidden", width: "100%",
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
                linkColor={function() { return "rgba(148,163,184,0.25)" }}
                backgroundColor="#0d1117"
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
              marginTop: "10px", padding: "14px",
              background: "#111827",
              border: "1px solid #1f2937", borderRadius: "8px",
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: "10px",
              }}>
                <strong style={{ color: "white", fontSize: "16px" }}>
                  {selected.id}
                </strong>
                <button
                  onClick={function() { setSelected(null) }}
                  style={{
                    background: "none", border: "none",
                    color: "#6b7280", cursor: "pointer", fontSize: "12px",
                  }}
                >
                  ✕ close
                </button>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px 24px",
              }}>
                {selected.pagerank != null && (
                  <>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>PageRank Score</span>
                    <span style={{ fontSize: "11px", color: "white", fontFamily: "monospace" }}>
                      {selected.pagerank.toFixed(6)}
                    </span>
                  </>
                )}
                {selected.post_count != null && (
                  <>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>Total Posts</span>
                    <span style={{ fontSize: "11px", color: "white" }}>
                      {selected.post_count.toLocaleString()}
                    </span>
                  </>
                )}
                {selected.bloc && (
                  <>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>Ideological Bloc</span>
                    <span style={{
                      fontSize: "11px", fontWeight: "600",
                      color: BLOC_COLORS[selected.bloc] || "#9ca3af",
                    }}>
                      {selected.bloc.replace("_", " ")}
                    </span>
                  </>
                )}
                {selected.community != null && (
                  <>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>Louvain Community</span>
                    <span style={{ fontSize: "11px", color: "white" }}>
                      {selected.community}
                    </span>
                  </>
                )}
                {selected.subreddits && selected.subreddits.length > 0 && (
                  <>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>Active Subreddits</span>
                    <span style={{ fontSize: "11px", color: "white" }}>
                      {selected.subreddits.map(function(s) { return "r/" + s }).join(", ")}
                    </span>
                  </>
                )}
                {selected.is_bridge && (
                  <>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>Role</span>
                    <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: "600" }}>
                      ★ Bridge Author — posts across multiple blocs
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Algorithm legend */}
          {!loading && data && data.nodes && data.nodes.length > 0 && (
            <div style={{
              marginTop: "10px", display: "flex",
              flexWrap: "wrap", gap: "16px",
            }}>
              {[
                "Node size = PageRank (directed influence score)",
                "Node color = Louvain community detection",
                netType === "author"    ? "White ring = bridge author (posts in 2+ blocs)" : null,
                netType === "subreddit" ? "Arrows = direction of crosspost flow"            : null,
              ].filter(Boolean).map(function(txt) {
                return (
                  <span key={txt} style={{ fontSize: "11px", color: "#4b5563" }}>
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