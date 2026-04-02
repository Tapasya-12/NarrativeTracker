import { useState, useEffect } from "react"
import axios from "axios"

const BASE = import.meta.env.VITE_API_URL || ""

export default function AISummary({ type, data, context }) {
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(false)

  useEffect(function() {
    if (!data || !data.length) return

    setLoading(true)
    setSummary("")
    setError(false)

    axios
      .post(BASE + "/api/summarize", {
        type,
        data: data.slice(0, 30),
        context,
      })
      .then(function(r) {
        setSummary(r.data.summary || "")
        setLoading(false)
      })
      .catch(function() {
        setError(true)
        setLoading(false)
      })
  }, [JSON.stringify(data?.slice(0, 5)), type, context])

  // Don't render anything if no data and not loading
  if (!data || !data.length) return null
  if (!summary && !loading && !error) return null

  return (
    <div style={{
      marginTop: "16px",
      padding: "14px 16px",
      background: "rgba(59,130,246,0.06)",
      border: "1px solid rgba(59,130,246,0.2)",
      borderLeft: "4px solid #3b82f6",
      borderRadius: "8px",
    }}>
      <p style={{
        fontSize: "10px",
        fontWeight: "700",
        color: "#60a5fa",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: "8px",
      }}>
        AI Summary
      </p>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[100, 88, 72].map(function(w) {
            return (
              <div
                key={w}
                className="animate-pulse"
                style={{
                  height: "12px",
                  width: w + "%",
                  background: "#1f2937",
                  borderRadius: "4px",
                }}
              />
            )
          })}
        </div>
      )}

      {error && (
        <p style={{ fontSize: "13px", color: "#6b7280", fontStyle: "italic" }}>
          AI summary temporarily unavailable
        </p>
      )}

      {!loading && !error && summary && (
        <p style={{
          fontSize: "13px",
          color: "#d1d5db",
          lineHeight: "1.6",
          margin: 0,
        }}>
          {summary}
        </p>
      )}
    </div>
  )
}