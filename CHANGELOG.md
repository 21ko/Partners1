# Partners — Session Changelog

> Everything that changed in this session, from first message to last.  
> **QA reviewed:** 2026-03-18 — inaccuracies corrected, security status updated.

---

## 1. Discover Filter Fix (`Discover.tsx` + `main.py`)

**Problem:** Typing a skill in the Discover filter returned no results.

**Root cause:** The backend used exact string matching — `"AI Tools"` never matched `"ai_tools"`. Also a stray `{²` character in `fetch_github_data` caused a `SyntaxError` on register.

**Fixes:**
- Replaced exact match with case-insensitive substring search across `interests` and `github_languages`
- Removed the `{²` typo from `main.py`

---

## 2. Matching Algorithm Rewrite (`brain.py`)

**Problem:** The algorithm had a case sensitivity bug, a high base score that inflated all matches, and ignored several key fields entirely.

**Fixes:**
- Fixed case sensitivity — `"Python"` now matches `"python"` in learning goals, so the teaching bonus actually fires
- Lowered base score from 40 → 30 so scores are earned
- Added `open_to` overlap scoring (+12 per shared item)
- Added ecosystem complementarity — frontend + backend scores higher than frontend + frontend
- Added experience gap scoring — junior + senior pair scores better than two seniors
- Added availability compatibility — both `this_weekend` gets a bonus, one `busy` gets penalized
- Added project idea keyword overlap from `current_idea` field
- Added recency signal — active this week +10, inactive 90+ days -8
- Capped shared stack bonus at 8 points so "we both know Python" can't dominate
- Added `🌱 Different paths` vibe label for low scores
- Passed `open_to` field to Gemini prompt for better AI matching
- Switched project idea matching to use ecosystem buckets instead of raw language names

---

## 3. Skill Search Broadened (`main.py`)

**Problem:** Searching `"css"` returned no one even if builders had CSS in their repos.

**Fix:** Filter now searches across 5 fields instead of 2:
- `github_languages`
- `interests`
- `learning`
- `bio`
- `github_repos` language field

---

## 4. Email Notifications (`emails.py` + `main.py`)

**Problem:** No way to notify builders when someone checks their chemistry.

**New file:** `emails.py` — all email logic using Resend API.

**Two emails added:**
- **Welcome email** — sent on registration if email provided
- **Match notification email** — sent to target builder when someone clicks `CHECK_CHEMISTRY`, includes chemistry score, vibe, why, and build idea

**Changes to `main.py`:**
- Import `send_match_notification` and `send_welcome_email`
- Trigger welcome email in `/register`
- Trigger match notification in `/match/{target_username}` (skipped for demo matches)

**New env var required:** `RESEND_API_KEY`

---

## 5. Database Migration to Supabase (`database.py` + `main.py`)

**Problem:** `builders.json` flat file corrupts under concurrent writes and doesn't scale.

**New file:** `database.py` — all database operations using `psycopg2` + Supabase PostgreSQL.

**Functions added:**
- `get_builders()` — fetch all builders
- `get_builder_by_username()` — fetch single builder
- `upsert_builder()` — insert or update builder
- `save_session()` / `get_session_username()` — session management
- `delete_expired_sessions(days=30)` — cleanup stale sessions (call on a cron job)
- `get_communities()` / `get_community_by_id()` — community queries
- `get_community_members()` — members via join table
- `join_community()` — add member to community (idempotent)

**`main.py` fully rewritten** to remove all `builders.json`, `load_data()`, `save_data()`, `init_data_file()` logic. Every operation now goes through `database.py`.

**New env var required:** `DATABASE_URL`

**Helper added:** `_row_to_dict()` and `_safe_profile()` to safely convert psycopg2 rows to Pydantic models with correct defaults.

**Password security:** `hash_password()` and `verify_password()` use `bcrypt` — new registrations are hashed. Legacy plain-text accounts fall back to direct compare until migrated. ✅

---

## 6. Communities System (`main.py` + `db.py` + Supabase)

**Problem:** `/communities`, `/communities/{id}/members`, and `/communities/{id}/join` endpoints were called by the frontend but didn't exist in the backend.

**Backend fixes:**
- Added `GET /communities` — returns all communities with live member counts
- Added `GET /communities/{id}/members` — returns builders in a community
- Added `POST /communities/{id}/join` — adds user to community

**Supabase tables created:**
```sql
CREATE TABLE communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'general',
  host_username TEXT,
  event_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (community_id, username)
);
```

**Communities seeded:**
- AI Tools, Web Apps, Dev Tools, Mobile, Open Source, UI/UX
- Claw Paris — March 19 (hackathon)

---

## 7. Explore Page Rewrite (`Explore.tsx`)

**Problem:** Explore showed a plain builder grid with no communities, no join button, no way to act on what you saw.

**Rewritten with:**
- **ACTIVE_HACKATHONS** section at top — green glow, LIVE pulse badge, progress bar showing builders joined
- **ALL_COMMUNITIES** section — color coded by type (green = hackathon, blue = interest, purple = stack, pink = design)
- **JOIN button** on every card — fires `authService.joinCommunity()`, updates count live, shows `✓ JOINED`
- **Click card → member panel** — shows all members with search bar
- **CHEMISTRY button** on each member — runs match inline, shows score + why + build idea + GitHub link without leaving the page
- Match result appears inline at top of panel so you can check multiple people quickly

---

## 8. Vercel Build Fix (`vercel.json`)

**Problem:** Vercel was building from repo root instead of `frontend/` folder, so `VITE_API_URL` env var was never injected and the app called `localhost:8000` in production.

**Fix:** Added `vercel.json` at repo root:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": null
}
```

---

## Files Changed This Session

| File | Status | What changed |
|------|--------|--------------|
| `main.py` | Rewritten | Supabase DB, communities endpoints, email triggers, broad skill filter |
| `brain.py` | Rewritten | Full algorithm rewrite with 7 new signals, case fix |
| `database.py` | New | All Supabase/PostgreSQL operations (note: file is `database.py`, not `db.py`) |
| `emails.py` | New | Resend welcome + match notification emails |
| `frontend/pages/Explore.tsx` | Rewritten | Communities hub with hackathons, join, chemistry in panel |
| `vercel.json` | New | Forces Vercel to build from `frontend/` folder |
| `requirements.txt` | Updated | Added `resend`, `psycopg2-binary`, `bcrypt` |

---

## Environment Variables Required

| Variable | Where | Value |
|----------|-------|-------|
| `DATABASE_URL` | Railway | Supabase PostgreSQL connection string |
| `RESEND_API_KEY` | Railway | Resend API key |
| `GOOGLE_API_KEY` | Railway | Gemini API key |
| `VITE_API_URL` | Vercel | Railway backend URL |
| `APP_URL` | Railway | Your Vercel frontend URL (used in email CTAs) |

---

## Still To Do / Known Issues

### Security (Critical)
- [ ] Rotate all exposed API keys (Supabase password, Resend, Google) — **do this first**
- [x] Hash passwords — ✅ bcrypt is in `database.py`. Legacy users still have plain-text fallback; run a rehash migration
- [ ] Remove plain-text password fallback in `verify_password()` after migration
- [ ] Rate limit `/match` endpoint — unlimited Gemini API calls = cost risk
- [ ] Restrict CORS from `"*"` to your Vercel domain in `main.py`
- [ ] Call `delete_expired_sessions()` on a schedule — sessions currently never expire

### Features
- [ ] Make email required on registration form (currently `Optional`)
- [ ] Fix `@builder` username display bug on dashboard welcome
- [ ] Add `APP_URL` env var to Railway (email CTAs fall back to wrong domain)
- [ ] Verify custom sender domain in Resend (currently using sandbox `onboarding@resend.dev`)
- [ ] Delete or gitignore `backend/builders.json` — leftover from old JSON storage
- [ ] Add username validation (min 3 chars, alphanumeric + underscore only)
- [ ] Add logout endpoint that deletes the session row from DB (not just localStorage)

### Testing
- [ ] Test full flow end-to-end on live Railway + Vercel URL
- [ ] Confirm welcome email arrives after registration with email
- [ ] Confirm match notification arrives when chemistry is checked
- [ ] Confirm `VITE_API_URL` is not `localhost` in production network tab
