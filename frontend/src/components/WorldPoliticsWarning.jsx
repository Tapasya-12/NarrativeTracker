export default function WorldPoliticsWarning({ visible }) {
  if (!visible) return null

  return (
    <div style={{
      display: "flex", gap: "8px",
      padding: "10px 12px",
      background: "rgba(234,179,8,0.08)",
      border: "1px solid rgba(234,179,8,0.25)",
      borderRadius: "8px",
    }}>
      <span style={{
        fontSize: "14px", flexShrink: 0, marginTop: "1px",
      }}>
        ⚠
      </span>
      <div>
        <p style={{
          fontSize: "11px", fontWeight: "700",
          color: "#fbbf24", marginBottom: "3px",
        }}>
          r/worldpolitics data quality notice
        </p>
        <p style={{ fontSize: "11px", color: "#92400e", lineHeight: "1.5" }}>
          This subreddit contains ~40% off-topic content
          (gaming discussions, unrelated posts). Spam posts
          are filtered by default. Results may not reflect
          political discourse.
        </p>
      </div>
    </div>
  )
}