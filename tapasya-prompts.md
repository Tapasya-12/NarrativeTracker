# AI Prompt Log — NarrativeTracker (Tapasya Patel)

AI was used throughout this project, but architectural decisions, debugging, integration, and final validation were done manually. The entries below are representative samples from the 7-day build, not an exhaustive log of every AI interaction. Claude (claude.ai) was used for code generation and debugging assistance, while Groq (llama-3.1-8b-instant) is embedded inside the product for runtime user-facing AI features. Every AI output was reviewed, tested locally, and often significantly modified before being committed.

## Day-by-Day AI-Assisted Development Timeline (7 Days)

This timeline shows how I used AI to understand implementation options and speed up repetitive coding, then manually decided architecture, corrected logic, and integrated components end-to-end.

| Day | Focus | How AI Helped Me Understand Flow | What I Implemented/Changed Manually |
|---|---|---|---|
| Day 1 | Scope and architecture | Asked for end-to-end stack options for semantic search + networks + clustering dashboard | Rejected FastAPI/PostgreSQL/Pinecone; chose Flask + FAISS + parquet for a zero-cost reproducible setup |
| Day 2 | Data pipeline | Asked for preprocessing baseline and spam filtering ideas | Reworked spam detection to subreddit-specific logic (especially r/worldpolitics) and verified bloc labeling against dataset reality |
| Day 3 | Backend retrieval and caching | Used AI drafts for /api/search, /api/stats, /api/timeseries, and cache strategy options | Corrected FAISS to cosine-equivalent IndexFlatIP + normalization, added embedding cache, replaced Redis suggestion with startup precompute caches |
| Day 4 | Network analytics | Asked for graph construction and influence metric scaffolding | Fixed crosspost network to directed DiGraph, preserved author graph semantics, and validated PageRank/Louvain outputs with removal stress tests |
| Day 5 | Frontend integration and performance | Used AI for component skeletons (search, divergence, velocity, chart panels) | Fixed rerender/resimulation issues with useMemo/useRef/React.memo, repaired useApi cache key bug, and stabilized sidebar global context behavior |
| Day 6 | Deployment debugging | Asked for Docker, gunicorn, CORS, and environment configuration support | Resolved HuggingFace port mismatch, Docker data path issues, LFS artifact handling, worker/timeout tuning, and Vercel API URL wiring |
| Day 7 | Final QA and documentation | Used AI to draft README/prompts structure and wording | Rewrote technical sections with specific numbers, added failure/fix transparency, and validated claims against running code and deployed endpoints |

Cross-reference to prompt entries: Day 1-2 (Prompts 1-2), Day 3-4 (Prompts 3-7), Day 5 (Prompts 8-14), Day 6 (Prompts 15-21), Day 7 (Prompts 22-23).

---

## Architecture & Setup

## Prompt 1 — Project Architecture

**Component:** Full stack design  
**Prompt:** "Design a full-stack architecture for a Reddit political narrative dashboard that needs semantic search, network analysis, topic clusters, and interactive charts. Prioritize fast iteration and easy deployment."  
**Issue with output:** Claude proposed FastAPI + PostgreSQL + Pinecone. That stack assumed managed services and recurring cost, and added operational overhead for a read-heavy static dataset. Pinecone also created an avoidable external dependency for an internship assignment where reproducibility matters more than cloud scale.  
**Fix applied:** I switched to Flask + FAISS + parquet artifacts. Flask kept the backend simple and explicit, FAISS provided free local vector retrieval, and parquet/JSON artifacts removed the need for a database server. The reasoning was to optimize for zero-cost, self-contained deployment and deterministic behavior under evaluator stress-testing.

## Prompt 2 — Data preprocessing pipeline

**Component:** preprocess.py  
**Prompt:** "Write preprocessing code for posts.jsonl that removes spam/off-topic content, normalizes columns, and assigns ideological bloc labels per subreddit."  
**Issue with output:** The generated spam logic used a global keyword blacklist across all subreddits. That overfit to generic words and incorrectly flagged about 300 legitimate political posts as spam, reducing recall in communities that legitimately discuss policy with contentious wording.  
**Fix applied:** I replaced global keyword filtering with subreddit-specific spam rules focused on r/worldpolitics, which was the known noisy source. That aligned filtering with the actual dataset pathology and preserved signal in other communities. Bloc labels were kept deterministic through explicit subreddit-to-bloc mapping.

---

## Backend

## Prompt 3 — FAISS semantic search endpoint

**Component:** app.py /api/search  
**Prompt:** "Implement semantic search in Flask using all-MiniLM-L6-v2 embeddings and FAISS. Return top relevant Reddit posts with similarity scores and optional filters."  
**Issue with output:** The initial output encoded every query on every request, creating 2-3 second latency for repeated searches. It also used IndexFlatL2 without normalization, so ranking quality degraded for textual similarity because cosine-equivalent scoring was not enforced.  
**Fix applied:** I added an in-memory _embed_cache keyed by query string so repeated queries reuse embeddings. I changed retrieval to IndexFlatIP with L2-normalized vectors for cosine-equivalent search. This was a core algorithmic correction, not a minor optimization.

## Prompt 4 — Performance caching strategy

**Component:** app.py startup pre-computation  
**Prompt:** "The dashboard feels slow. Propose a caching strategy for Flask endpoints serving stats, timeseries, clusters, and network data."  
**Issue with output:** Claude recommended Redis with TTL caching. That added infra complexity, external dependency management, and cache invalidation logic for a dataset that does not change during runtime. It solved the wrong problem.  
**Fix applied:** I pre-computed all static endpoint payloads at Flask startup into in-memory dicts and pre-serialized JSON strings. This included 36 subreddit/granularity timeseries combinations, 4 cluster k-values, and 3 base network graphs. Cached endpoint latency dropped from roughly 500ms to under 1ms without introducing Redis.

## Prompt 5 — Network graph construction

**Component:** build_network.py  
**Prompt:** "Build subreddit and author networks from crosspost data, then compute PageRank and Louvain communities for visualization."  
**Issue with output:** The generated code used an undirected graph for subreddit crossposts, collapsing directional flow. That erased who amplified whom and weakened the interpretation of influence pathways.  
**Fix applied:** I changed the subreddit network to a directed DiGraph with weighted edges based on crosspost_count. Author influence remained undirected where appropriate. This was a domain-specific correction: directionality is essential for narrative propagation analysis.

## Prompt 6 — Timeseries caching bug

**Component:** app.py _timeseries_cache  
**Prompt:** "Precompute daily, weekly, and monthly timeseries for all subreddits at startup and serve them from cache."  
**Issue with output:** Monthly aggregation used pandas frequency "M", which is deprecated in newer versions in favor of "ME" and can lead to boundary inconsistencies. The bug was subtle because outputs looked plausible at a glance.  
**Fix applied:** I updated monthly frequency to "ME" after checking pandas version behavior and changelog notes. I then revalidated boundary bins against known dates to ensure month-end aggregation was correct.

## Prompt 7 — Stats endpoint subreddit filtering

**Component:** app.py /api/stats  
**Prompt:** "Add ?subreddit= support so sidebar selection returns subreddit-specific summary statistics."  
**Issue with output:** The code read the subreddit query param but still returned the global pre-cached _stats_json in all cases. Because the endpoint always returned HTTP 200, the bug looked like valid data unless compared across multiple selections.  
**Fix applied:** I rewrote branching logic so sub=="all" returns the global cached payload, while other values filter _clean_df and compute subreddit-specific stats on demand. It took three debugging iterations with controlled test subreddits to expose and verify the fix.

---

## Frontend

## Prompt 8 — ForceGraph2D network visualization

**Component:** NetworkGraph.jsx  
**Prompt:** "Integrate react-force-graph-2d with custom node colors, PageRank-based sizing, and sidebar-driven node highlighting."  
**Issue with output:** Claude put sidebarSub inside the useCallback dependency list for nodePainter. Every sidebar click created a new painter function reference, which ForceGraph2D treated as a prop change and re-simulated the full graph, causing about a 3-second freeze per interaction.  
**Fix applied:** I moved sidebarSub into a useRef and read sidebarSubRef.current inside the painter. That kept function identity stable and eliminated re-simulation. The fix required understanding ForceGraph2D prop identity behavior, which the generated code did not account for.

## Prompt 9 — useApi hook caching bug

**Component:** hooks/useApi.js  
**Prompt:** "Create a reusable React hook for API requests with lightweight caching and loading/error state."  
**Issue with output:** Cache keying used only endpoint path (for example /api/stats) and ignored query params, so all subreddit stat requests returned the first cached response. The same output also accidentally omitted return { data, loading, error }, which caused a full app render failure.  
**Fix applied:** I changed cache keys to endpoint + "|" + JSON.stringify(sorted params) to guarantee parameter-sensitive caching. I restored the missing return object and added manual checks against multiple endpoint/param combinations before using the hook broadly.

## Prompt 10 — NarrativeDivergence sidebar highlight

**Component:** NarrativeDivergence.jsx  
**Prompt:** "When a subreddit is selected in the sidebar, highlight the matching ideological bloc column in Narrative Divergence."  
**Issue with output:** Highlighting used CSS outline, which created layout jitter and inconsistent spacing between columns. The generated code also defined SUBREDDIT_TO_BLOC inside the component, recreating the map on every render/keystroke, and it forgot to apply the same highlight logic to the pre-search BlocPreview state.  
**Fix applied:** I moved SUBREDDIT_TO_BLOC to module scope as a static constant, replaced outline with border + background + controlled padding to prevent layout shift, and threaded the highlighted state into both result columns and BlocPreview. This stabilized rendering and made behavior consistent before and after search.

## Prompt 11 — React.memo performance

**Component:** NetworkGraph.jsx, ClusterView.jsx  
**Prompt:** "Optimize rerender performance so sidebar changes do not trigger unnecessary graph and cluster recomputation."  
**Issue with output:** Claude suggested React.memo, but graphData objects were recreated each render, so memoization did not actually prevent rerenders. The auto-select effect also re-fired too often because it did not track already-selected sidebar nodes.  
**Fix applied:** I wrapped graphData creation in useMemo keyed to actual network payload changes, and added autoSelectedRef guard logic so sidebar auto-selection only runs when needed. This reduced unnecessary renders and eliminated repeated auto-select loops.

## Prompt 12 — Lazy loading with IntersectionObserver

**Component:** hooks/useVisible.js, App.jsx  
**Prompt:** "Implement lazy mounting for lower dashboard sections so NetworkGraph and ClusterView do not fetch on initial load."  
**Issue with output:** Observer rootMargin was 0px, so loading started too late and users could scroll into empty placeholders before fetch initiated. The callback also failed to disconnect after first intersection, leaving observers active and causing avoidable memory overhead.  
**Fix applied:** I changed rootMargin to 350px so loading starts before components enter view and disconnects immediately once visible. This improved perceived performance and prevented observer accumulation.

## Prompt 13 — AISummary component

**Component:** AISummary.jsx  
**Prompt:** "Build a reusable component that posts chart data to /api/summarize and renders an AI-generated plain-language summary."  
**Issue with output:** There were three failures: loading initialized as false so the component often returned null before the request lifecycle stabilized; skeleton UI used Tailwind animate-pulse despite this project using custom CSS; and context was included directly in effect deps, creating repeated requests because the string reference changed frequently.  
**Fix applied:** I initialized loading=true, switched to the existing skeleton class for visual consistency, and narrowed dependencies to stable primitives (type and a bounded JSON.stringify snapshot of data). That stopped repeated Groq calls and made summary rendering deterministic.

## Prompt 14 — SearchPanel sidebar integration

**Component:** SearchPanel.jsx  
**Prompt:** "Pre-filter semantic search results by sidebar-selected subreddit bloc, and allow user override from bloc pills."  
**Issue with output:** The generated clear-filter behavior used a two-step hack (setBlocFilter("left_radical") then setTimeout to "all") to force recomputation. It caused visible flicker and race-prone UI behavior. It also failed to reset pageSize when filters changed, so pagination state became inconsistent.  
**Fix applied:** I replaced the hack with explicit derived state: isSidebarControlling = blocFilter === "all" && sidebarBloc !== "all". Clear actions now setBlocFilter("all") directly, and pageSize resets on filter context changes. This removed flicker and kept pagination coherent.

---

## Deployment

## Prompt 15 — Docker configuration for HuggingFace Spaces

**Component:** Dockerfile  
**Prompt:** "Generate a production Dockerfile for deploying this Flask backend with embeddings and FAISS on HuggingFace Spaces."  
**Issue with output:** The container exposed and bound to port 5000, but HuggingFace Spaces expects 7860. The output also used DATA="../data", which broke when run from container working directories. Both issues produced confusing deployment behavior (failed health checks, missing files).  
**Fix applied:** I set EXPOSE 7860 and gunicorn bind 0.0.0.0:7860, and changed data path resolution to os.path.join(os.path.dirname(__file__), "data") for stable absolute resolution inside containers. I also kept model pre-download in build stage to reduce first-request latency.

## Prompt 16 — CORS configuration

**Component:** app.py  
**Prompt:** "Fix CORS for local React + deployed Vercel frontend so POST endpoints (/api/summarize, /api/suggest_queries) work reliably."  
**Issue with output:** Claude configured origins=["https://*.vercel.app"], but flask-cors does not treat that as wildcard subdomain matching in a simple origins list. Deployed POST requests were blocked, causing missing summaries without obvious frontend exceptions.  
**Fix applied:** I switched to permissive CORS(app) for this public read-only research dashboard (no auth, no sensitive user data). This removed silent deploy-time failures and matched the project’s threat model and access requirements.

## Prompt 17 — Docker build context and data path mismatch

**Component:** Dockerfile (root and backend), app.py data loading  
**Prompt:** "Make Docker deployment robust so the backend always finds parquet, FAISS, network, and events artifacts during HuggingFace build and runtime."  
**Issue with output:** Claude generated a single Dockerfile that assumed backend-only build context and copied local files with paths that worked on one machine but failed in HuggingFace build context. The result was runtime crashes on startup when processed.parquet or faiss.index could not be found.  
**Fix applied:** I maintained a root-level Dockerfile that copies backend and data explicitly, and kept app.py data resolution anchored to os.path.dirname(__file__). I also standardized COPY directives so data artifacts are always inside /app/data regardless of build context. This removed environment-specific path drift.

## Prompt 18 — Git LFS artifact availability in Spaces

**Component:** Deployment pipeline, repository artifact handling  
**Prompt:** "Why does HuggingFace container start but fail when loading large model/data files? Suggest a fix for large binaries in Git-based deployment."  
**Issue with output:** The AI initially treated large artifacts like normal git files and ignored LFS requirements. In practice, pointer files were present but binary payloads were missing or incomplete in deployment, causing load-time errors for .parquet, .index, and .npy assets.  
**Fix applied:** I moved large artifacts to Git LFS and verified file integrity before deploy. I explicitly documented LFS as a deployment prerequisite in README and validated startup by checking /api/health plus endpoint reads dependent on FAISS and parquet. The reasoning was to prevent "container boots but data unusable" failure mode.

## Prompt 19 — Gunicorn worker and timeout tuning

**Component:** HuggingFace runtime command (gunicorn)  
**Prompt:** "Tune gunicorn for this Flask API with sentence-transformers so startup and first requests are stable in HuggingFace Spaces."  
**Issue with output:** Claude suggested multiple workers with default timeout, which looked production-like but failed under memory pressure and model initialization latency. This caused worker restarts and intermittent health-check failures.  
**Fix applied:** I switched to one worker with extended timeout (120s), matching the model-heavy startup profile. This is not horizontally scalable, but it is stable for a research demo workload and avoids OOM churn during evaluator testing.

## Prompt 20 — Model initialization latency and first-request failure

**Component:** Dockerfile model provisioning  
**Prompt:** "Reduce first-request latency for embedding endpoints in deployed container."  
**Issue with output:** AI left model download to runtime, so the first semantic endpoint call triggered a model fetch. In constrained deployment environments this led to long cold-start stalls and occasional request failure before health checks stabilized.  
**Fix applied:** I pre-downloaded all-MiniLM-L6-v2 at Docker build time using a one-line Python install step. This moved model fetch cost from runtime to build phase and made first FAISS/embedding request predictable.

## Prompt 21 — Vercel ↔ HuggingFace API URL mismatch

**Component:** Frontend environment configuration and CORS integration  
**Prompt:** "Fix deployed frontend so it targets the live HuggingFace backend instead of localhost without breaking local dev."  
**Issue with output:** The generated setup mixed local and production API URLs inconsistently, so Vercel build sometimes pointed to localhost:5000 and silently failed requests in production. Debugging was confusing because local dev still worked.  
**Fix applied:** I made VITE_API_URL an explicit environment variable in Vercel and kept local .env pointing to localhost:5000. I then revalidated search, summarize, and narrative analysis endpoints from production UI to confirm end-to-end behavior across both environments.

---

## UI/UX

## Prompt 22 — Design system and CSS variables

**Component:** index.css  
**Prompt:** "Create a cohesive dark design system with CSS variables for dashboard cards, typography, controls, and chart containers."  
**Issue with output:** The generated style leaned heavily into gradients, blur, and glassmorphism with many box-shadows. On this dashboard’s dense chart layout, those effects increased visual noise and added unnecessary compositor work during interactions.  
**Fix applied:** I removed gradients, blur, and heavy shadows, then rebuilt around flat surfaces and restrained color variables. The result follows an editorial data-journalism tone better suited to research interpretation and performs more smoothly on lower-end machines.

## Prompt 23 — Section descriptions copy

**Component:** All section headers  
**Prompt:** "Write short explanatory copy for each dashboard section so users understand what each panel does."  
**Issue with output:** Claude produced generic marketing language (for example, "powerful", "cutting-edge", "revolutionary") that sounded synthetic and did not communicate measurable behavior. It weakened evaluator trust and obscured implementation specifics.  
**Fix applied:** I rewrote section copy with concrete mechanics and numbers (thresholds, counts, model behavior, and interaction logic). For example, wording shifted from hype to verifiable statements like "Search by meaning, not keywords" and explicit references to bloc-level comparisons.

---

### Closing Notes

The most useful AI contributions were in boilerplate generation: repetitive Flask endpoint scaffolding, Recharts component structure, and baseline CSS/layout drafts. The highest-impact corrections were architectural and algorithmic decisions that required project-specific context, such as HuggingFace port constraints, ForceGraph2D prop identity behavior, and pandas frequency API changes. Core product judgment, including the sidebar global context system, the useMemo/useRef performance strategy, and a flat editorial visual language over glassmorphism, was not delegated to AI. AI accelerated implementation, but correctness, integration quality, and system design were always manually owned.