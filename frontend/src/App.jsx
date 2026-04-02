import { useState } from "react"
import Sidebar from "./components/Sidebar"
import StatBar from "./components/StatBar"
import TimeSeriesChart from "./components/TimeSeriesChart"
import NetworkGraph from "./components/NetworkGraph"
import NarrativeDivergence from "./components/NarrativeDivergence"
import SearchPanel from "./components/SearchPanel"
import VelocityChart from "./components/VelocityChart"
import ClusterView from "./components/ClusterView"
import SourceBiasNetwork from "./components/SourceBiasNetwork"

export const BLOC_COLORS = {
  left_radical: "#ef4444",
  center_left: "#3b82f6",
  right: "#f97316",
  mixed: "#a855f7",
  other: "#6b7280",
}

export default function App() {
  const [filters, setFilters] = useState({
    subreddit: "all",
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
        <TimeSeriesChart filters={filters} />
        <NarrativeDivergence />
        <NetworkGraph filters={filters} />
        <SearchPanel />
        <VelocityChart />
        <ClusterView />
        <SourceBiasNetwork />
      </main>
    </div>
  )
}