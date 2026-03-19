# Responsible & Frugal AI — Partners

## Model Selection Rationale

### Why Gemini 2.0 Flash?

| Criterion | Choice | Rationale |
|-----------|--------|-----------|
| Speed | Flash (not Pro) | Match checks must feel instant — Flash delivers < 2s P95 |
| Cost | Flash | ~$0.002/match vs ~$0.015 for Pro. 7.5× cheaper. |
| Quality | Sufficient | Chemistry scoring needs casual language, not complex reasoning |
| Availability | Cloud API | No GPU required — runs on Railway ($5/mo) |

### Why not GPT-4o / Claude?
Both are higher quality but 5–10× more expensive per token. For a use case that generates short, casual text (< 100 tokens output), Flash quality is indistinguishable from Pro models.

### Why keep a pure algorithm fallback?
- **Zero cost:** Algorithm runs locally, no API call
- **Deterministic:** Same inputs always produce same score — auditable
- **Resilient:** Platform works fully if Google API is down or quota is exhausted
- **Consistent baseline:** Gemini can only adjust the base score ±15 points — prevents hallucinated extreme scores

---

## Guardrails

### Input guardrails
- All user inputs validated by Pydantic v2 before reaching `brain.py`
- String fields have maximum length constraints
- List fields (interests, languages) capped at reasonable lengths

### Output guardrails
- Gemini output is parsed as JSON — malformed responses fall back to algorithm silently
- `chemistry_score` is clamped to `[0, 100]` regardless of what Gemini returns
- `vibe` label is validated against a fixed enum — unexpected values are replaced with algorithm fallback label
- Final score is a blend: `base_score + (gemini_score - 50) / 3.5` — prevents wild swings

### What Gemini cannot do
- It cannot set a score above 100 or below 0
- It cannot access user emails, passwords, or PII
- It cannot trigger any side effects — it only returns text

---

## Frugal AI Choices

| Choice | Impact |
|--------|--------|
| Algorithm-first, Gemini-adjust | 95% of compute stays local — only the adjustment is cloud AI |
| Flash model over Pro | 7.5× cost reduction with negligible quality loss for this use case |
| No vector database | Matching is skill-based, not semantic — eliminates embedding costs entirely |
| No fine-tuning | Zero training cost — prompt engineering only |
| Fallback on every failure | No retry storms — one attempt, then algorithm |
| Short prompts | Input tokens kept under 300 per call — output under 100 |

**Estimated monthly AI cost at 1,000 matches/day:** ~$2/month (Gemini Flash pricing as of March 2026)

---

## Bias Considerations

### Potential biases in matching
- **Language bias:** Gemini was trained primarily on English — non-English bio text may score differently
- **GitHub activity bias:** Builders with more public repos score higher on recency/complementarity signals. Low-activity builders are not penalised in the base score (starts at 30/100)
- **City bias:** Local matching gives a +5 bonus — intentional design choice for hackathon use case, not a protected characteristic

### Mitigation
- The algorithm baseline ensures no builder scores 0 on chemistry — minimum is 30/100
- Users can see the full explanation (`why` field) for any match — transparency over black-box scoring
- Chemistry scores are framed as "build compatibility", not personal judgement

---

## Environmental Impact

| Component | Footprint | Notes |
|-----------|-----------|-------|
| Vercel frontend | Negligible | Static files on CDN |
| Railway backend | Very low | Serverless-like, scales to zero when idle |
| Supabase | Low | Managed PostgreSQL, shared infrastructure |
| Gemini API calls | Low | Cloud inference, Google's infrastructure |
| No GPU required | ✓ | No self-hosted model inference |

**Overall assessment:** LOW environmental impact. The architecture is designed to minimise compute — no always-on GPU, no large model self-hosting, no vector embedding pipeline.

---

## Evals

### Current
- Manual QA: chemistry scores verified against expected output for known pairs (alice/bob demo matches hardcoded in `DEMO_MATCHES`)
- Algorithm smoke test: `python brain.py` runs end-to-end with test profiles

### Planned
- `pytest -k smoke` covering: registration → profile fetch → chemistry score → email trigger
- Score regression tests: given fixed input profiles, score must stay within ±5 across deployments
