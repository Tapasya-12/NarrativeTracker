import { useState, useEffect, useRef } from "react"
import axios from "axios"

const BASE = import.meta.env.VITE_API_URL || ""

export default function AISummary({ type, data, context }) {
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(false)
  const cancelRef = useRef(null)

  useEffect(function() {
    if (!data || !data.length) return

    // Cancel any in-flight request
    if (cancelRef.current) cancelRef.current = true
    var cancelled = false
    cancelRef.current = false

    setLoading(true)
    setSummary("")
    setError(false)

    axios
      .post(BASE + "/api/summarize", {
        type,
        data:    data.slice(0, 30),
        context,
      })
      .then(function(r) {
        if (cancelled) return
        setSummary(r.data.summary || "")
        setLoading(false)
      })
      .catch(function() {
        if (cancelled) return
        setError(true)
        setLoading(false)
      })

    return function() { cancelled = true }

  }, [JSON.stringify(data && data.slice(0, 5)), type])
  // Note: context intentionally excluded from deps —
  // it changes every render and would cause infinite refetch

  if (!data || !data.length) return null
  if (!summary && !loading && !error) return null

  return (
    <div style={{
      marginTop: "16px",
      padding: "14px 16px",
      background: "rgba(79,142,247,0.04)",
      border: "1px solid rgba(79,142,247,0.15)",
      borderLeft: "3px solid #4f8ef7",
      borderRadius: "8px",
    }}>
      <p style={{
        fontSize: "9px",
        fontWeight: "700",
        color: "#4f8ef7",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: "10px",
      }}>
        AI Summary
      </p>

      {/* Loading — uses your existing skeleton CSS class */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {[100, 88, 70].map(function(w) {
            return (
              <div
                key={w}
                className="skeleton"
                style={{
                  height: "11px",
                  width: w + "%",
                  borderRadius: "4px",
                }}
              />
            )
          })}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <p style={{
          fontSize: "13px",
          color: "var(--text-dim)",
          fontStyle: "italic",
        }}>
          AI summary temporarily unavailable
        </p>
      )}

      {/* Summary text */}
      {!loading && !error && summary && (
        <p style={{
          fontSize: "13px",
          color: "var(--text-sec)",
          lineHeight: "1.7",
          margin: 0,
          wordBreak: "break-word",
        }}>
          {summary}
        </p>
      )}
    </div>
  )
}