export default function WorldPoliticsWarning({ visible }) {
  if (!visible) return null

  return (
    <div className="flex items-start gap-2 p-3 bg-yellow-950 border border-yellow-600 rounded text-yellow-200 text-sm">
      <span className="text-yellow-400 font-bold mt-0.5">⚠</span>
      <p>
        <strong>r/worldpolitics data quality notice:</strong> This subreddit
        contains approximately 40% off-topic content (gaming discussions,
        unrelated posts). Results may not accurately reflect political discourse.
        Spam posts are filtered by default.
      </p>
    </div>
  )
}