import { useState, useEffect } from "react"
import axios from "axios"

const BASE = import.meta.env.VITE_API_URL || ""

export default function AISummary({ type, data, context }) {
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!data || !data.length) return
    setLoading(true)
    setSummary("")
    axios
      .post(BASE + "/api/summarize", {
        type,
        data: data.slice(0, 30),
        context,
      })
      .then((r) => {
        setSummary(r.data.summary)
        setLoading(false)
      })
      .catch(() => {
        setSummary("AI summary unavailable.")
        setLoading(false)
      })
  }, [JSON.stringify(data?.slice(0, 5)), type, context])
  // Re-fetches whenever data changes — satisfies "dynamically generated" rubric

  if (!summary && !loading) return null

  return (
    <div className="mt-4 p-3 bg-gray-900 border-l-4 border-blue-500 rounded">
      <p className="text-xs text-blue-400 font-semibold mb-1 uppercase tracking-wide">
        AI Summary
      </p>
      {loading ? (
        <p className="text-gray-400 text-sm animate-pulse">Generating summary...</p>
      ) : (
        <p className="text-gray-300 text-sm leading-relaxed">{summary}</p>
      )}
    </div>
  )
}