import { useState, useEffect, useRef, lazy, Suspense } from "react"
import Sidebar from "./components/Sidebar"
import StatBar from "./components/StatBar"
import NarrativeDivergence from "./components/NarrativeDivergence"
import VelocityChart from "./components/VelocityChart"
import SearchPanel from "./components/SearchPanel"
import TimeSeriesChart from "./components/TimeSeriesChart"
import ClusterView from "./components/ClusterView"

// NetworkGraph is the heaviest — load it lazily
const NetworkGraph = lazy(function() {
  return import("./components/NetworkGraph")
})

export const BLOC_COLORS = {
  left_radical: "#ef4444",
  center_left:  "#3b82f6",
  right:        "#f97316",
  mixed:        "#a855f7",
  other:        "#6b7280",
}

function NetworkGraphFallback() {
  return (
    <section className="w-full">
      <h2 className="text-lg font-semibold text-gray-200 mb-3">
        Network Analysis
      </h2>
      <div
        className="animate-pulse"
        style={{
          height: "420px", background: "#0d1117",
          borderRadius: "10px", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <p style={{ color: "#374151", fontSize: "13px" }}>
          Loading network graph...
        </p>
      </div>
    </section>
  )
}

export default function App() {
  const [filters, setFilters] = useState({
    subreddit:   "all",
    granularity: "week",
  })

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar filters={filters} onChange={setFilters} />

      <main className="flex-1 min-w-0 overflow-y-auto p-6 space-y-10">

        <div>
          <h1 className="text-3xl font-bold text-blue-400">NarrativeTracker</h1>
          <p className="text-gray-400 text-sm mt-1">
            Tracing political narratives across Reddit — Trump's Return to Power
          </p>
        </div>

        <StatBar />
        <NarrativeDivergence />
        <VelocityChart />
        <SearchPanel />
        <TimeSeriesChart filters={filters} />

        {/* NetworkGraph loads lazily — doesn't block initial page render */}
        <Suspense fallback={<NetworkGraphFallback />}>
          <NetworkGraph filters={filters} />
        </Suspense>

        <ClusterView />

      </main>
    </div>
  )
}