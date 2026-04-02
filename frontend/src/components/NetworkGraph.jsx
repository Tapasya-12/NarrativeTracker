import { useState, useCallback, useEffect, useRef } from "react"
import { useApi } from "../hooks/useApi"
import { BLOC_COLORS } from "../App"

// Dynamic import of ForceGraph to avoid SSR/window issues
import ForceGraph2D from "react-force-graph-2d"

// ── Network type definitions ─────────────────────────────────────────────────
const NET_TYPES = [
  { key: "subreddit", label: "Subreddit Crosspost" },
  { key: "author",    label: "Author Influence"   },
  { key: "source",    label: "Source Citation"     },
]

// ── Explanations shown below each network type ───────────────────────────────
const NET_DESCRIPTIONS = {
  subreddit:
    "Directed graph: arrows show crosspost flow between subreddits. Node size = PageRank (influence score). Colors = ideological bloc. Louvain community detection groups structurally similar nodes.",
  author:
    "Undirected graph: edges connect authors who posted in the same subreddit. Node size = PageRank. White ring = bridge author (posted across multiple ideological blocs). 86 bridge authors exist in this dataset.",
  source:
    "Bipartite graph: subreddit nodes (left) connected to news domain nodes (right). Edge thickness = citation count. Domain color: blue=left-leaning, gray=center, orange=right-leaning.",
}

export default function NetworkGraph() {
  const [netType,    setNetType]    = useState("subreddit")
  const [removeNode, setRemoveNode] = useState(null)
  const [selected,   setSelected]   = useState(null)
  const [dimensions, setDimensions] = useState({ w: 900, h: 420 })
  const containerRef = useRef(null)

  // ── Fetch network data — re-fetches when type or removed node changes ───────
  const { data, loading, error } = useApi("/api/network", {
    type: netType,
    ...(removeNode ? { remove_node: removeNode } : {}),
  })

  // ── Measure container width for responsive graph sizing ──────────────────
  useEffect(() => {
  const measure = () => {
    if (!containerRef.current) return
    const w = containerRef.current.getBoundingClientRect().width
    if (w > 0) setDimensions({ w: Math.floor(w), h: 420 })
  }

  measure() // measure immediately on mount

  const observer = new ResizeObserver(measure)
  if (containerRef.current) observer.observe(containerRef.current)

  // Also measure after a short delay in case layout hasn't settled
  const t = setTimeout(measure, 150)

  return () => {
    observer.disconnect()
    clearTimeout(t)
  }
}, [])

  // ── Reset selected node when switching network types ─────────────────────
  useEffect(() => {
    setSelected(null)
    setRemoveNode(null)
  }, [netType])

  // ── Find highest PageRank node — this is the "top node" to remove ─────────
  const topNode = data?.nodes?.reduce(
    (top, n) => ((n.pagerank || 0) > (top?.pagerank || 0) ? n : top),
    null
  )

  // ── Node color logic — different rules per network type ──────────────────
  const nodeColor = useCallback(
    (node) => {
      if (netType === "source") {
        if (node.type === "subreddit") {
          return BLOC_COLORS[node.bloc] || "#6b7280"
        }
        // domain node: color by bias
        return node.bias === "left"
          ? "#3b82f6"
          : node.bias === "right"
          ? "#f97316"
          : "#9ca3af"
      }
      // subreddit and author networks: color by bloc
      return BLOC_COLORS[node.bloc] || "#6b7280"
    },
    [netType]
  )

  // ── Node size — scaled from PageRank value ────────────────────────────────
  const nodeVal = useCallback((node) => {
    const pr = node.pagerank || 0
    return Math.max(2, Math.min(20, pr * 8000 + 3))
  }, [])

  // ── Node canvas painter — adds white ring for bridge authors ──────────────
  const nodePainter = useCallback(
    (node, ctx, globalScale) => {
      const size = Math.max(2, Math.min(20, (node.pagerank || 0) * 8000 + 3))
      const color = nodeColor(node)

      // Draw main circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()

      // White ring for bridge authors
      if (node.is_bridge) {
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 1.5 / globalScale
        ctx.stroke()
      }

      // Node label (only visible when zoomed in enough)
      if (globalScale > 1.5) {
        ctx.font = `${10 / globalScale}px sans-serif`
        ctx.fillStyle = "#e5e7eb"
        ctx.textAlign = "center"
        ctx.fillText(node.id, node.x, node.y + size + 8 / globalScale)
      }
    },
    [nodeColor]
  )

  // ── Build graph data — transform "edges" → "links" for ForceGraph ─────────
  const graphData = data
    ? {
        nodes: data.nodes.map((n) => ({ ...n })),
        links: data.edges.map((e) => ({
          ...e,
          source: e.source,
          target: e.target,
        })),
      }
    : { nodes: [], links: [] }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading)
    return (
      <section>
        <h2 className="text-lg font-semibold text-gray-200 mb-3">
          Network Analysis
        </h2>
        <div className="h-64 animate-pulse bg-gray-900 rounded" />
      </section>
    )

  // ── Error state ───────────────────────────────────────────────────────────
  if (error)
    return (
      <section>
        <h2 className="text-lg font-semibold text-gray-200 mb-3">
          Network Analysis
        </h2>
        <div className="p-4 bg-red-950 border border-red-700 rounded text-red-300 text-sm">
          Failed to load network data — check that the backend is running
        </div>
      </section>
    )

  // ── Empty state — handles disconnected or no-data graphs ─────────────────
  if (!data || data.nodes?.length === 0)
    return (
      <section>
        <h2 className="text-lg font-semibold text-gray-200 mb-3">
          Network Analysis
        </h2>
        <div className="h-32 flex items-center justify-center text-gray-500 text-sm bg-gray-900 rounded">
          No network data available for this configuration
        </div>
      </section>
    )

  return (
    <section className="w-full">
      {/* ── Header row ── */}
      <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-200">
            Network Analysis
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {data.nodes?.length} nodes · {data.edges?.length} edges
          </p>
        </div>

        {/* ── Network type tabs + Remove Node button ── */}
        <div className="flex flex-wrap gap-1 items-center">
          {NET_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setNetType(t.key)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                netType === t.key
                  ? "bg-blue-700 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* Remove top node button — only for subreddit and author networks */}
          {topNode && netType !== "source" && (
            <button
              onClick={() =>
                setRemoveNode(removeNode ? null : topNode.id)
              }
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                removeNode
                  ? "bg-green-800 text-green-200 hover:bg-green-700"
                  : "bg-red-900 text-red-200 hover:bg-red-800"
              }`}
            >
              {removeNode
                ? `↩ Restore ${topNode.id}`
                : `✕ Remove Top Node (${topNode.id})`}
            </button>
          )}
        </div>
      </div>

      {/* ── Node removal notice ── */}
      {removeNode && (
        <div className="mb-3 px-3 py-2 bg-yellow-950 border border-yellow-700 rounded text-yellow-200 text-xs">
          <strong>{removeNode}</strong> removed from graph. PageRank
          redistributes across remaining {data.nodes?.length} nodes. The graph
          remains connected because influence flows through alternative paths.
        </div>
      )}

      {/* ── Network description ── */}
      <p className="text-gray-500 text-xs mb-3">
        {NET_DESCRIPTIONS[netType]}
      </p>

      {/* ── Force graph canvas ── */}
      <div
        ref={containerRef}
        className="bg-gray-900 rounded overflow-hidden w-full block"
        style={{ height: dimensions.h, width: "100%" }}
    >
        <ForceGraph2D
          graphData={graphData}
          nodeColor={nodeColor}
          nodeVal={nodeVal}
          nodeCanvasObject={nodePainter}
          nodeCanvasObjectMode={() => "replace"}
          nodeLabel={(n) =>
            `${n.id}\nPageRank: ${(n.pagerank || 0).toFixed(4)}\nPosts: ${
              n.post_count || 0
            }${n.is_bridge ? "\n★ Bridge author" : ""}`
          }
          linkWidth={(l) => Math.sqrt((l.weight || 1) * 0.8)}
          linkDirectionalArrowLength={netType === "subreddit" ? 5 : 0}
          linkDirectionalArrowRelPos={0.85}
          linkColor={() => "rgba(148,163,184,0.25)"}
          backgroundColor="#111827"
          width={dimensions.w}
          height={dimensions.h}
          onNodeClick={(n) =>
            setSelected((prev) => (prev?.id === n.id ? null : n))
          }
          cooldownTicks={120}
          d3AlphaDecay={0.025}
          d3VelocityDecay={0.4}
        />
      </div>

      {/* ── Selected node detail panel ── */}
      {selected && (
        <div className="mt-2 p-3 bg-gray-800 border border-gray-700 rounded text-sm">
          <div className="flex items-center justify-between mb-2">
            <strong className="text-white text-base">{selected.id}</strong>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-500 hover:text-white text-xs"
            >
              ✕ close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {selected.pagerank != null && (
              <>
                <span className="text-gray-400">PageRank Score</span>
                <span className="text-white font-mono">
                  {selected.pagerank.toFixed(6)}
                </span>
              </>
            )}
            {selected.post_count != null && (
              <>
                <span className="text-gray-400">Total Posts</span>
                <span className="text-white">
                  {selected.post_count.toLocaleString()}
                </span>
              </>
            )}
            {selected.bloc && (
              <>
                <span className="text-gray-400">Ideological Bloc</span>
                <span
                  className="font-semibold"
                  style={{ color: BLOC_COLORS[selected.bloc] || "#9ca3af" }}
                >
                  {selected.bloc.replace("_", " ")}
                </span>
              </>
            )}
            {selected.community != null && (
              <>
                <span className="text-gray-400">Louvain Community</span>
                <span className="text-white">{selected.community}</span>
              </>
            )}
            {selected.subreddits?.length > 0 && (
              <>
                <span className="text-gray-400">Active Subreddits</span>
                <span className="text-white">
                  {selected.subreddits.map((s) => `r/${s}`).join(", ")}
                </span>
              </>
            )}
            {selected.is_bridge && (
              <>
                <span className="text-gray-400">Role</span>
                <span className="text-yellow-400 font-semibold">
                  ★ Bridge Author — posts across multiple blocs
                </span>
              </>
            )}
            {selected.bias && (
              <>
                <span className="text-gray-400">Source Bias</span>
                <span
                  style={{
                    color:
                      selected.bias === "left"
                        ? "#3b82f6"
                        : selected.bias === "right"
                        ? "#f97316"
                        : "#9ca3af",
                  }}
                >
                  {selected.bias}
                </span>
              </>
            )}
            {selected.type && (
              <>
                <span className="text-gray-400">Node Type</span>
                <span className="text-white capitalize">{selected.type}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Algorithm legend ── */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
        <span>
          <strong className="text-gray-500">Node size</strong> = PageRank
          (directed influence score)
        </span>
        <span>
          <strong className="text-gray-500">Node color</strong> = Louvain
          community detection
        </span>
        {netType === "author" && (
          <span>
            <strong className="text-gray-500">White ring</strong> = bridge
            author (posts in 2+ ideological blocs)
          </span>
        )}
        {netType === "subreddit" && (
          <span>
            <strong className="text-gray-500">Arrows</strong> = direction of
            crosspost flow
          </span>
        )}
      </div>
    </section>
  )
}