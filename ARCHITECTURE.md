# Architecture — Partners

## System Overview

Partners follows a standard three-tier web architecture with an AI scoring layer sitting between the API and the database.

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│              React 18 + TypeScript + Vite                        │
│              Hosted on Vercel CDN (Edge Network)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                             │
│                   Python 3.13 · Railway                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Auth Layer  │  │  Discovery   │  │   Match Engine       │  │
│  │  /register   │  │  /discover   │  │   /match/{username}  │  │
│  │  /login      │  │  /communities│  │   brain.py           │  │
│  │  /logout     │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└──────┬──────────────────────┬──────────────────┬────────────────┘
       │                      │                  │
       ▼                      ▼                  ▼
┌─────────────┐   ┌───────────────────┐  ┌─────────────────────┐
│  Supabase   │   │  Google Gemini    │  │  Resend Email API   │
│ PostgreSQL  │   │  2.0 Flash (ext.) │  │  (external)         │
│  (external) │   │  OR Algorithm     │  │                     │
└─────────────┘   │  Fallback (local) │  └─────────────────────┘
                  └───────────────────┘
                          │
                  ┌───────────────────┐
                  │  GitHub REST API  │
                  │  (registration    │
                  │   only, public)   │
                  └───────────────────┘
```

---

## Layer-by-Layer Breakdown (10 Layers)

### L1 — Infrastructure
- **Frontend:** Vercel CDN — serverless, zero idle cost, auto-scales globally
- **Backend:** Railway — Python 3.13, auto-deploy on git push, $5/mo baseline
- **Database:** Supabase (PostgreSQL) — managed, free tier, SSL required
- **Rationale:** All serverless or near-serverless. No idle compute cost.

### L2 — Foundation Model
- **Primary:** `gemini-2.0-flash-exp` via Google Gemini API
- **Fallback:** Pure Python algorithm (`brain.py` → `_algo_match`)
- **Inference location:** Cloud (Google infrastructure, EU/US)
- **The algorithm runs first** — Gemini adjusts base score ±15 pts only
- **Cost:** ~$0.002 per match check. Zero cost when API key absent.

### L3 — Security
- Passwords: bcrypt hashed before storage
- Sessions: UUID tokens, stored in Supabase `sessions` table, 30-day expiry
- CORS: configurable via `ALLOWED_ORIGINS` env var
- No PII sent to Gemini — only skill data, interests, languages, availability
- Secrets via environment variables only, never in code

### L4 — Data
- **Source:** GitHub REST API (public data only, no OAuth required)
- **Stored:** builders, sessions, communities, community_members tables
- **Schema:** See `infra/schema.sql`
- **Freshness:** Profile updated on each `/profile/update` call
- **No vector DB** — matching is algorithmic + LLM, not semantic search

### L5 — Application & Orchestration
- FastAPI handles all routing, validation (Pydantic v2), and error handling
- `brain.py` orchestrates: algorithm score → Gemini call → blend → return
- Retries: Gemini failures fall back to algorithm silently
- Caching: none currently (sessions cached client-side in localStorage)

### L6 — Sponsorship / Governance
- Solo founder project — Yahya Kossor (MSc AI, ECE Paris)
- Academic context: end-of-studies project
- No external funding

### L7 — Business Process
- **Before:** Developers find teammates randomly at hackathons or via DMs
- **After:** Developers check chemistry score before the event, arrive knowing their match
- **Human-in-the-loop:** All match results are shown to the user before any action. No automated outreach.

### L8 — Governance
- Model outputs (why, build_idea) are clearly labelled as AI-generated
- Algorithm fallback ensures deterministic baseline behaviour
- No model registry yet — single model version pinned in code

### L9 — Onboarding / Training
- Users onboard via GitHub username — no manual skill entry required
- Gemini generates bio automatically from repo data
- 4-step onboarding for users with empty GitHub profiles

### L10 — UX / KPIs / Performance
- **KPI 1:** Chemistry check latency < 3s P95
- **KPI 2:** Registration < 5s (includes GitHub API call)
- **KPI 3:** Email delivery < 30s after match trigger
- Feedback: users can retrigger chemistry checks freely

---

## Data Flow — Match Request

```
User clicks CHECK_CHEMISTRY
        │
        ▼
POST /match/{target_username}?session_id=...
        │
        ├─► Validate session (Supabase sessions table)
        ├─► Fetch current_user profile (Supabase builders table)
        ├─► Fetch target_user profile (Supabase builders table)
        │
        ▼
brain.py: calculate_skill_synergy()
        │  Base score (30pts) + 7 signals = base_score (0-100)
        │
        ├─► [If GOOGLE_API_KEY set]
        │       Gemini 2.0 Flash API call
        │       → returns {chemistry_score, vibe, why, build_idea}
        │       → blend: final = base_score + (gemini_score - 50) / 3.5
        │
        └─► [If no API key or Gemini fails]
                Algorithm fallback: _algo_match()
                → returns same shape, zero cost
        │
        ▼
[If target has email]
    Resend API → match notification email
        │
        ▼
Return MatchResponse to frontend
```

---

## Database Schema

```sql
-- See infra/schema.sql for full DDL

builders          -- user profiles + GitHub data
sessions          -- UUID session tokens
communities       -- 18 communities (6 interest, 5 city, 3 stack, 1 design, 3 hackathon)
community_members -- join table: community_id × username
```

---

## LLM Flow — Bio Generation

```
User registers with GitHub username
        │
        ▼
GitHub API → fetch repos, languages, stars, bio
        │
        ▼
[If bio empty or < 10 chars]
    brain.py: analyze_github_profile()
        │
        ├─► Gemini 2.0 Flash → 1-sentence casual bio
        └─► Algorithm fallback → template-based bio
        │
        ▼
Stored in builders.bio (Supabase)
```
