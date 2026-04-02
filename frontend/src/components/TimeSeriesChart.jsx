import { useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts"
import { useApi } from "../hooks/useApi"
import AISummary from "./AISummary"
import { BLOC_COLORS } from "../App"

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: "#1f2937", border: "1px solid #374151",
      borderRadius: "8px", padding: "10px 12px",
    }}>
      <p style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "6px" }}>
        {label ? label.slice(0, 10) : ""}
      </p>
      {payload.map(function(p, i) {
        return (
          <p key={i} style={{ fontSize: "12px", color: p.color, margin: "2px 0" }}>
            {p.name + ": "}
            <strong>{p.value != null ? p.value.toLocaleString() : 0}</strong>
          </p>
        )
      })}
    </div>
  )
}

function EventLabel({ viewBox, event }) {
  if (!viewBox) return null
  return (
    <g>
      <text
        x={viewBox.x + 3}
        y={20}
        fill="#facc15"
        fontSize={9}
        style={{ pointerEvents: "none" }}
      >
        {event ? event.slice(0, 22) : ""}
      </text>
    </g>
  )
}

function ChartSkeleton() {
  return (
    <div
      className="animate-pulse"
      style={{
        height: "280px",
        background: "#0d1117",
        borderRadius: "10px",
      }}
    />
  )
}

export default function TimeSeriesChart({ filters }) {
  const [mode, setMode] = useState("all")

  const { data: tsData,    loading: tsLoading,    error: tsError    } =
    useApi("/api/timeseries", {
      subreddit:   filters.subreddit,
      granularity: filters.granularity,
    })

  const { data: blocsData, loading: blocsLoading, error: blocsError } =
    useApi("/api/timeseries/blocs", { granularity: filters.granularity })

  const { data: events } = useApi("/api/events")

  const loading = mode === "all" ? tsLoading : blocsLoading
  const error   = mode === "all" ? tsError   : blocsError

  const aiData = mode === "all"
    ? tsData
    : (blocsData ? Object.values(blocsData).flat() : null)

  const context = mode === "all"
    ? "subreddit: " + filters.subreddit + ", granularity: " + filters.granularity
    : "ideological blocs comparison, granularity: " + filters.granularity

  const hasData = mode === "all"
    ? tsData && tsData.length > 0
    : blocsData && Object.keys(blocsData).length > 0

  return (
    <section className="w-full">

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "12px", flexWrap: "wrap", gap: "10px",
      }}>
        <div>
          <h2 className="text-lg font-semibold text-gray-200">
            Post Activity Over Time
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Weekly post counts with political event markers
          </p>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { key: "all",   label: "All Posts" },
            { key: "blocs", label: "By Bloc"   },
          ].map(function(m) {
            const isActive = mode === m.key
            return (
              <button
                key={m.key}
                onClick={function() { setMode(m.key) }}
                style={{
                  padding: "4px 12px", borderRadius: "6px",
                  fontSize: "12px", fontWeight: "500",
                  border: "none", cursor: "pointer",
                  background: isActive ? "#1d4ed8" : "#1f2937",
                  color: isActive ? "white" : "#9ca3af",
                }}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && <ChartSkeleton />}

      {/* Error */}
      {error && !loading && (
        <div style={{
          padding: "12px", background: "#1c0a0a",
          border: "1px solid #7f1d1d", borderRadius: "8px",
          color: "#fca5a5", fontSize: "13px",
        }}>
          Failed to load time series data — check that the backend is running
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !hasData && (
        <div style={{
          height: "200px", display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "#0d1117", borderRadius: "10px",
          flexDirection: "column", gap: "8px",
        }}>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            No data available for this filter
          </p>
          <p style={{ fontSize: "12px", color: "#374151" }}>
            Try selecting a different subreddit or time granularity
          </p>
        </div>
      )}

      {/* All Posts chart */}
      {mode === "all" && tsData && tsData.length > 0 && !loading && (
        <div style={{
          background: "#0d1117", borderRadius: "10px",
          padding: "12px",
        }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={tsData}
              margin={{ top: 30, right: 20, left: 0, bottom: 5 }}
            >
              <XAxis
                dataKey="created_utc"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={function(v) { return v ? v.slice(0, 10) : "" }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="count"
                stroke="#3b82f6" strokeWidth={2}
                dot={false} name="Posts"
                activeDot={{ r: 4 }}
              />
              {events && events.map(function(ev, i) {
                return (
                  <ReferenceLine
                    key={i}
                    x={ev.date}
                    stroke="#facc15"
                    strokeDasharray="4 2"
                    strokeWidth={1.5}
                    label={<EventLabel event={ev.event} />}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>

          {/* Events legend */}
          {events && events.length > 0 && (
            <div style={{
              marginTop: "12px", display: "flex",
              flexWrap: "wrap", gap: "8px 16px",
            }}>
              {events.map(function(ev, i) {
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "5px",
                  }}>
                    <div style={{
                      width: "14px", height: "2px", background: "#facc15",
                    }} />
                    <span style={{ fontSize: "10px", color: "#6b7280" }}>
                      {ev.date + ": " + ev.event}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* By Bloc chart */}
      {mode === "blocs" && blocsData && !loading && (
        <div style={{
          background: "#0d1117", borderRadius: "10px", padding: "12px",
        }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart margin={{ top: 30, right: 20, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="created_utc"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={function(v) { return v ? v.slice(0, 10) : "" }}
                allowDuplicatedCategory={false}
              />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                formatter={function(value) { return value.replace("_", " ") }}
              />
              {Object.entries(blocsData).map(function(entry) {
                const bloc = entry[0]
                const bdata = entry[1]
                return (
                  <Line
                    key={bloc}
                    data={bdata}
                    type="monotone"
                    dataKey="count"
                    stroke={BLOC_COLORS[bloc] || "#6b7280"}
                    strokeWidth={2}
                    dot={false}
                    name={bloc}
                    activeDot={{ r: 4 }}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
          <p style={{
            fontSize: "11px", color: "#374151", marginTop: "8px",
          }}>
            Note: subreddits were collected in separate batches —
            cross-bloc temporal comparisons reflect collection timing.
          </p>
        </div>
      )}

      <AISummary type="timeseries" data={aiData} context={context} />

    </section>
  )
}