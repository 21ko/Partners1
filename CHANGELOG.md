# Changelog — Partners

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-03-19

### Added
- Initial production release
- Builder registration with GitHub profile auto-import
- Gemini 2.0 Flash chemistry scoring engine with pure algorithm fallback
- 7-signal matching algorithm: teaching bonus, open_to overlap, ecosystem complementarity, experience gap, shared interests, availability match, recency signal
- Discover page with 5-field skill search (languages, interests, learning, bio, repo languages)
- Explore page with hackathon-first community layout, join button, inline chemistry check
- 18 communities: interest, stack, city, design, hackathon types
- Match notification emails via Resend (welcome + chemistry alert)
- Supabase PostgreSQL migration from flat-file `builders.json`
- bcrypt password hashing
- Session expiry (30 days)
- `/health` endpoint for Railway health checks
- `ARCHITECTURE.md`, `SECURITY.md`, `RAI.md`, `README.md`
- `.env.example` with all required variables
- `infra/schema.sql` with full database DDL

### Fixed
- Case sensitivity bug in skill matching (`"Python"` now matches `"python"` in learning goals)
- `created_at` / `updated_at` datetime serialisation for Pydantic v2
- CORS configuration via `ALLOWED_ORIGINS` environment variable
- Stray `{²` syntax error in `fetch_github_data`
- Vercel build not picking up `VITE_API_URL` (resolved via `authService.ts` hostname detection)

### Security
- Passwords migrated from plain text to bcrypt (cost factor 12)
- API keys removed from source code and moved to environment variables
- PII fields excluded from Gemini API calls

---

## [0.2.0] — 2026-03-15

### Added
- Communities system: `/communities`, `/communities/{id}/members`, `/communities/{id}/join`
- Email notifications: welcome email on registration, match notification on chemistry check
- Explore page rewrite with community cards and member panel

### Changed
- Discover filter broadened from 2 fields to 5 fields
- Matching algorithm base score lowered from 40 to 30

---

## [0.1.0] — 2026-03-10

### Added
- Initial working prototype
- Registration, login, profile update
- Discover with basic filtering
- Chemistry scoring with Gemini + algorithm fallback
- `builders.json` flat-file storage
- Basic dashboard, discover, profile pages
