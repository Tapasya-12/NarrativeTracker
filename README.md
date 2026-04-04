# NarrativeTracker

![Live Demo](https://img.shields.io/badge/Live%20Demo-Coming%20Soon-6b7280?style=flat-square)
![Built with React](https://img.shields.io/badge/Built%20with-React-61dafb?style=flat-square&logo=react&logoColor=222)
![Python](https://img.shields.io/badge/Python-3.x-3776ab?style=flat-square&logo=python&logoColor=white)
![License MIT](https://img.shields.io/badge/License-MIT-2ea043?style=flat-square)

NarrativeTracker is a political narrative analysis dashboard built for the SimPPL Research Engineering internship assignment. Using 8,799 Reddit posts from 10 ideologically distinct communities (Jul 2024-Feb 2025), it makes three phenomena measurable in one interface: narrative divergence (how blocs frame the same event differently), information velocity (which communities break and propagate stories first), and citation/network structure (how echo chambers emerge through crossposting and media links).

-------------------------------------------------------------------------------

## Table of Contents

1. [Project Scope](#project-scope)
2. [Dataset](#dataset)
3. [System Architecture](#system-architecture)
4. [ML and Analytical Components](#ml-and-analytical-components)
5. [Core Features](#core-features)
6. [Performance Engineering](#performance-engineering)
7. [Sidebar as Global Context](#sidebar-as-global-context)
8. [Semantic Search Examples](#semantic-search-examples)
9. [Setup and Local Development](#setup-and-local-development)
10. [Deployment](#deployment)
11. [Author](#author)
12. [Citation and Acknowledgements](#citation-and-acknowledgements)

-------------------------------------------------------------------------------

## Project Scope

The dashboard tracks discourse around Donald Trump's return to power across four ideological blocs:

| Bloc | Subreddits |
|---|---|
| Left Radical | r/Anarchism, r/socialism |
| Center Left | r/Liberal, r/politics, r/neoliberal, r/PoliticalDiscussion, r/democrats |
| Right | r/Conservative, r/Republican |
| Mixed | r/worldpolitics |

The goal is not only to retrieve relevant posts, but to compare framing, sequence diffusion across communities, and structural influence patterns in crosspost and citation networks.

-------------------------------------------------------------------------------

## Dataset

| Metric | Value |
|---|---:|
| Raw records | 8,799 Reddit posts |
| Time span | Jul 2024-Feb 2025 |
| Communities | 10 subreddits |
| File size | 43 MB (`data/posts.jsonl`) |
| Non-spam posts after filtering | 8,309 |
| Stored analytics | DuckDB + Parquet + FAISS + JSON artifacts |

Primary data artifacts used by the app:

| Artifact | Role |
|---|---|
| `data/posts.jsonl` | Source post corpus |
| `data/reddit.duckdb` | SQL analytics store |
| `data/faiss.index` | Vector similarity search index |
| `data/events.json` | Offline event markers for timelines |
| `data/network_*.json` | Precomputed network structures |
| `data/clusters.json` | Precomputed embedding projections and labels |

-------------------------------------------------------------------------------

## System Architecture

NarrativeTracker uses a split architecture: React + Vite frontend for interactive visualization and a Flask backend for cached analytics and semantic retrieval.

| Layer | Stack |
|---|---|
| Frontend | React (18+ pattern), Vite, Tailwind CSS, Recharts, react-force-graph-2d |
| Backend | Flask, flask-cors, flask-compress, DuckDB, FAISS (`IndexFlatIP`) |
| ML/NLP | all-MiniLM-L6-v2 (384D), HDBSCAN, PCA, TF-IDF, PageRank, Louvain |
| GenAI | Groq `llama-3.1-8b-instant` for summaries, query suggestions, framing analysis |
| Deployment | Render (backend), Vercel (frontend) |

Embedding map (external interactive exploration):
https://atlas.nomic.ai/data/tapasyapatel.gda/narrativetracker-reddit-political/map

-------------------------------------------------------------------------------

## ML and Analytical Components

| Component | Model/Method | Purpose | Key param |
|---|---|---|---|
| Semantic embedding | sentence-transformers `all-MiniLM-L6-v2` | Encode queries/posts for semantic retrieval and comparison | 384D vectors, cosine via normalized inner product |
| Vector search | FAISS `IndexFlatIP` | Fast nearest-neighbor retrieval over all posts | Inner-product index on L2-normalized embeddings |
| Topic clustering | HDBSCAN on PCA-reduced embeddings | Discover narrative clusters without fixed cluster count | PCA 50D input, selectable output views (5/8/12/20) |
| Projection for scatter plot | PCA | Visualizable 2D map of discourse structure | 2D projection for interactive plot |
| Cluster labeling | TF-IDF keywords | Human-readable cluster summaries | Top weighted terms per cluster |
| Subreddit influence graph | Directed PageRank | Rank narrative influence in crosspost graph | edge weight = `crosspost_count` |
| Network communities | Louvain | Detect subnetworks/echo-chamber structure | modularity-driven partitioning |
| Time trend explanation | Groq `llama-3.1-8b-instant` | Convert chart data to plain-language summaries | 2-3 sentence constrained prompts |
| Query assistance | Groq `llama-3.1-8b-instant` | Suggest follow-up semantic queries | exactly 3 JSON string suggestions |
| Framing comparison | Groq `llama-3.1-8b-instant` | Explain cross-bloc narrative framing differences | 3-4 sentence research-oriented framing analysis |

-------------------------------------------------------------------------------

## Core Features

### 1) Narrative Divergence Tracker (WOW Feature 1)

This view executes one semantic query across all four ideological blocs simultaneously, then returns the top 3 most relevant posts per bloc. It answers a framing question rather than a ranking question: how does each community describe causation, blame, and stakes for the same event?

Why it matters: It operationalizes narrative divergence as comparable evidence instead of anecdotal reading.

Screenshot: [coming soon]

Key technical detail: endpoint `/api/narrative_divergence` retrieves top semantic matches and partitions by `ideological_bloc`; `/api/narrative_analysis` then generates bloc-level framing analysis from returned titles.

### 2) Information Velocity (WOW Feature 2)

This component identifies first movers for a topic and visualizes propagation order across communities. It includes per-subreddit mini timecharts and a First Mover marker with relevance context.

Why it matters: It separates origin from amplification, which is necessary for influence analysis.

Screenshot: [coming soon]

Key technical detail: endpoint `/api/velocity` computes earliest relevant post timestamps per subreddit from semantic result sets and returns both first-post metadata and date-grouped timelines.

### 3) Semantic Search

Search is embedding-based rather than token-overlap-based, with bloc filtering, pagination in UI (15/page), and AI query suggestions. The system supports multilingual queries through shared embedding space.

Why it matters: Research queries are often conceptual (for example, "abuse of power") and may not share vocabulary with the target posts.

Screenshot: [coming soon]

Key technical detail: FAISS `IndexFlatIP` over normalized embeddings enables cosine-equivalent retrieval; query embeddings are cached so repeated queries never re-embed.

### 4) Post Activity Over Time

The timeline module supports weekly/daily/monthly views, overlays political event markers, and includes a "By Bloc" mode for direct ideological comparison in one chart.

Why it matters: It links narrative surges to external events and highlights asymmetry between communities.

Screenshot: [coming soon]

Key technical detail: all subreddit-granularity combinations are precomputed at backend startup, and bloc-level time series are separately cached for instant retrieval.

### 5) Network Analysis (4 Tabs)

The network module includes subreddit crosspost flow, bridge-author structure, source citation graph, and source-bias view. It also supports "Remove Top Node" for redistribution analysis after removing a dominant actor.

Why it matters: It quantifies influence topology and exposes whether information flow is centralized, fragmented, or insulated.

Screenshot: [coming soon]

Key technical detail: directed weighted graphs use PageRank for influence and Louvain for community structure; removal mode is computed by filtering nodes/edges server-side and recomputing visualization state client-side.

### 6) Topic Clusters

Topic clusters are generated from semantically embedded posts, projected into an interactive scatter plot (8,799 points). A tunable `k` selector (5/8/12/20) allows sensitivity testing of narrative segmentation.

Why it matters: It provides meso-level structure between individual posts and aggregate time/network metrics.

Screenshot: [coming soon]

Key technical detail: HDBSCAN runs on PCA-reduced 50D embeddings; cluster labels use TF-IDF keyword extraction; a 2D projection drives plot rendering. Full map is available in Nomic Atlas.

-------------------------------------------------------------------------------

## Performance Engineering

Backend and frontend were optimized to keep interaction latency low during exploratory analysis.

| Endpoint/Module | Strategy | Response time |
|---|---|---|
| `/api/stats` (all) | Pre-serialized JSON at startup | microseconds |
| `/api/subreddits` | Pre-serialized JSON at startup | microseconds |
| `/api/events` | Pre-serialized JSON at startup | microseconds |
| `/api/network` (default modes) | Pre-serialized network JSON cache | microseconds |
| `/api/clusters?k=5/8/12/20` | Prebuilt per-k payload cache | microseconds |
| `/api/source_network?min_weight=3` | Pre-filtered cached payload | microseconds |
| `/api/timeseries` | Precomputed subreddit x granularity cache (36 combos) | microseconds |
| `/api/timeseries/blocs` | Precomputed bloc cache for day/week/month | microseconds |
| `/api/stats` (specific subreddit) | Fast in-memory filter on cleaned dataframe | about 2 ms on 8k rows |
| Semantic endpoints (`/api/search`, `/api/narrative_divergence`, `/api/velocity`) | Embedding cache avoids repeat model inference | avoids repeated embedding latency |
| HTTP transport | `flask-compress` gzip on responses | lower payload transfer time |
| Flask server | `threaded=True` | parallel request handling |
| Frontend heavy views | React lazy loading + IntersectionObserver (`350px` threshold) | lower initial render cost |
| Frontend graph stability | `React.memo` + `useRef` in node painter | avoids unnecessary force-graph re-simulation |

-------------------------------------------------------------------------------

## Sidebar as Global Context

The sidebar is implemented as a global context setter, not just navigation. Selecting a subreddit propagates a single shared filter state across panels and updates views client-side without triggering extra backend calls for each panel transition.

Example system behavior when selecting `r/Conservative`:

| Module | Result |
|---|---|
| StatBar | Shows `r/Conservative` summary metrics |
| Narrative Divergence | Pre-highlights Right bloc column |
| Semantic Search | Auto-filters to Right bloc context |
| Network Graph | Auto-selects/highlights `r/Conservative` node |

Design rationale: a single global context improves analytical continuity across heterogeneous views (time series, embeddings, network, semantic retrieval) and keeps interaction cost low.

-------------------------------------------------------------------------------

## Semantic Search Examples

Required zero-overlap and multilingual cases validated for this project:

| Query | Language | What it finds | Overlap |
|---|---|---|---|
| anger about government overreach | English | DOGE layoffs and nuclear firing discussions despite different lexical phrasing | Zero keyword overlap |
| economic anxiety workers losing income | English | Federal employee termination posts and income-loss narratives | Zero keyword overlap |
| लोकतंत्र में सत्ता का दुरुपयोग | Hindi | English posts about executive overreach and democratic power abuse | Cross-lingual semantic match |

-------------------------------------------------------------------------------

## Setup and Local Development

### Prerequisites

| Tool | Recommended |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |

### 1) Clone and enter the repository

```bash
git clone <your-fork-or-repo-url>
cd NarrativeTracker
```

### 2) Backend setup (Flask)

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Run backend:

```bash
python app.py
```

Backend runs on `http://localhost:5000`.

### 3) Frontend setup (React + Vite)

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Run frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` (default Vite port).

### 4) Optional data build scripts

The repository includes preprocessing/build scripts under `backend/` such as:

- `preprocess.py`
- `embed.py`
- `build_clusters.py`
- `build_network.py`
- `build_duckdb.py`

These are used to regenerate analytic artifacts if you modify the source dataset.

-------------------------------------------------------------------------------

## Deployment

Deployment status: not deployed yet. This section documents the target production setup.

### Backend on Render

1. Create a Render Web Service from the repository.
2. Set the root directory to `backend`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `python app.py`
5. Add environment variable `GROQ_API_KEY`.
6. Expose service on port `5000` (or use Render-assigned port mapping).

### Frontend on Vercel

1. Import repository into Vercel.
2. Set root directory to `frontend`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable `VITE_API_URL=<render-backend-url>`.

-------------------------------------------------------------------------------

## Author

Built by Tapasya Patel for the SimPPL Research Engineering internship assignment.

-------------------------------------------------------------------------------

## Citation and Acknowledgements

If you use this project structure or analysis framing in your own work, cite as:

```text
Patel, T. (2026). NarrativeTracker: Political Narrative Analysis Dashboard.
SimPPL Research Engineering Internship Assignment.
```

Acknowledgements:

- SimPPL for assignment framing and evaluation rubric.
- Reddit communities represented in the analysis dataset.
- Sentence-Transformers, FAISS, DuckDB, HDBSCAN, python-louvain, Recharts, and react-force-graph-2d ecosystems.
- Nomic Atlas for embedding-map exploration.