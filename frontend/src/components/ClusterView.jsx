import { useState } from "react"
import {
  ScatterChart, Scatter, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { useApi } from "../hooks/useApi"

// 20 distinct colors for up to 20 clusters
const CLUSTER_COLORS = [
  "#3b82f6","#ef4444","#f97316","#10b981","#a855f7",
  "#f59e0b","#06b6d4","#ec4899","#84cc16","#6366f1",
  "#14b8a6","#f43f5e","#8b5cf6","#22d3ee","#fb923c",
  "#a3e635","#e879f9","#34d399","#fb7185","#60a5fa",
]

function getClusterColor(clusterId) {
  if (clusterId === -1) return "#1f2937" // noise = dark gray
  return CLUSTER_COLORS[(clusterId + 1) % CLUSTER_COLORS.length]
}

// ── Custom scatter tooltip ────────────────────────────────────────────────────
function ScatterTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload

  return (
    <div style={{
      background: "#1f2937",
      border: "1px solid #374151",
      borderRadius: "8px",
      padding: "10px 12px",
      maxWidth: "220px",
    }}>
      <p style={{
        fontSize: "12px", color: "#e5e7eb",
        marginBottom: "6px", lineHeight: "1.4",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {d.title}
      </p>
      <p style={{ fontSize: "11px", color: "#6b7280" }}>
        {"r/" + d.subreddit}
      </p>
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

// ── Cluster label card ────────────────────────────────────────────────────────
function ClusterCard({ clusterId, terms }) {
  const color = getClusterColor(Number(clusterId))

  return (
    <div style={{
      padding: "10px",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "8px",
      borderTop: "3px solid " + color,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <div style={{
          width: "10px", height: "10px",
          borderRadius: "50%", background: color, flexShrink: 0,
        }} />
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>
          {"Cluster " + clusterId}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {terms.map(t => (
          <span key={t} style={{
            fontSize: "11px", color: "#d1d5db",
            background: "#1f2937",
            borderRadius: "4px",
            padding: "2px 6px",
          }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ClusterView() {
  const [k, setK] = useState(8)

  const { data, loading, error } = useApi("/api/clusters", { k })

  // Split points into clustered and noise
  const allPoints  = data ? data.points || [] : []
  const clustered  = allPoints.filter(p => p.cluster !== -1)
  const noise      = allPoints.filter(p => p.cluster === -1)

  const clusterLabels = data ? data.cluster_labels || {} : {}
  const labelEntries  = Object.entries(clusterLabels)

  return (
    <section className="w-full">

      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-200">Topic Clusters</h2>
          <p className="text-gray-500 text-sm mt-1">
            HDBSCAN clustering on sentence embeddings. Each dot is a post.
            Colors = topic clusters. Gray = noise (unclustered).
          </p>
        </div>

        {/* k slider */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px", padding: "10px 14px",
        }}>
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>Clusters:</span>
          <input
            type="range"
            min={5}
            max={20}
            step={1}
            value={k}
            onChange={e => setK(Number(e.target.value))}
            style={{ width: "100px", accentColor: "#3b82f6" }}
          />
          <span style={{
            fontSize: "16px", fontWeight: "700",
            color: "white", minWidth: "28px", textAlign: "center",
          }}>
            {k}
          </span>
        </div>
      </div>

      {/* Stats strip */}
      {data && !loading && (
        <div className="flex flex-wrap gap-4 mb-3 text-xs text-gray-500">
          <span>
            Clusters found:{" "}
            <strong className="text-gray-300">{data.cluster_count}</strong>
          </span>
          <span>
            Noise points:{" "}
            <strong className="text-gray-300">{data.noise_count}</strong>
          </span>
          <span>
            Total posts:{" "}
            <strong className="text-gray-300">{allPoints.length}</strong>
          </span>
          {data.k_actual !== data.k_requested && (
            <span className="text-yellow-500">
              {"Showing k=" + data.k_actual + " (nearest available to " + data.k_requested + ")"}
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="h-80 bg-gray-900 rounded-lg animate-pulse" />
      )}

      {/* Error */}
      {error && !loading && (
        <div className="p-3 bg-red-950 border border-red-700 rounded-lg
          text-red-300 text-sm mb-4">
          Failed to load clusters — check that the backend is running
        </div>
      )}

      {/* Scatter plot */}
      {data && !loading && allPoints.length > 0 && (
        <div style={{
          background: "#0d1117",
          borderRadius: "10px",
          padding: "12px",
          marginBottom: "16px",
        }}>
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <XAxis dataKey="x" type="number" hide />
              <YAxis dataKey="y" type="number" hide />
              <Tooltip
                cursor={false}
                content={<ScatterTooltip />}
              />

              {/* Noise points first (rendered behind clusters) */}
              <Scatter data={noise} name="noise">
                {noise.map((_, i) => (
                  <Cell key={i} fill="#1f2937" opacity={0.5} />
                ))}
              </Scatter>

              {/* Clustered points */}
              <Scatter data={clustered} name="clusters">
                {clustered.map((p, i) => (
                  <Cell
                    key={i}
                    fill={getClusterColor(p.cluster)}
                    opacity={0.75}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cluster label cards */}
      {labelEntries.length > 0 && !loading && (
        <div>
          <p style={{
            fontSize: "11px", color: "#6b7280",
            textTransform: "uppercase", letterSpacing: "0.06em",
            marginBottom: "10px",
          }}>
            Top Keywords per Cluster (TF-IDF)
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
            {labelEntries.map(([cid, terms]) => (
              <ClusterCard key={cid} clusterId={cid} terms={terms} />
            ))}
          </div>
        </div>
      )}

      {/* Nomic Atlas embed */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        padding: "16px",
      }}>
        <p style={{
          fontSize: "12px", color: "#9ca3af", marginBottom: "4px",
        }}>
          Interactive Embedding Space — Nomic Atlas
        </p>
        <p style={{ fontSize: "11px", color: "#4b5563", marginBottom: "12px" }}>
          Upload your embeddings to Nomic Atlas during deployment and replace
          YOUR_NOMIC_EMBED_ID below with the map ID.
        </p>

        {/* 
          TO ACTIVATE: Run the Nomic upload from Section 9.3 of the blueprint,
          copy the embed ID it prints, and replace YOUR_NOMIC_EMBED_ID below.
          
          pip install nomic
          Then run the upload script from the blueprint Section 9.3
        */}
        <div style={{
          height: "280px",
          background: "#0d1117",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px dashed rgba(255,255,255,0.1)",
        }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>
              Nomic Atlas embed
            </p>
            <p style={{ fontSize: "11px", color: "#374151" }}>
              Run the Nomic upload script and replace YOUR_NOMIC_EMBED_ID in ClusterView.jsx
            </p>
          </div>
        </div>

        {/* Uncomment this after getting your Nomic embed ID: */}
        {/*
        <iframe
          src="https://atlas.nomic.ai/map/YOUR_NOMIC_EMBED_ID"
          style={{ width: "100%", height: "280px", borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)" }}
          allow="fullscreen"
        />
        */}
      </div>
    </section>
  )
}