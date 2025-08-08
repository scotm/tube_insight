# Draft GitHub Issues for TubeInsight

Below are ready-to-file issues derived from AGENTS.md findings. Each includes context, scope, and acceptance criteria.

## 1) Centralize analysis caching in DB

- Background: `src/lib/analysisQueue.ts` uses an in-memory cache while `src/app/api/analysis/route.ts` now persists caches in `video_analyses`.
- Proposal: Remove the in-memory analysis cache in favor of DB-backed caching using Drizzle repositories.
- Scope:
  - Replace `getCached`/`setCache` in `analysisQueue.ts` with DB lookups/writes.
  - Use `sha256(modelName + "\n" + prompt)` as the cache key and `videos.id` FK.
- Acceptance Criteria:
  - Playlist batch analysis reuses DB-cached results when available.
  - No reliance on in-memory cache; process restarts do not lose cache.

## 2) Warm videos metadata when listing playlist videos

- Background: We only persist a video row during single-video analysis.
- Proposal: While returning videos from `/api/youtube/videos`, call `ensureVideoByYoutubeId` to upsert minimal metadata.
- Scope:
  - Import repo helper and upsert each video with id/title/channel if present.
- Acceptance Criteria:
  - Navigating playlists results in corresponding rows in `videos`.
  - Endpoint latency remains acceptable (<300ms overhead for 50 items).

## 3) Add transcript repository and caching

- Background: Schema has `transcript_caches` but no helpers/integration.
- Proposal: Implement repo helpers to get/set transcripts by `(video_id, lang, source)` and use before Gemini calls.
- Scope:
  - `src/db/repositories/transcripts.ts` with `getTranscript`, `saveTranscript`.
  - Optional: API route to fetch/store transcripts explicitly.
- Acceptance Criteria:
  - Analysis route checks transcript cache prior to model call when transcript is available.
  - Transcripts persisted once per language/source.

## 4) Prompt versioning and cache invalidation

- Background: Caches key off `modelName + prompt`; changing prompt shape risks stale caches.
- Proposal: Introduce a `PROMPT_VERSION` constant and include it in the cache key and `prompt_version` column.
- Scope:
  - Export `PROMPT_VERSION` from a central file (e.g., `src/lib/prompts.ts`).
  - Update hashing to include version and pass to `upsertAnalysis`.
- Acceptance Criteria:
  - Bumping `PROMPT_VERSION` causes clean cache misses and fresh analysis writes.

## 5) Stable ownership identifiers

- Background: `videos.owner_id` currently stores user email; may change in future.
- Proposal: Plan for NextAuth Prisma/Drizzle adapter or a custom user table, storing a stable `user_id`.
- Scope:
  - Introduce `users` table OR integrate a NextAuth adapter later and migrate `owner_id`.
- Acceptance Criteria:
  - New records reference a stable ID; migration plan documented.

## 6) Production DB: Postgres migration path

- Background: SQLite in dev; production likely Postgres (Neon/Supabase).
- Proposal: Document config changes and provide a Postgres client switch.
- Scope:
  - Add a short guide in README for changing `drizzle.config.ts`, driver, and `DATABASE_URL`.
  - Verify schema compatibility and generate initial Postgres migrations.
- Acceptance Criteria:
  - Clear, tested steps to run on Postgres.

## 7) Durable rate limiting

- Background: Current limiter is in-memory and per-process.
- Proposal: Move to Redis or DB-backed sliding window for multi-instance robustness.
- Scope:
  - Add `@upstash/redis` or a small Drizzle-based counters table with TTL semantics.
- Acceptance Criteria:
  - Rate limit persists across restarts and is shared by multiple instances.

## 8) Structured error handling and logging

- Background: Console errors exist, but not structured or correlated.
- Proposal: Introduce a minimal logger abstraction and structured fields for YouTube/Gemini errors.
- Scope:
  - Add `src/lib/logger.ts` wrapper.
  - Replace console.error in API routes with structured logging.
- Acceptance Criteria:
  - Errors include route, user/session presence, video/playlist IDs, and cause.

## 9) Persistent jobs for playlist analysis

- Background: `analysisQueue.ts` keeps in-memory jobs and result cache.
- Proposal: Add a `jobs` table (id, playlist_id, status, total, completed, timestamps) and a `job_results` table (job_id, video_id, analysis).
- Scope:
  - Define schema + repos, update queue functions to persist state.
  - Optionally add a route to fetch job status/results.
- Acceptance Criteria:
  - Jobs survive restarts; UI can poll status deterministically.

## 10) Unit tests for repositories and utilities

- Background: No tests cover DB repos or hashing.
- Proposal: Add tests for `ensureVideoByYoutubeId`, `findAnalysis`, `upsertAnalysis`, and `sha256Hex`.
- Scope:
  - Use Jest setup to run against a temp SQLite file.
- Acceptance Criteria:
  - Tests pass on CI; failure cases covered (conflicts, missing rows).

