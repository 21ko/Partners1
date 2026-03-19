# Partners — Find Someone to Build With

> No pitch decks. Just builders.

[![Live Demo](https://img.shields.io/badge/demo-partners1.vercel.app-00B4D8)](https://partners1.vercel.app)
[![Backend](https://img.shields.io/badge/api-railway-0D1B3E)](https://partners1-production.up.railway.app/docs)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Problem

Finding a complementary builder for a weekend project or hackathon is broken. LinkedIn is for jobs, Discord is noisy, and no platform lets you signal your skills, what you want to learn, your availability, and your current idea — all at once.

The result: hackathon teams form randomly, side projects never start, and developers with complementary skills never meet.

---

## Solution

Partners is an AI-powered builder matching platform. Developers register with their GitHub username, get an auto-generated skill profile, and use a **chemistry scoring engine** (Gemini 2.0 Flash + algorithm fallback) to find complementary co-builders.

The platform produces:
- A chemistry score (0–100)
- A vibe label (🔥 Strong vibe / ✨ Good match / 🤝 Could work / 🌱 Different paths)
- A plain-language explanation of why the match works
- A concrete build idea tailored to both profiles
- An email notification to the matched builder via Resend

---

## Target Users

- Developers looking for weekend project partners
- Hackathon attendees wanting to form teams before the event
- Students finishing degrees with portfolio projects to build
- Open-source contributors looking for complementary contributors

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node 18+
- A Supabase project with the schema in `infra/schema.sql`

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in your keys in .env
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000
npm run dev
```

### Environment Variables
See `.env.example` for all required variables.

---

## Demo

**Live:** https://partners1.vercel.app  
**API Docs:** https://partners1-production.up.railway.app/docs

---

## AI Components Disclosure

| Component | Model | Provider | Purpose |
|-----------|-------|----------|---------|
| Chemistry scoring | gemini-2.0-flash-exp | Google Gemini API | Match two builder profiles, generate vibe/why/build_idea |
| Bio generation | gemini-2.0-flash-exp | Google Gemini API | Generate a casual 1-sentence bio from GitHub data |
| Algorithm fallback | Pure Python | Local (no API) | Full scoring when Gemini unavailable — zero cost, same output shape |

**The algorithm always runs first.** Gemini adjusts the base score by ±15 points only. If `GOOGLE_API_KEY` is not set, the platform runs entirely on the algorithm — no degradation in UX.

---

## Architecture Overview

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full layered diagram and data/LLM flow.

---

## Security

See [SECURITY.md](SECURITY.md) for secrets policy, authentication, PII handling, and data residency.

---

## Responsible AI

See [RAI.md](RAI.md) for model selection rationale, cost controls, guardrails, and frugal AI choices.

---

## Team

| Name | Role | GitHub |
|------|------|--------|
| Yahya Kossor | Founder & Full-Stack AI Developer | [@21ko](https://github.com/21ko) |

---

## Tech Stack

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion → Vercel  
**Backend:** Python 3.13 + FastAPI + Uvicorn → Railway  
**Database:** Supabase (PostgreSQL)  
**AI:** Google Gemini 2.0 Flash (+ pure algorithm fallback)  
**Email:** Resend  
**Auth:** Session-based (UUID tokens stored in Supabase)
