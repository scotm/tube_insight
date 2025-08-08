# NEXT_STEPS

This document translates the current repo state into a concrete, actionable plan that aligns with PROJECT_PLAN.md. It focuses on unblocking the core user flow, then layering robustness and polish.

## Snapshot

- Phase 1 largely done; early Phase 2 started.
- Implemented: Google OAuth (NextAuth v5), playlist and videos API, dashboard listing with search, Gemini client, basic analysis endpoint.
- Missing/Gaps: hooks, tests, deployment setup, enhanced client UX for very large lists.

## Priority 0 — Unblock Core Flow (1–2 days)

Goal: User can open a playlist, see videos, run an analysis, and read the result.

1) ~~Playlists detail page~~ (completed)
- Path: `src/app/playlists/[id]/page.tsx`
- Fetch via `/api/youtube/videos?playlistId=<id>`
- Show video cards (thumb, title) and an “Analyze” action per video.
- Empty / loading / error states.

2) ~~Protect authenticated routes~~ (completed)
- Update `src/middleware.ts` matcher to include `/playlists/:path*` in addition to `/dashboard/:path*`.

3) ~~Align analysis API surface (minimal)~~ (completed)
- Keep existing `POST /api/analysis` (temp) but add:
  - `POST /api/analysis/video` → accepts `{ videoId: string }`, returns `{ analysis: string }` using current logic.
- Refactor the dashboard/client to call the new endpoint as we add the playlist detail page.

4) ~~Input validation~~ (completed)
- Add Zod schemas for all new/modified API routes.

Acceptance criteria
- Visiting `/playlists/<playlistId>` lists videos from that playlist using the API.
- Clicking Analyze on a video returns an analysis and renders it inline.
- Protected pages redirect to sign-in when unauthenticated.
- All mutated routes validate input and return meaningful errors.

## Priority 1 — Analysis Pipeline MVP (2–4 days)

Goal: Non-blocking analysis with basic progress reporting and caching.

1) ~~Endpoints~~ (completed)
- `POST /api/analysis/playlist` → accepts `{ playlistId }`, enqueues all videos.
- `GET /api/analysis/status/[jobId]` → returns `{ status: 'queued'|'running'|'done'|'error', progress, results? }`.

2) ~~In-memory job runner~~ (completed)
- Simple queue + job map (no external DB); stores per-video results.
- 24h in-memory cache for video analyses by `videoId`.

3) ~~Client wiring~~ (completed)
- On playlist page, add “Analyze Playlist” which triggers playlist analysis job and polls status.
- For per-video analyze, poll a short-lived per-video job id or return immediately if cached.

4) ~~Rate limiting~~ (completed)
- Add lightweight rate limiting on analysis endpoints to prevent abuse.

Acceptance criteria
- Kicking off a playlist job returns a jobId and polling shows progress to completion.
- Re-analyzing a recently processed video returns cached results.
- Rate limits respond with 429 and backoff hints.

## Priority 2 — YouTube Pagination & Robustness (1–2 days)

1) ~~Server: fetch all pages~~ (completed)
- Implement `nextPageToken` loops in `getPlaylists` and `getVideosForPlaylist`.
- Consider server-side aggregation vs. incremental client fetch.

2) Client: large lists UX
- Incremental load (Load more) or virtualized list to handle large result sets.

3) Error handling
- Surface quota/rate errors distinctly in UI with retry guidance. (Partial: rate-limit handled with toast; quota TBD.)

Acceptance criteria
- Users with large playlists see complete results or can load progressively.
- Quota errors display clear messages; requests avoid unbounded loops.

## Priority 2 — Types & Hooks (1 day)

1) ~~Types~~ (completed)
- Create `src/types/` and define `Playlist`, `Video`, `Analysis` types.

2) Hooks
- `src/hooks/useYouTubePlaylists.ts` — wraps React Query for playlists.
- `src/hooks/usePlaylistVideos.ts` — wraps React Query for videos.
- `src/hooks/useAnalyzeVideo.ts` — mutation for analysis.

3) Refactor
- Update dashboard/playlist pages to use hooks and shared types.

Acceptance criteria
- Components import types from `src/types` and use hooks for data access.

## Priority 3 — Testing & Quality (1–2 days)

1) Unit tests
- `src/lib/youtube.ts` and analysis helpers (when factored out).

2) Integration tests
- API route handlers for playlists, videos, and analysis endpoints.

3) CI basics
- GitHub Actions: lint, type-check, test on PR.

Acceptance criteria
- Tests run green locally (`bun run test`) and in CI.
- Lint/type-check are enforced pre-PR.

## Priority 3 — Deployment Prep (0.5–1 day)

1) Vercel
- Create project, configure env vars, add preview and prod environments.

2) Documentation
- README: env var table, minimal deploy instructions.

Acceptance criteria
- Deploy from `main` to Vercel with correct env.
- Docs cover local dev and deploy basics.

## Optional Enhancements (Phase 3+)

- Bulk analysis UX improvements (select subsets, progress per-video).
- Search/filter by title, date, channel, analyzed status.
- Export to PDF/CSV of analysis results.
- UI polish (dark mode toggle in header, ~~skeleton loaders~~, ~~toasts~~, Markdown rendering for analysis).

## Decisions / Open Questions

- Token refresh strategy for YouTube (reliance on NextAuth vs. explicit refresh flow).
- Persistence layer for results (stick with in-memory now; later add Postgres/Upstash?).
- Finalize analysis API naming; keep `/api/analysis` as legacy alias or remove after migration.

## Task Checklist (initial)

- [x] Add `/playlists/[id]` page and video list
- [x] Expand middleware protection to `/playlists/:path*`
- [x] Add `POST /api/analysis/video` (refactor existing logic)
- [x] Zod validation on analysis and YouTube routes
- [x] Basic error/loading components
- [x] Consistent API error/success helpers
- [x] Playlist analysis job + status endpoints
- [x] In-memory queue + 24h result cache
- [x] Rate limiting for analysis routes
- [x] YouTube pagination for playlists and videos
- [x] Markdown rendering of analysis results
- [x] Types in `src/types/`
- [ ] Hooks in `src/hooks/`
- [ ] Unit/integration tests and CI workflow
- [ ] Vercel deployment and README updates

## How To Verify (quick)

Dev
- `bun install`
- `bun run dev` and sign in with Google
- Navigate: `/dashboard` → click a playlist → `/playlists/<id>`
- Run a single-video analysis and read result

Tests
- `bun run lint` `bun run type-check` `bun run test`

Deploy
- Set env vars in Vercel and push to `main` to trigger build
