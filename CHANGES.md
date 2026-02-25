# Partners – Day 1 Rebuild: Change Log

> **Date:** Feb 24, 2026  
> **Purpose:** Shift the product vision from *"AI co-founder matching"* to *"Find someone to build with"* — casual collaboration for weekend projects and hackathons, with real GitHub data at the core instead of manual bio input.

---

## Why This Rebuild?

The original app asked users to paste two developer bios and returned a "Long-term Co-founder Compatibility Score." This created two problems:

1. **The wrong audience.** Most developers don't want a co-founder — they want someone to build something fun with this weekend.
2. **No real data.** Manually written bios are unreliable and take effort to write. GitHub profiles tell the real story.

The rebuild fixes both: automatic GitHub profile fetching replaces manual bios, and the matching language shifts from corporate ("synergy", "co-founder") to human ("build chemistry", "weekend projects").

---

## Backend Changes

### `backend/brain.py` — Complete Rewrite

**Before:** Two functions — `get_matches(bio1, bio2)` and `generate_bio(github_url)`. The matching prompt used words like "co-founder", "long-term compatibility", and "synergy analysis." Google Search grounding was used unnecessarily.

**After:**

| New Function | Purpose |
|---|---|
| `fetch_github_profile(github_username)` | Fetches real GitHub data (avatar, repos, languages, stars) using the GitHub REST API — no auth token needed for public profiles |
| `analyze_github_profile(github_data)` | Sends GitHub data to Gemini and generates a casual 1-2 sentence bio (no buzzwords, sounds like a real person) |
| `find_build_matches(builder_a, builder_b)` | Analyzes chemistry between two builders — checks complementary skills, interests, and working style. Returns `chemistry_score`, `vibe`, `why`, and a concrete `build_idea` |
| `DEMO_BUILDERS` list | 5 pre-built builder profiles (alex_builds, sara_designs, ml_marco, backend_bea, mobile_max) for instant demos without any API calls |
| `DEMO_MATCHES` dict | Pre-cached match results for common demo pairs so the match screen is instant on demo |

**Why:** The old Gemini model chain tried `gemini-3-pro-preview` first (doesn't exist), causing errors. The new chain tries `gemini-2.0-flash-exp` → `gemini-2.0-flash` → `gemini-1.5-flash` — all real, available models. Demo mode means the app works even without a Gemini API key set up.

---

### `backend/main.py` — Complete Rewrite

**Before:** Endpoints: `POST /register` (with bio field), `POST /login`, `POST /update-bio`, `POST /generate-bio`, `POST /match` (takes bio1 + bio2). User data stored in `users.json`.

**After:**

| Endpoint | Method | What it does |
|---|---|---|
| `/health` | GET | Health check — required for Railway deployment |
| `/register` | POST | Takes `username`, `password`, `github_username`. Fetches GitHub profile, generates bio via Gemini, creates builder profile |
| `/login` | POST | Returns full builder profile object + session_id |
| `/profile/{username}` | GET | Get any builder's public profile |
| `/profile/update` | POST | Update `building_style`, `interests`, `open_to`, `availability`, `current_idea`, `city` |
| `/discover` | GET | Browse all builders (excludes current user). Supports `filter_interest` query param |
| `/match/{target_username}` | POST | AI chemistry analysis between current user and target builder |

**Why the new DB structure (`builders.json`):** The old `users.json` stored only username, password, bio. The new `builders.json` stores the full builder profile including GitHub data, interests, and availability — everything needed for meaningful matching without extra API calls.

**Why instant seeding:** The old startup fetched live GitHub profiles for demo users on every cold start, hitting rate limits. The new startup uses `DEMO_BUILDERS` from `brain.py` — instant, no network calls.

---

## Frontend Changes

### `frontend/types.ts` — Complete Rewrite

**Before:** `Builder` had fields like `id`, `name`, `role`, `skills`, `projectsCount`, `location`, `availability: 'Looking for Team' | 'Solo Building' | 'Just Browsing'`, `links`, `pastProjectsList`, `lookingFor`.

**After:** `Builder` now maps 1:1 with the backend schema:

```typescript
interface Builder {
  username: string;           // replaces: id + name
  github_username: string;    // new
  avatar: string;
  bio: string;                // AI-generated from GitHub
  building_style: 'ships_fast' | 'plans_first' | 'designs_first' | 'figures_it_out';  // new
  interests: string[];        // new
  open_to: string[];          // new
  availability: 'this_weekend' | 'this_month' | 'open' | 'busy';  // changed values
  current_idea?: string;      // new
  city?: string;              // new
  github_languages: string[]; // new
  github_repos: GithubRepo[]; // new
  total_stars: number;        // new
  public_repos: number;       // new
}
```

**Why:** The old type was invented for the UI mock. The new type reflects real data from GitHub + the backend, so there's no data transformation layer needed.

Also added: `MatchResult`, `AuthResponse`, `Session` interfaces. Removed: `Hackathon`, `Project`, `SynergyHackathon`, `IntegratedMatchResult` (these were for the old co-founder flow).

---

### `frontend/services/authService.ts` — Rewrite

**Before:** `register({ username, password, bio })`, stores `session_id`, `username`, `bio` separately in localStorage.

**After:**
- `register({ username, password, github_username })` — collects GitHub username instead of bio
- `login()` — returns the full builder profile from the new backend
- `updateProfile(updates)` — calls `POST /profile/update` for the new editable fields
- `saveSession()` / `getSession()` — stores and retrieves the full `Builder` profile object in localStorage as JSON, not individual fields

**Why:** The session now carries the full profile object so any component can access it without a network call.

---

### `frontend/pages/AuthPage.tsx` — Rewrite

**Before:** Registration had a `Developer Bio` textarea where users manually wrote about themselves.

**After:** Registration has a `GitHub Username` field with a `github.com/` prefix display. During registration the button says *"Fetching GitHub profile..."* so users understand what's happening.

**Why:** Manual bios are the core problem this product solves. The auth page should model the new vision from the first interaction.

---

### `frontend/pages/Matchmaker.tsx` → Discover Page — Complete Rewrite

**Before:** A matchmaker UI that took two bio text inputs and called the old `/match` endpoint.

**After:** A Discover page — a live grid of builder cards fetched from `GET /discover`, with:
- Availability badge and building style tag on each card
- GitHub languages shown as code chips
- Current idea shown as a quote
- `⚡ Check Build Chemistry` button that calls `POST /match/{username}` and shows an inline chemistry panel with score bar, vibe line, explanation, and a concrete build idea

**Why:** The core product experience changed from "paste two bios, get a score" to "browse builders, click one, see if you'd work well together."

---

### `frontend/pages/Profile.tsx` — Complete Rewrite

**Before:** Editable fields: `name`, `bio`, `skills` (tag input), `pastProjectsList`, `lookingFor` (checkboxes for co-founder, frontend dev, etc.). Called `authService.updateBio()` on save.

**After:** Displays GitHub data (avatar, languages, stars, repos) at the top. Editable fields:
- `building_style` — button grid picker
- `availability` — button list picker
- `current_idea` — text input
- `interests` — tag input with add/remove
- `open_to` — checkboxes (weekend projects, hackathons, open source, freelance, co-founder search)

Also shows clickable GitHub repo cards with stars, language, and description.

Calls `authService.updateProfile()` on save, which hits `POST /profile/update`.

**Why:** The old profile was generic. The new one shows what actually matters for build matching — your GitHub output and your current availability/intent.

---

### `frontend/pages/Explore.tsx` — Rewrite

**Before:** Used hardcoded `Builder[]` with the old type fields (`name`, `role`, `skills`, `id`). Filter buttons used old availability labels (`'Looking for Team'`, `'Solo Building'`).

**After:** Static community directory with 6 hardcoded builders using the new `Builder` type shape. Filters use the new availability values (`this_weekend`, `this_month`, `open`). Search works on `username`, `bio`, `github_languages`, and `interests`.

**Why:** Required to match the new `Builder` type — the old data shapes caused TypeScript compile errors.

---

### `frontend/components/BuilderCard.tsx` — Rewrite

**Before:** Displayed `builder.name`, `builder.role`, `builder.location`, `builder.skills` tags, availability dot based on `'Looking for Team'`.

**After:** Displays `@{builder.username}`, `builder.city`, `builder.github_languages` as monospace chips, `builder.bio`, availability dot color mapped to new availability values.

**Why:** Same reason — the old field names (`name`, `role`, `skills`) no longer exist on the `Builder` type.

---

### `frontend/services/geminiService.ts` — Deprecated

**Before:** Called the old `/match` (bio1/bio2) and `/generate-bio` endpoints directly.

**After:** Replaced with a stub/comment explaining that all matching is now handled via `POST /match/{username}` directly in `Matchmaker.tsx`.

**Why:** The old service is no longer needed — matching is a backend concern with session authentication.

---

### `frontend/App.tsx` — Updated

**Before:** Reconstructed a `Builder` object from individual localStorage fields (`username`, `bio`), using old type fields like `id`, `name`, `role`, `skills`, `pastProjectsList`.

**After:** Reads the full `Builder` profile object from the session via `authService.getSession()`. `handleUserUpdate()` both updates state and persists the updated profile back to localStorage. Page title for the matchmaker tab changed from `'AI Co-founder Scout'` to `'Find Your Build Partner'`.

**Why:** The new session stores the full profile, so no reconstruction is needed. The title update reflects the new product voice.

---

## Summary of Removed Concepts

| Old | Why Removed |
|---|---|
| `bio1` / `bio2` matching | Replaced by GitHub-profile-based matching |
| "Co-founder" language | Wrong audience — builders want project partners, not co-founders |
| "Synergy Score" / "Compatibility Score" | Replaced by "Build Chemistry Score" — more casual, more honest |
| Google Search grounding | Wasn't needed for profile matching; added latency and cost |
| `users.json` | Replaced by `builders.json` with the full builder schema |
| Hackathon recommendations in match output | Removed — the platform is about finding people, not events |
| `gemini-3-pro-preview` model | Doesn't exist; replaced with real available models |

---

*Built Feb 24, 2026 — Partners. "Find someone to build with. No pitch decks."*
