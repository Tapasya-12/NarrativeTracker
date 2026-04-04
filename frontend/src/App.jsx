import { useState, lazy, Suspense } from "react"
import Sidebar from "./components/Sidebar"
import StatBar from "./components/StatBar"
import NarrativeDivergence from "./components/NarrativeDivergence"
import VelocityChart from "./components/VelocityChart"
import SearchPanel from "./components/SearchPanel"
import TimeSeriesChart from "./components/TimeSeriesChart"
import ClusterView from "./components/ClusterView"

const NetworkGraph = lazy(function() {
  return import("./components/NetworkGraph")
})

export const BLOC_COLORS = {
  left_radical: "#f87171",
  center_left:  "#4f8ef7",
  right:        "#fb923c",
  mixed:        "#c084fc",
  other:        "#4b5563",
}

const BLOCS = [
  { label: "Left Radical", color: "#f87171", tag: "r/Anarchism · r/socialism"           },
  { label: "Center Left",  color: "#4f8ef7", tag: "r/politics · r/Liberal · r/neoliberal"},
  { label: "Right",        color: "#fb923c", tag: "r/Conservative · r/Republican"        },
  { label: "Mixed",        color: "#c084fc", tag: "r/worldpolitics"                      },
]

function NetworkFallback() {
  return (
    <div className="section">
      <p className="sec-title" style={{ marginBottom: "20px" }}>Network Analysis</p>
      <div className="skeleton" style={{ height: "420px" }} />
    </div>
  )
}

export default function App() {
  const [filters, setFilters] = useState({
    subreddit: "all", granularity: "week",
  })

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "var(--bg-base)",
      color: "var(--text-primary)",
      overflow: "hidden",
    }}>
      <Sidebar filters={filters} onChange={setFilters} />

      <main style={{
        flex: 1,
        minWidth: 0,
        overflowY: "auto",
        padding: "36px 40px",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
      }}>

        {/* ── Header ── */}
        <div style={{
          borderBottom: "1px solid var(--border)",
          paddingBottom: "28px",
        }}>

          {/* Title + dataset info row */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "20px",
          }}>
            <div style={{ maxWidth: "600px" }}>
              <h1 style={{
                fontSize: "34px",
                fontWeight: "700",
                color: "var(--text-primary)",
                letterSpacing: "-1px",
                lineHeight: 1.1,
                marginBottom: "12px",
              }}>
                NarrativeTracker
              </h1>
              <p style={{
                fontSize: "14px",
                color: "var(--text-sec)",
                lineHeight: "1.7",
              }}>
                How did 10 politically distinct Reddit communities respond to
                Trump's return to power? Which actors drove narrative divergence
                across the ideological spectrum?
              </p>
            </div>

            {/* Dataset meta */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              textAlign: "right",
              flexShrink: 0,
              paddingTop: "4px",
            }}>
              <span className="mono" style={{
                fontSize: "11px",
                color: "var(--text-dim)",
                letterSpacing: "0.03em",
              }}>
                Jul 2024 – Feb 2025
              </span>
              <span className="mono" style={{
                fontSize: "11px",
                color: "var(--text-dim)",
                letterSpacing: "0.03em",
              }}>
                8,799 posts · 10 communities
              </span>
            </div>
          </div>

          {/* Bloc legend pills */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}>
            {BLOCS.map(function(b) {
              return (
                <div key={b.label} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "6px 14px 6px 10px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderLeft: "3px solid " + b.color,
                  borderRadius: "var(--r-sm)",
                }}>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: b.color,
                    whiteSpace: "nowrap",
                  }}>
                    {b.label}
                  </span>
                  <span style={{
                    fontSize: "10px",
                    color: "var(--text-dim)",
                    whiteSpace: "nowrap",
                  }}>
                    {b.tag}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Stats ── */}
        <StatBar />

        {/* ── Narrative Divergence ── */}
        <div className="section fade-up">
          <NarrativeDivergence />
        </div>

        {/* ── Information Velocity ── */}
        <div className="section fade-up">
          <VelocityChart />
        </div>

        {/* ── Semantic Search ── */}
        <div className="section fade-up">
          <SearchPanel />
        </div>

        {/* ── Time Series ── */}
        <div className="section fade-up">
          <TimeSeriesChart filters={filters} />
        </div>

        {/* ── Network Graph (lazy) ── */}
        <Suspense fallback={<NetworkFallback />}>
          <div className="section fade-up">
            <NetworkGraph filters={filters} />
          </div>
        </Suspense>

        {/* ── Cluster View ── */}
        <div className="section fade-up">
          <ClusterView />
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "16px 0",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}>
          <p className="mono" style={{
            fontSize: "11px",
            color: "var(--text-dim)",
          }}>
            NarrativeTracker
          </p>
          <p className="mono" style={{
            fontSize: "11px",
            color: "var(--text-dim)",
          }}>
            Built for SimPPL · 8,799 posts · 10 communities
          </p>
        </div>

      </main>
    </div>
  )
}