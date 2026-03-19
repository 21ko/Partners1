# Security — Partners

## Secrets Policy

All secrets are stored as environment variables. No secrets appear in source code, commit history, or logs.

| Variable | Purpose | Where set |
|----------|---------|-----------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | Railway env vars |
| `GOOGLE_API_KEY` | Gemini 2.0 Flash API | Railway env vars |
| `RESEND_API_KEY` | Transactional email | Railway env vars |
| `ALLOWED_ORIGINS` | CORS whitelist | Railway env vars |

A `.env.example` file with placeholder values is included in the repository. Real values are never committed.

**Rotation policy:** Any key accidentally exposed (e.g. in chat, logs, or commits) must be rotated immediately via the provider dashboard.

---

## Authentication & Authorization

### Session-based auth
- On login/register, the server generates a `UUID v4` session token
- Token is stored in the `sessions` table (Supabase PostgreSQL)
- Token is returned to the client and stored in `localStorage`
- Every authenticated request passes `?session_id=<token>` as a query parameter
- Server validates the token against the `sessions` table on each request

### Session expiry
- Sessions older than 30 days are invalidated via `delete_expired_sessions()`
- No refresh token mechanism — users re-login after expiry

### Password storage
- Passwords are hashed with **bcrypt** before storage (cost factor 12)
- Plain-text passwords are never stored or logged
- No password reset flow currently implemented

### Authorization
- All profile mutation endpoints (`/profile/update`, `/communities/{id}/join`) require a valid session
- Users can only modify their own profile — session username is extracted server-side, never trusted from the client
- Public read endpoints (`/discover`, `/profile/{username}`, `/communities`) do not require authentication

---

## PII Handling

### What we store
| Field | Sensitivity | Notes |
|-------|------------|-------|
| `email` | Medium | Optional at registration. Used only for match notifications. |
| `username` | Low | Public, chosen by user |
| `city` | Low | Optional, coarse-grained (city level only) |
| `avatar` | Low | GitHub CDN URL |
| `github_username` | Low | Public |

### What we do NOT store
- IP addresses
- Device fingerprints
- Browsing behaviour or analytics
- Payment data

### What is sent to Gemini
Only anonymised skill data is sent to the Gemini API:
- `interests` (list of strings)
- `building_style` (enum)
- `github_languages` (list of strings)
- `current_idea` (free text — users should not include PII here)
- `availability` (enum)
- `learning` (list of strings)
- `experience_level` (enum)
- `open_to` (list of strings)

**Email addresses, passwords, city, and avatar URLs are never sent to any LLM.**

---

## Data Residency

| Service | Region | Notes |
|---------|--------|-------|
| Supabase | EU West (AWS eu-west-1) | PostgreSQL — all user data |
| Railway | US West | FastAPI backend |
| Vercel | Edge (global CDN) | Static frontend only |
| Google Gemini API | Google Cloud (global) | Skill data only, no PII |
| Resend | US | Email delivery |

---

## CORS Policy

CORS is controlled via the `ALLOWED_ORIGINS` environment variable.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Current setting:** `*` (wildcard) during development/early production.  
**Recommended:** Lock to `https://partners1.vercel.app` once domain is stable.

---

## Known Limitations & Planned Improvements

| Risk | Status | Mitigation |
|------|--------|-----------|
| No rate limiting on `/match` | Open | Planned — max 20 checks/user/day |
| Session tokens in localStorage | Accepted | Suitable for this use case; HttpOnly cookies planned |
| No HTTPS enforcement at app level | Mitigated | Railway and Vercel enforce HTTPS at infrastructure level |
| `current_idea` free text sent to Gemini | Low risk | Users advised not to include PII; no enforcement yet |
