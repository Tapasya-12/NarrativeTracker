import { useState, useEffect } from "react"
import axios from "axios"

const BASE = import.meta.env.VITE_API_URL || ""

export function useApi(endpoint, params = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!endpoint) return
    setLoading(true)
    setError(null)
    axios
      .get(BASE + endpoint, { params })
      .then((r) => {
        setData(r.data)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [endpoint, JSON.stringify(params)])

  return { data, loading, error }
}