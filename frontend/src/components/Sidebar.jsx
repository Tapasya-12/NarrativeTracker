import { useApi } from "../hooks/useApi"
import WorldPoliticsWarning from "./WorldPoliticsWarning"
import { BLOC_COLORS } from "../App"

const BLOC_LABELS = {
  left_radical: "Left Radical",
  center_left: "Center Left",
  right: "Right",
  mixed: "Mixed",
}

export default function Sidebar({ filters, onChange }) {
  const { data } = useApi("/api/subreddits")

  if (!data)
    return (
      <div className="w-64 bg-gray-900 p-4 text-gray-400 text-sm">
        Loading...
      </div>
    )

  // Group subreddits by bloc
  const groups = {}
  data.forEach((s) => {
    if (!groups[s.bloc]) groups[s.bloc] = []
    groups[s.bloc].push(s)
  })

  const showWPWarning =
    filters.subreddit === "worldpolitics" || filters.subreddit === "all"

  return (
    <div className="w-72 bg-gray-900 border-r border-gray-800 overflow-y-auto flex-shrink-0 p-4">
      <h2 className="text-xl font-bold text-blue-400 mb-1">NarrativeTracker</h2>
      <p className="text-gray-500 text-xs mb-4">Political narrative analysis</p>

      {/* Subreddit filter */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
          Filter by Subreddit
        </p>
        <button
          onClick={() => onChange({ ...filters, subreddit: "all" })}
          className={`w-full text-left px-2 py-1 rounded text-sm mb-1 ${
            filters.subreddit === "all"
              ? "bg-blue-900 text-blue-200"
              : "text-gray-300 hover:bg-gray-800"
          }`}
        >
          All subreddits
        </button>

        {Object.entries(groups).map(([bloc, subs]) => (
          <div key={bloc} className="mb-3">
            <p
              className="text-xs font-semibold mb-1 uppercase"
              style={{ color: BLOC_COLORS[bloc] }}
            >
              {BLOC_LABELS[bloc]}
            </p>
            {subs.map((s) => (
              <button
                key={s.subreddit}
                onClick={() => onChange({ ...filters, subreddit: s.subreddit })}
                className={`w-full text-left px-2 py-1 rounded text-sm mb-0.5 ${
                  filters.subreddit === s.subreddit
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-800"
                }`}
              >
                r/{s.subreddit}
                <span className="float-right text-gray-600 text-xs">
                  {s.count}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Granularity toggle */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
          Time Granularity
        </p>
        <div className="flex gap-1">
          {["day", "week", "month"].map((g) => (
            <button
              key={g}
              onClick={() => onChange({ ...filters, granularity: g })}
              className={`flex-1 py-1 rounded text-xs ${
                filters.granularity === g
                  ? "bg-blue-700 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <WorldPoliticsWarning visible={showWPWarning} />
    </div>
  )
}