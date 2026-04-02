import { useState, useRef, useEffect } from "react"
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { useApi } from "../hooks/useApi"

const CLUSTER_COLORS = [
  "#3b82f6","#ef4444","#f97316","#10b981","#a855f7",
  "#f59e0b","#06b6d4","#ec4899","#84cc16","#6366f1",
  "#14b8a6","#f43f5e","#8b5cf6","#22d3ee","#fb923c",
  "#a3e635","#e879f9","#34d399","#fb7185","#60a5fa",
]

function getClusterColor(clusterId) {
  if (clusterId === -1) return "#1f2937"
  return CLUSTER_COLORS[(clusterId + 1) % CLUSTER_COLORS.length]
}

function ScatterTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: "#1f2937", border: "1px solid #374151",
      borderRadius: "8px", padding: "10px 12px", maxWidth: "220px",
    }}>
      <p style={{
        fontSize: "12px", color: "#e5e7eb", marginBottom: "6px",
        lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {d.title}
      </p>
      <p style={{ fontSize: "11px", color: "#6b7280" }}>{"r/" + d.subreddit}</p>
      {d.cluster !== -1 && (
        <p style={{ fontSize: "11px", color: getClusterColor(d.cluster) }}>
          {"Cluster " + d.cluster}
        </p>
      )}
      {d.cluster === -1 && (
        <p style={{ fontSize: "11px", color: "#4b5563" }}>Noise point</p>
      )}
    </div>
  )
}

function ClusterCard({ clusterId, terms }) {
  const color = getClusterColor(Number(clusterId))
  return (
    <div style={{
      padding: "10px", background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "8px", borderTop: "3px solid " + color,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <div style={{
          width: "10px", height: "10px", borderRadius: "50%",
          background: color, flexShrink: 0,
        }} />
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>
          {"Cluster " + clusterId}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {terms.map(function(t) {
          return (
            <span key={t} style={{
              fontSize: "11px", color: "#d1d5db",
              background: "#1f2937", borderRadius: "4px", padding: "2px 6px",
            }}>
              {t}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function ClusterView() {
  const [k, setK] = useState(8)

  const chartContainerRef = useRef(null)
  const [chartWidth, setChartWidth] = useState(800)

  useEffect(function() {
    function measure() {
      if (!chartContainerRef.current) return
      const w = chartContainerRef.current.getBoundingClientRect().width
      if (w > 0) setChartWidth(Math.floor(w) - 24)
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (chartContainerRef.current) observer.observe(chartContainerRef.current)
    const t = setTimeout(measure, 150)
    return function() { observer.disconnect(); clearTimeout(t) }
  }, [])

  const { data, loading, error } = useApi("/api/clusters", { k })

  const allPoints    = data ? data.points || [] : []
  const clustered    = allPoints.filter(function(p) { return p.cluster !== -1 })
  const noise        = allPoints.filter(function(p) { return p.cluster === -1 })
  const labelEntries = data ? Object.entries(data.cluster_labels || {}) : []

  return (
    <section className="w-full">

      {/* Header + slider */}
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "16px", flexWrap: "wrap", gap: "12px",
      }}>
        <div>
          <h2 className="text-lg font-semibold text-gray-200">Topic Clusters</h2>
          <p className="text-gray-500 text-sm mt-1">
            HDBSCAN clustering on sentence embeddings. Each dot = one post.
            Colors = topic clusters. Gray = noise (unclustered).
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px", padding: "10px 14px",
        }}>
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>Clusters:</span>
          <input
            type="range" min={5} max={20} step={1} value={k}
            onChange={function(e) { setK(Number(e.target.value)) }}
            style={{ width: "100px", accentColor: "#3b82f6" }}
          />
          <span style={{
            fontSize: "16px", fontWeight: "700", color: "white",
            minWidth: "28px", textAlign: "center",
          }}>
            {k}
          </span>
        </div>
      </div>

      {/* Stats strip */}
      {data && !loading && (
        <div style={{
          display: "flex", flexWrap: "wrap",
          gap: "16px", marginBottom: "12px",
        }}>
          {[
            ["Clusters found", data.cluster_count],
            ["Noise points",   data.noise_count],
            ["Total posts",    allPoints.length],
          ].map(function(item) {
            return (
              <span key={item[0]} style={{ fontSize: "11px", color: "#6b7280" }}>
                {item[0] + ": "}
                <strong style={{ color: "#d1d5db" }}>{item[1]}</strong>
              </span>
            )
          })}
          {data.k_actual !== data.k_requested && (
            <span style={{ fontSize: "11px", color: "#fbbf24" }}>
              {"Showing k=" + data.k_actual +
               " (nearest available to " + data.k_requested + ")"}
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ height: "400px", background: "#0d1117", borderRadius: "10px" }}
          className="animate-pulse"
        />
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{
          padding: "12px", background: "#1c0a0a",
          border: "1px solid #7f1d1d", borderRadius: "8px",
          color: "#fca5a5", fontSize: "13px", marginBottom: "16px",
        }}>
          Failed to load clusters — check that the backend is running
        </div>
      )}

      {/* Scatter chart */}
      {data && !loading && allPoints.length > 0 && (
        <div
          ref={chartContainerRef}
          style={{
            background: "#0d1117", borderRadius: "10px",
            padding: "12px", marginBottom: "16px",
            width: "100%", boxSizing: "border-box",
          }}
        >
          <ScatterChart
            width={chartWidth}
            height={360}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <XAxis dataKey="x" type="number" hide />
            <YAxis dataKey="y" type="number" hide />
            <Tooltip cursor={false} content={<ScatterTooltip />} />
            <Scatter data={noise} name="noise">
              {noise.map(function(_, i) {
                return <Cell key={i} fill="#1f2937" opacity={0.5} />
              })}
            </Scatter>
            <Scatter data={clustered} name="clusters">
              {clustered.map(function(p, i) {
                return <Cell key={i} fill={getClusterColor(p.cluster)} opacity={0.75} />
              })}
            </Scatter>
          </ScatterChart>
        </div>
      )}

      {/* Cluster keyword cards */}
      {labelEntries.length > 0 && !loading && (
        <div style={{ marginBottom: "24px" }}>
          <p style={{
            fontSize: "11px", color: "#6b7280",
            textTransform: "uppercase", letterSpacing: "0.06em",
            marginBottom: "10px",
          }}>
            Top Keywords per Cluster (TF-IDF)
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {labelEntries.map(function(entry) {
              return (
                <ClusterCard key={entry[0]} clusterId={entry[0]} terms={entry[1]} />
              )
            })}
          </div>
        </div>
      )}

      {/* Nomic Atlas — single clean block */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px", padding: "20px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap", gap: "12px",
      }}>
        <div>
          <p style={{
            fontSize: "13px", color: "#9ca3af",
            fontWeight: "600", marginBottom: "4px",
          }}>
            Interactive Embedding Space — Nomic Atlas
          </p>
          <p style={{ fontSize: "11px", color: "#4b5563", marginBottom: "8px" }}>
            8,309 post embeddings uploaded. Explore topic neighborhoods,
            semantic clusters, and ideological groupings interactively.
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "11px", color: "#10b981",
              background: "#10b98120", borderRadius: "4px", padding: "2px 8px",
            }}>
              {"✓ 8,309 embeddings uploaded"}
            </span>
            <span style={{
              fontSize: "11px", color: "#3b82f6",
              background: "#3b82f620", borderRadius: "4px", padding: "2px 8px",
            }}>
              {"all-MiniLM-L6-v2 · 384D"}
            </span>
            <span style={{
              fontSize: "11px", color: "#a855f7",
              background: "#a855f720", borderRadius: "4px", padding: "2px 8px",
            }}>
              Nomic Atlas
            </span>
          </div>
        </div>

        <a
          href="https://atlas.nomic.ai/data/tapasyapatel.gda/narrativetracker-reddit-political/map"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "10px 18px", background: "#1d4ed8", color: "white",
            borderRadius: "8px", textDecoration: "none",
            fontSize: "13px", fontWeight: "600", flexShrink: 0,
          }}
        >
          Open Nomic Atlas Map ↗
        </a>
      </div>

    </section>
  )
}