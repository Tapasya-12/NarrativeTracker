import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts"
import { useApi } from "../hooks/useApi"
import AISummary from "./AISummary"
import { BLOC_COLORS } from "../App"

// ── Custom tooltip so dates and numbers look clean ──────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded p-2 text-xs">
      <p className="text-gray-300 mb-1">{label?.slice(0, 10)}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value?.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Custom event label so long event names don't overlap ─────────────────────
function EventLabel({ viewBox, event }) {
  const { x } = viewBox
  return (
    <g>
      <text
        x={x + 3}
        y={20}
        fill="#facc15"
        fontSize={9}
        style={{ pointerEvents: "none" }}
      >
        {event.slice(0, 22)}
      </text>
    </g>
  )
}

export default function TimeSeriesChart({ filters }) {
  const [mode, setMode] = useState("all") // "all" | "blocs"

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: tsData, loading: tsLoading } = useApi("/api/timeseries", {
    subreddit: filters.subreddit,
    granularity: filters.granularity,
  })

  const { data: blocsData, loading: blocsLoading } = useApi(
    "/api/timeseries/blocs",
    { granularity: filters.granularity }
  )

  const { data: events } = useApi("/api/events")

  const loading = mode === "all" ? tsLoading : blocsLoading

  // ── Context string passed to AISummary so Claude knows what it's looking at
  const context =
    mode === "all"
      ? `subreddit: ${filters.subreddit}, granularity: ${filters.granularity}`
      : `ideological blocs comparison, granularity: ${filters.granularity}`

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading)
    return (
      <section>
        <h2 className="text-lg font-semibold text-gray-200 mb-3">
          Post Activity Over Time
        </h2>
        <div className="h-72 animate-pulse bg-gray-900 rounded" />
      </section>
    )

  // ── Empty state ────────────────────────────────────────────────────────────
  const hasData =
    mode === "all" ? tsData?.length > 0 : blocsData && Object.keys(blocsData).length > 0

  return (
    <section>
      {/* ── Header row with toggle buttons ── */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-200">
            Post Activity Over Time
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Weekly post counts across political communities
          </p>
        </div>
        <div className="flex gap-1">
          {[
            { key: "all", label: "All Posts" },
            { key: "blocs", label: "By Bloc" },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                mode === m.key
                  ? "bg-blue-700 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── No data message ── */}
      {!hasData && (
        <div className="h-32 flex items-center justify-center text-gray-500 text-sm bg-gray-900 rounded">
          No data available for this filter
        </div>
      )}

      {/* ── ALL POSTS MODE: single blue line ── */}
      {mode === "all" && tsData && tsData.length > 0 && (
        <div className="bg-gray-900 rounded p-3">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={tsData}
              margin={{ top: 30, right: 20, left: 0, bottom: 5 }}
            >
              <XAxis
                dataKey="created_utc"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={(v) => v?.slice(0, 10)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />

              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Posts"
                activeDot={{ r: 4 }}
              />

              {/* ── Political events overlay ── */}
              {events?.map((ev, i) => (
                <ReferenceLine
                  key={i}
                  x={ev.date}
                  stroke="#facc15"
                  strokeDasharray="4 2"
                  strokeWidth={1.5}
                  label={<EventLabel event={ev.event} />}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* ── Events legend below chart ── */}
          {events && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {events.map((ev, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-yellow-400" />
                  <span className="text-xs text-gray-500">
                    {ev.date}: {ev.event}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BY BLOC MODE: 4 colored lines ── */}
      {mode === "blocs" && blocsData && (
        <div className="bg-gray-900 rounded p-3">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart margin={{ top: 30, right: 20, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="created_utc"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={(v) => v?.slice(0, 10)}
                allowDuplicatedCategory={false}
              />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                formatter={(value) => value.replace("_", " ")}
              />
              {Object.entries(blocsData).map(([bloc, data]) => (
                <Line
                  key={bloc}
                  data={data}
                  type="monotone"
                  dataKey="count"
                  stroke={BLOC_COLORS[bloc]}
                  strokeWidth={2}
                  dot={false}
                  name={bloc}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <p className="text-xs text-gray-600 mt-2">
            Note: subreddits were collected in separate batches — cross-bloc
            temporal comparisons reflect collection timing, not silence.
          </p>
        </div>
      )}

      {/* ── AI Summary — re-fetches when data changes ── */}
      <AISummary
        type="timeseries"
        data={mode === "all" ? tsData : Object.values(blocsData || {}).flat()}
        context={context}
      />
    </section>
  )
}