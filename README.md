# NarrativeTracker

[![Live Demo](https://img.shields.io/badge/Live-Demo-0ea5e9?style=for-the-badge&logo=vercel&logoColor=white)](https://narrative-tracker.vercel.app)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-Vite-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![License MIT](https://img.shields.io/badge/License-MIT-16a34a?style=for-the-badge)](LICENSE)
[![HuggingFace Spaces](https://img.shields.io/badge/HuggingFace-Spaces-f59e0b?style=for-the-badge&logo=huggingface&logoColor=white)](https://Tapasya-12-narrativetracker-backend.hf.space/api/health)

NarrativeTracker reveals patterns that manual browsing cannot: at the scale of 8,799 posts across 10 politically distinct communities, the same event develops into different narratives by ideological bloc, and those narratives do not move at the same speed. By combining semantic retrieval, timeline instrumentation, and network structure, the dashboard makes divergence measurable, identifies first-mover communities, and shows how framing and influence propagate from July 2024 to February 2025.

---

## Table of Contents

1. [Live Links and Public Deployments](#live-links-and-public-deployments)
2. [Submission Context for Evaluators](#submission-context-for-evaluators)
3. [Dataset Scope and Composition](#dataset-scope-and-composition)
4. [Technology Stack and System Architecture](#technology-stack-and-system-architecture)
5. [Core Feature Walkthrough](#core-feature-walkthrough)
6. [Sidebar Global Context System Design](#sidebar-global-context-system-design)
7. [ML and AI Components](#ml-and-ai-components)
8. [Performance Optimizations](#performance-optimizations)
9. [Semantic Search Validation Examples](#semantic-search-validation-examples)
10. [Backend API Reference](#backend-api-reference)
11. [Local Setup and Reproducibility](#local-setup-and-reproducibility)
12. [Deployment Configuration](#deployment-configuration)
13. [Deployment Issues I Faced and How I Fixed Them](#deployment-issues-i-faced-and-how-i-fixed-them)
14. [Current Limitations and Next Improvements](#current-limitations-and-next-improvements)
15. [Author and SimPPL Attribution](#author-and-simppl-attribution)

---

## Live Links and Public Deployments 

| Surface | URL |
|---|---|
| Live Frontend | https://narrative-tracker.vercel.app |
| Live Backend Health | https://Tapasya-12-narrativetracker-backend.hf.space/api/health |
| Nomic Atlas Map (Interactive Embeddings) | https://atlas.nomic.ai/data/tapasyapatel.gda/narrativetracker-reddit-political/map |
| GitHub Repository | https://github.com/Tapasya-12/NarrativeTracker |

**Nomic Atlas (prominent link):**
https://atlas.nomic.ai/data/tapasyapatel.gda/narrativetracker-reddit-political/map

---

## Submission Context for Evaluators

| Assignment expectation | Where it appears in this project |
|---|---|
| Semantic search with zero keyword overlap | /api/search + examples table in this README |
| Time-series + AI plain-language summaries | TimeSeriesChart + AISummary + /api/summarize |
| Network influence + node removal stress test | /api/network?remove_node= + NetworkGraph tab |
| Topic clustering with tunable k | /api/clusters with precomputed k values |
| Interactive embedding map link | Nomic Atlas public map |

Implementation note: this codebase prioritizes transparent and reproducible analysis over production microservice complexity.

---

## Dataset Scope and Composition 

NarrativeTracker analyzes a Reddit corpus focused on reactions to Trump's return to power, covering July 2024 through February 2025. The dataset was cleaned for spam-heavy off-topic content and then transformed into analysis artifacts for semantic search, clustering, network analytics, and timeline analysis.

### Dataset Statistics

| Metric | Value |
|---|---:|
| Raw source file | posts.jsonl (43MB) |
| Raw posts before filtering | 9,011 |
| Spam filtered | 212 |
| Total posts after filtering | 8,799 |
| Date range | July 2024 - February 2025 |
| Communities analyzed | 10 subreddits |
| Ideological blocs | 4 |
| Unique authors | 3,584 |
| Top post title | Trump Fires Hundreds of Staff Overseeing Nuclear Weapons |
| Top post score | 49,905 |
| Crosspost count | Significant cross-community sharing detected |

### Ideological Bloc Breakdown

| Bloc | Subreddit | Posts |
|---|---|---:|
| Left Radical | r/Anarchism | 838 |
| Left Radical | r/socialism | 951 |
| Center Left | r/Liberal | 960 |
| Center Left | r/politics | 991 |
| Center Left | r/neoliberal | 981 |
| Center Left | r/PoliticalDiscussion | 116 |
| Center Left | r/democrats | 930 |
| Right | r/Conservative | 970 |
| Right | r/Republican | 839 |
| Mixed | r/worldpolitics | 945 |

Note on mixed bloc quality: r/worldpolitics had a high off-topic spam rate (about 40%), which is why explicit spam filtering was necessary before downstream modeling.

---

## Technology Stack and System Architecture 

### Frontend

| Layer | Choice |
|---|---|
| UI framework | React 18 + Vite |
| Styling | Tailwind CSS utility classes |
| Charts | Recharts (time-series, scatter) |
| Graph rendering | react-force-graph-2d |
| HTTP client | axios |

### Backend

| Layer | Choice |
|---|---|
| API server | Flask |
| Cross-origin and compression | flask-cors, flask-compress (gzip) |
| Data processing | pandas, numpy |
| Semantic retrieval | FAISS IndexFlatIP |
| Embedding model | sentence-transformers (all-MiniLM-L6-v2) |
| Community analytics | python-louvain |
| Graph metrics | networkx (PageRank, graph analysis) |
| AI generation | Groq API (llama-3.1-8b-instant) |
| Production WSGI | gunicorn |

### Deployment

| Component | Platform | Notes |
|---|---|---|
| Backend API | HuggingFace Spaces | Docker container, port 7860 |
| Frontend UI | Vercel | GitHub auto-deploy |
| Embedding exploration | Nomic Atlas | 8,309 embeddings uploaded, interactive public map |

---

## Core Feature Walkthrough 

### 1) Narrative Divergence Tracker (WOW Feature)

Narrative Divergence executes one semantic query and presents the top three relevant posts per ideological bloc in a synchronized four-column layout. This design turns framing comparison into a direct side-by-side reading task: you can inspect how each bloc describes causation, responsibility, and risk for the same topic in one screen. The module also generates AI framing analysis that explicitly compares language, emphasis, and implied blame.

**Key technical detail:** FAISS cosine retrieval with similarity threshold >0.25, top 300 candidates scanned, and top 3 posts returned per bloc from /api/narrative_divergence; framing text is generated by /api/narrative_analysis using Groq.

[Screenshot: Narrative Divergence Tracker]

### 2) Information Velocity (WOW Feature)

Information Velocity identifies which community posted first for a semantic topic and then reconstructs the propagation order across subreddits. It shows a first-mover badge (community, date, relevance, title), a ranked propagation list with +N communities later labels, and per-subreddit mini sparklines for temporal spread. This makes narrative diffusion auditable instead of anecdotal.

**Key technical detail:** /api/velocity embeds query once, searches top 300 FAISS candidates, filters at similarity >0.3, computes first post per subreddit, and emits timeline rows used by the sparkline panels; AI summary explains propagation behavior in plain English.

[Screenshot: Information Velocity]

### 3) Semantic Search

Search is semantic rather than lexical: concept-level queries return relevant posts even with zero keyword overlap and across languages. Results are paginated at 15 per page in the UI, include bloc filter pills, and support a Show more interaction without requerying the backend. After each successful search, the system asks Groq for three related exploratory queries.

**Key technical detail:** /api/search uses FAISS IndexFlatIP on normalized embeddings, applies threshold >0.2, returns up to 25 results, and handles short queries (<2 chars), empty result sets, and multilingual inputs; sidebar context can pre-filter to a bloc and display a contextual banner.

[Screenshot: Semantic Search]

### 4) Post Activity Over Time

The timeline module tracks post volume across day, week, and month granularities for July 2024 through February 2025, with event overlays for election, inauguration, and policy moments. Users can switch to a By Bloc view to compare all four ideological communities on one chart. Event markers are rendered as colored vertical reference lines and explained in a two-column legend grid.

**Key technical detail:** /api/timeseries and /api/timeseries/blocs are precomputed caches; the chart overlays 8 curated events (red election, purple inauguration, blue policy), and dynamic AI summaries are generated from actual datapoints via /api/summarize.

[Screenshot: Post Activity Over Time]

### 5) Network Analysis (4 Tabs)

The network module includes four analytic views: Subreddit Crosspost flow, Author Influence, Source Citation network, and Source Bias quantification. Directed edges and PageRank expose influence concentration, Louvain colors reveal communities, and bridge authors are marked with white rings when they span ideological blocs. A Remove Top Node control intentionally stress-tests influence resilience by re-simulating after removing the highest PageRank actor.

**Key technical detail:** /api/network supports type= and remove_node=, /api/source_network serves citation edges, and client behavior auto-highlights sidebar-selected subreddit nodes with an outer ring without triggering force re-simulation.

[Screenshot: Network Analysis]

### 6) Topic Clusters

Topic Clusters visualizes all 8,799 posts as an interactive scatter where each dot is a post and each cluster is semantically defined. Users can inspect title/subreddit/cluster via tooltip, review TF-IDF keyword pills per cluster, and analyze noise points rendered as dark gray semi-transparent dots. Cluster resolution is tunable through precomputed variants, enabling sensitivity checks without runtime model execution.

**Key technical detail:** embeddings are reduced to 50D PCA for HDBSCAN clustering, rendered in 2D scatter space, and served from startup caches for k in {5, 8, 12, 20}; Nomic Atlas link provides full 384D exploratory context.

[Screenshot: Topic Clusters]

---

## Sidebar Global Context System Design 

The sidebar is implemented as a global context setter, not a local filter. Selecting any subreddit coordinates multiple panels so the analyst can keep one community lens while moving across very different views (stats, semantic retrieval, time trends, and network topology).

| Step | Dashboard Module | Behavior on subreddit selection | API call required? |
|---|---|---|---|
| 1 | StatBar | Shows community-specific posts, authors, date range, avg score, top post | Yes: /api/stats?subreddit=X |
| 2 | Narrative Divergence | Highlights corresponding ideological column with border, background, Sidebar badge | No (client-side only) |
| 3 | Semantic Search | Pre-filters visible results to the selected bloc and shows sidebar context banner | No (client-side only) |
| 4 | TimeSeriesChart | Filters timeline to selected subreddit | Yes: /api/timeseries |
| 5 | NetworkGraph | Auto-selects matching subreddit node and draws highlight ring | No (client-side only) |

Critical architecture decision: steps 2, 3, and 5 are all client-side state transitions with zero extra backend requests. The NetworkGraph highlight path uses a useRef-based node painter flow so sidebar clicks do not restart force simulation.

---

## ML and AI Components 

| Component | Model / Algorithm | Key Parameters | Library |
|---|---|---|---|
| Sentence embeddings | all-MiniLM-L6-v2 | 384D output, cosine similarity | sentence-transformers |
| Vector search | FAISS IndexFlatIP | L2-normalized cosine, top-k×4 candidates | faiss-cpu |
| Dimensionality reduction | PCA | 50D for clustering, 2D for scatter visualization | scikit-learn |
| Topic clustering | HDBSCAN | min_cluster_size=max(5,n//(k×3)), euclidean metric | hdbscan |
| Cluster labeling | TF-IDF | top 5 terms per cluster, per-cluster corpus | scikit-learn |
| Influence scoring | PageRank | directed graph, weight=crosspost_count, α=0.85 | networkx |
| Community detection | Louvain | undirected, modularity maximization | python-louvain |
| AI summaries | llama-3.1-8b-instant | max_tokens=200-300, temperature=default | groq |
| Embedding viz | Nomic Atlas | 8,309 posts, 384D, public interactive map | nomic |

---

## Performance Optimizations 

| What | Strategy | Result |
|---|---|---|
| Global stats payload | Serialize once at Flask startup | /api/stats?subreddit=all returns in microseconds |
| Subreddit list | Precompute and cache subreddit aggregates | Fast sidebar boot and consistent counts |
| Events payload | Pre-serialize timeline markers | Immediate event line rendering |
| Network payloads | Pre-serialize subreddit/author/source networks | Minimal latency for default graph loads |
| Source citation graph | Pre-filter source network at min_weight=3 | Reduced payload size and faster render |
| Topic clusters | Precompute all k values (5, 8, 12, 20) | No online clustering delay |
| Timeseries cache | Precompute subreddit x granularity (36 entries) | Instant day/week/month switching |
| Bloc timeseries cache | Precompute 3 granularity bloc datasets | Fast By Bloc toggle |
| Semantic embedding reuse | _embed_cache dictionary by query string | Repeat queries skip model inference |
| Response compression | flask-compress gzip responses | Lower transfer time, better WAN performance |
| Request handling | Flask threaded=True | Better concurrency for parallel panel requests |
| Heavy component loading | React.lazy + Suspense for NetworkGraph and ClusterView | Smaller initial JS and faster first paint |
| Viewport-aware mounting | useVisible IntersectionObserver (350px root margin) | Defer mount/fetch until near viewport |
| Graph render stability | React.memo + useMemo for graph data | Sidebar changes do not rebuild graph data |
| Node highlight optimization | useRef for sidebarSub in node painter | Eliminated force-graph re-simulation lag |

---

## Semantic Search Validation Examples 

| # | Query | Language | Top Result | Why It's Correct |
|---|---|---|---|---|
| 1 | "anger about government overreach" | English | Posts about DOGE mass federal layoffs | Semantic similarity to frustration with executive power — zero word overlap |
| 2 | "economic anxiety workers losing income" | English | Posts about federal employee termination orders | Captures financial fear concept without matching any keywords | 
| 3 | "लोकतंत्र में सत्ता का दुरुपयोग" (abuse of power in democracy) | Hindi | English posts about Trump executive overreach | Multilingual model maps Hindi political concept to English equivalent |

---

## Backend API Reference 🔌

| Endpoint | Method | Description | Cached |
|---|---|---|---|
| /api/health | GET | System status | No |
| /api/stats | GET | Dataset statistics, supports ?subreddit= | Partial |
| /api/subreddits | GET | All communities with post counts | Yes |
| /api/timeseries | GET | Post volume over time | Yes |
| /api/timeseries/blocs | GET | Volume by ideological bloc | Yes |
| /api/events | GET | Political event markers | Yes |
| /api/network | GET | Network graph data, supports type= and remove_node= | Partial |
| /api/source_network | GET | News source citation network | Yes |
| /api/search | GET | Semantic search via FAISS | Embed cached |
| /api/clusters | GET | HDBSCAN cluster data | Yes |
| /api/narrative_divergence | GET | Cross-bloc semantic search | Embed cached |
| /api/velocity | GET | Information propagation analysis | Embed cached |
| /api/summarize | POST | Groq AI plain-language summary | No |
| /api/suggest_queries | POST | Groq AI related query suggestions | No |
| /api/narrative_analysis | POST | Groq AI framing comparison | No |
| /api/topdomain | GET | Top cited news domains | No |

---

## Local Setup and Reproducibility 

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create .env in backend:

```env
GROQ_API_KEY=your_key
```

Ensure data folder contains:

- processed.parquet
- search_meta.parquet
- faiss.index
- network_subreddit.json
- network_author.json
- network_source.json
- events.json
- clusters.json

Run backend:

```bash
python app.py
```

Backend runs on port 5000.

### Frontend Setup

```bash
cd frontend
npm install
```

Create .env in frontend:

```env
VITE_API_URL=http://localhost:5000
```

Run frontend:

```bash
npm run dev
```

Frontend runs on port 5173.

### Preprocessing Pipeline (Rebuild From Scratch)

```bash
cd backend
python preprocess.py
python build_duckdb.py
python embed.py
python build_clusters.py
python build_network.py
python fetch_events.py
```

---

## Deployment Configuration 

### Backend Deployment: HuggingFace Spaces (Docker)

| Setting | Value |
|---|---|
| Platform | HuggingFace Spaces |
| SDK | Docker |
| Exposed port | 7860 |
| Secret required | GROQ_API_KEY |
| Large artifact handling | Git LFS for .parquet, .index, .npy |
| Process command | gunicorn --workers 1 --timeout 120 |
| Worker count rationale | 1 worker because embedding model footprint is large |
| Model loading strategy | all-MiniLM-L6-v2 pre-downloaded at Docker build time |

### Frontend Deployment: Vercel

| Setting | Value |
|---|---|
| Platform | Vercel |
| Root directory | frontend |
| Framework preset | Vite |
| Required env var | VITE_API_URL=https://Tapasya-12-narrativetracker-backend.hf.space |
| Deploy mode | Auto-deploy from GitHub |

---

## Deployment Issues I Faced and How I Fixed Them

| Issue | What happened | Fix |
|---|---|---|
| HuggingFace port mismatch | Container looked healthy locally on 5000 but failed in Spaces health checks | Bound gunicorn to 0.0.0.0:7860 and exposed 7860 |
| Data path failures in Docker | Relative paths worked locally but failed inside container working directory | Resolved data path from os.path.dirname(__file__) and copied artifacts to /app/data |
| Large artifact deployment instability | .parquet/.index/.npy files were not consistently available without binary tracking | Used Git LFS for large data artifacts |
| Worker restarts during model-heavy startup | Multiple gunicorn workers caused instability and memory pressure | Switched to --workers 1 --timeout 120 |
| Slow/fragile first embedding request | Runtime model download made first semantic call unreliable | Pre-downloaded all-MiniLM-L6-v2 at Docker build time |
| Vercel frontend hitting wrong backend URL | Localhost URL accidentally leaked into production env | Set VITE_API_URL explicitly in Vercel project settings |
| CORS mismatch on deployed POST requests | Summary and analysis endpoints failed from frontend | Updated flask-cors policy to allow deployment origin path |

---

## Current Limitations and Next Improvements

| Current limitation | Why it exists now | Planned improvement |
|---|---|---|
| Single-worker backend | Chosen for model stability and memory safety in Spaces | Add queued async summarization and benchmark 2-worker profile |
| Static artifact refresh workflow | Data pipeline currently manual/script-driven | Add one-command rebuild + validation script |
| No user auth or saved sessions | Assignment scope focused on analytics, not accounts | Add query/session persistence for longitudinal analysis |
| Groq dependency for summaries | External API dependency can add latency | Add fallback local summarizer mode and response caching |
| Limited ideological source bias dictionary | Current mapping is intentionally small and explicit | Expand source taxonomy with transparent labeling criteria |

---

## Author and SimPPL Attribution

Built by Tapasya Patel for the SimPPL Research Engineering internship assignment.

NarrativeTracker was designed as an investigative analysis system for cross-community political discourse: semantic retrieval for conceptual search, timeline instrumentation for event-linked activity changes, and graph analytics for influence and echo-chamber structure.
