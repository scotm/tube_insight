# TubeInsight Agent Notes

Practical notes for agents working on TubeInsight: architecture, key flows, DB usage, and recommended next steps.

## Overview

- Next.js 15 + TypeScript + Bun.
- Auth via NextAuth Google OAuth with scopes for YouTube read-only.
- Gemini for analysis (model: `gemini-2.5-flash-lite`).
- Styling via Tailwind and shadcn/ui.

## Key Codepaths

- API
  - `src/app/api/youtube/playlists/route.ts`: Lists user playlists using OAuth access token.
  - `src/app/api/youtube/videos/route.ts`: Lists playlist videos (id, title, thumbnails).
  - `src/app/api/analysis/route.ts`: Analyzes a single video; now integrates DB caching.
- Auth
  - `src/lib/auth.ts`: NextAuth config; augments `session` with `accessToken` (JWT callback stores `account.access_token`).
- Gemini
  - `src/lib/gemini.ts`: Exposes `generativeModel` and `modelName`.
- YouTube
  - `src/lib/youtube.ts`: Paginates playlists and playlist items with safety caps.
- Rate limiting
  - `src/lib/rateLimit.ts`: In-memory sliding window; 10 requests / 5 min per key.
- Batch jobs (in-memory prototype)
  - `src/lib/analysisQueue.ts`: Non-persistent queue + ephemeral cache; good for demo, not durable.

## Database (Drizzle + SQLite)

- Config: `drizzle.config.ts` (dialect: sqlite, migrations in `./drizzle`).
- Client: `src/db/client.ts` uses `better-sqlite3` and a global singleton.
- Schema: `src/db/schema.ts`
  - `videos`: id, `youtube_id` (unique), optional title/channel/publishedAt, `owner_id`.
  - `video_analyses`: id, `video_id` FK, `model`, `prompt_version`, `prompt_hash`, `summary`, `insights_json`, token counts, `created_at`; unique(video_id, model, prompt_hash).
  - `transcript_caches`: id, `video_id` FK, `lang`, `source`, `content`, `fetched_at`.
- Repos: `src/db/repositories/analysis.ts`
  - `ensureVideoByYoutubeId`: upsert-by-unique `youtube_id` and return row.
  - `findAnalysis`: lookup by composite key.
  - `upsertAnalysis`: idempotent insert + read-back.
- Prompt hashing: `src/lib/hash.ts` (`sha256Hex`). In analysis route we hash `modelName + prompt` to key caches.

## Analysis Flow (current)

1) Auth check and rate limit (keyed by user email).
2) Fetch YouTube video snippet by `videoId` (API key flow).
3) Ensure `videos` row exists with snippet metadata.
4) Build deterministic prompt, compute `promptHash` from `modelName` + prompt.
5) Try DB cache via `findAnalysis`; return on hit.
6) Call Gemini on miss; persist via `upsertAnalysis`; return summary.

Notes
- `insights_json` stores arbitrary JSON as a string for portability.
- `published_at` and `created_at` are unix epoch seconds in SQLite for simplicity.
- Keep these routes on Node runtime (don’t mark as `edge`) to allow DB access.

## Environment

Required vars in `.env.local`:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
- `YOUTUBE_API_KEY` (used by `src/app/api/analysis/route.ts` for direct video lookup).
- `GEMINI_API_KEY` (Gemini SDK).
- Optional: `DATABASE_URL` (defaults to `file:./dev.db`).

## Dev Commands

- `bun run dev` / `build` / `start`.
- `bun run lint`, `bun run type-check`.
- Drizzle:
  - `bun run db:generate` → generate SQL from schema into `./drizzle`.
  - `bun run db:migrate` → apply migrations (requires `better-sqlite3`).
  - `bun run db:studio` → inspect DB in a local UI.

## Findings & Opportunities

- Caching parity
  - `src/lib/analysisQueue.ts` maintains an in-memory cache; DB now persists single-video analyses. Consider centralizing on DB-backed cache for consistency and durability.
- Warm metadata
  - `GET /api/youtube/videos` could call `ensureVideoByYoutubeId` to preload `videos` rows as users browse playlists.
- Transcript caching
  - Add helpers to `transcript_caches` (by `video_id`, `lang`, `source`) and fetch transcripts once per variant. Use prior to calling Gemini for deeper prompts.
- Prompt versioning
  - When prompt shape changes, bump `prompt_version` and/or include analysis options (e.g., temperature) in the `promptHash` input to avoid stale hits.
- Ownership & auth data
  - Currently saving `owner_id` as user email. If migrating to DB-backed NextAuth later, migrate to a stable `user_id` FK.
- Production DB
  - For Neon/Supabase Postgres: change Drizzle dialect and client, set `DATABASE_URL`, regenerate and migrate. Schema maps cleanly.
- Rate limiting durability
  - Current limiter is per-process volatile. For multi-instance or prod, move to Redis or DB-backed counters.
- Error handling & logging
  - API uses consistent helpers in `src/lib/api.ts`. Add structured logging for Gemini/YouTube failures if needed.

## Quick How-Tos

- Use DB in an API route:
  - `import { db, tables } from "@/db/client";`
  - Select: `await db.select().from(tables.videos).limit(10);`
  - Insert (idempotent): `await db.insert(tables.videos).values({...}).onConflictDoNothing(...);`
- Cache an analysis:
  - Compute: `const promptHash = sha256Hex(modelName + "\n" + prompt);`
  - Lookup: `await findAnalysis({ videoId, model: modelName, promptHash });`
  - Insert: `await upsertAnalysis({ videoId, model: modelName, promptHash, summary, insightsJson });`

## Suggested Next Steps

- Add transcript repository and integrate before Gemini calls.
- Warm `videos` table in `GET /api/youtube/videos`.
- Replace in-memory playlist job cache with a persistent `jobs` table (status, timestamps, per-video progress).
- Add minimal unit tests for repo functions and prompt hashing.
