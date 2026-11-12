# Aleca Travel — Project and Security State

Last updated: 2026-11-12

This is the authoritative current-state note for the repository. Read it before
continuing security work. The roadmap checklist remains in
[security-roadmap.md](./security-roadmap.md); architecture background remains in
[project-context.md](./project-context.md).

## Project architecture

- Next.js 16 Pages Router, deployed on Vercel using Node.js.
- `/api/graphql` is the single GraphQL BFF for web and future native clients.
- GraphQL Yoga 5.24.6 with Pothos 4 and Prisma 7/PostgreSQL.
- Apollo Client 4; GraphQL Code Generator client preset.
- Auth.js / `next-auth` v5 beta, Prisma adapter, Credentials and Nodemailer
  providers; optional Google OAuth is implemented but requires per-environment
  credentials. Auth0 is not configured.
- Redis (`ioredis`), `rate-limiter-flexible`, and BullMQ are available in the
  project. Redis environment variable names already used by provider services:
  `REDIS_URL` or `VALKEY_URL`.
- No live third-party travel provider integration is active.

## Current working-tree implementation

These are uncommitted development changes:

- Phase 1 production protections are wired in `pages/api/graphql.ts` via
  `server/graphql-security.ts`: GraphiQL stays disabled in production;
  introspection and field suggestions are blocked in production.
- Yoga 5-compatible dependencies are pinned: `@graphql-yoga/plugin-disable-introspection`
  2.24.0, `@escape.tech/graphql-armor-block-field-suggestions` 2.2.0,
  `@graphql-yoga/plugin-persisted-operations` 3.24.6, and
  `@escape.tech/graphql-armor` 3.2.0.
- Codegen has `persistedDocuments` enabled with unprefixed SHA-256 hashes. The
  generated `gql/persisted-documents.json` currently contains 21 operations;
  generated client documents include their hashes.
- Yoga’s persisted-operation plugin loads that manifest, rejects arbitrary
  query text in production, and permits arbitrary text outside production.
- Production GraphQL requests use GraphQL Armor limits: depth 6, cost 1000,
  aliases 15, and tokens 1000.
- Production GraphQL requests also use shared `rate-limiter-flexible` Redis
  buckets: 300 requests/minute per IP and 120/minute per authenticated user.
  Vercel client identity comes from a validated Vercel forwarded-IP header;
  Redis/identity failures fail closed with 503, and excess traffic gets 429.
  Request batching is disabled and the HTTP body cap is 1 MB.
- Google OAuth sign-in is conditionally available when both Google credentials
  are set. No credential values are committed, and automatic email account
  linking is not enabled.
- Mobile admin reservation, hotel, and dashboard tables use labeled card rows
  below 640px; desktop table presentation remains unchanged.
- Combo flyer administration is implemented at `/admin/combos`: ADMIN/AGENT
  can upload public flyers to Vercel Blob, create draft/published packages, and
  archive or republish them. Published offers are appended to the existing
  homepage mock cards. The Prisma migration is authored but has not been
  applied; Blob and Google environment setup and deployment verification are
  still required. Editing package metadata and deleting blobs are not included.
- The public landing page shows the fixed package cards rather than
  Prisma-backed destinations or hotel results. The original search and listing
  implementation remains in `pages/search.tsx`, gated by
  `NEXT_PUBLIC_CATALOG_ENABLED` (default/off unless set to `true` at build time).
  Direct database-backed landing-page fetching has been removed; the home page
  now renders without the catalog query.
- The browser Apollo client sends hashes using `PersistedQueryLink`. It permits
  full-query retry for a missing hash only outside production. The fixed-package
  landing page no longer performs a database query or uses an HTTP GraphQL call.
- `tests/graphql-security.test.ts` covers production introspection blocking,
  suggestion masking, persisted-operation behavior, and Armor depth/alias
  rejection.
- `scripts/verify-persisted-operations.ts` provides a Vitest-independent
  end-to-end check, run with `npm run security:verify-persisted`.
- Landing package images use local `public/` assets and Next.js’s normal image
  optimizer. The old Picsum optimizer workaround remains reverted.

## Verification state

- `npx tsc --noEmit`: passed after the Google OAuth and promo package changes.
- `npx prisma validate`: passed with the new `PromoPackage` model.
- `npm run graphql:sync`: passed; exported schema and generated 21 persisted operations.
- `npm run security:verify-persisted`: passed. Apollo 4 sent only the generated
  SHA-256 hash, Yoga found and executed that operation from the generated
  manifest, production Yoga rejected a raw arbitrary operation, and Armor
  rejected test operations exceeding depth and alias limits. All 21 generated
  operations also fit the configured depth, alias, and token limits (maximum
  observed depth 5 and 0 aliases).
- `npm run security:verify-rate-limit`: passed against configured Redis.
- `npm run build`: passed, including `/admin/combos` and its upload API route.
- Local server smoke checks: `/` returned 200; unauthenticated
  `/admin/combos` redirected to login (307).
- Vitest focused runs for promo-package access and safe callback tests could
  not execute: the runner terminates with illegal instruction (`SIGILL`, exit
  132) before reporting test results, including with a single-process pool.
- Direct runtime assertions for `safeCallbackUrl` passed.
- `git diff --check` reports trailing whitespace in Prisma-generated output
  (`prisma/generated/*`); these generated files were not hand-edited.
- Dependency installation reported 8 audit findings (3 moderate, 5 high) and
  existing Node engine warnings for the current Node 22.20.0 versus some
  installed packages. These findings have not yet been triaged; do not run
  `npm audit fix --force` as part of this work.

## Security roadmap progress

### Phase 1 — Production endpoint hardening

Implemented. The endpoint already had production-only GraphiQL disabling and
masked errors; plugins now also disable introspection and field suggestions in
production. Direct runtime checks passed. Vitest verification remains blocked by
the runner crash.

### Phase 2 — Persisted operations

Implemented and verified end to end in the working tree. Codegen hashes and
Apollo’s APQ hash format are verified to match. Yoga’s
`allowArbitraryOperations: false` is the production safelist enforcement; the
Yoga plugin does not use a `onlyPersistedOperations` option. Apollo does not
retry by sending full query text in production. The manifest is imported by the
Yoga security module and generated as part of Codegen; deployments must include
the generated manifest.

### Phase 3 — Abuse prevention

Implemented in the working tree. In addition to Armor, production API requests
are rate-limited through shared Upstash Redis by IP and, when authenticated, by
user. The initial limits are 300/IP/minute and 120/user/minute. The limiter
returns 429 with `Retry-After`; missing/invalid identity or Redis failures
return 503 (fail closed). It does not use a process-local fallback. Vercel
forwarded IP headers are validated as a single IP; local development uses the
socket peer. GraphQL batching is disabled and request bodies are capped at 1 MB.

`npm run security:verify-rate-limit` checks excess-request rejection against
Redis. These thresholds have not been tuned from production traffic; observe
real request volume and 429 rates before changing them. API-key limits are
deferred because the application does not issue API keys.

### Phase 4 — Authentication and authorization

Auth.js authenticates with Credentials and Nodemailer and optionally Google
when configured; it uses the Prisma adapter with JWT sessions. Its session
callback carries the database user ID and role into GraphQL context. The Prisma user role is
`CUSTOMER | AGENT | ADMIN`; existing resolver-level role checks protect admin
operations, and `myBookings` filters by the authenticated context user.

Auth.js provides authentication/session handling; the Pothos resolver guards
and ownership filters provide authorization. Auth0 is not configured. Google
OAuth needs per-environment client credentials and callback URLs before it can
be exercised in Preview/Production.

Do not mark authorization complete yet. Review `createBooking` and its provider
path for object-level ownership: it looks up bookings by the caller-supplied
idempotency key and quotes by ID without an ownership check in the resolver.
The anonymous quote flow also needs a deliberate guest-ownership policy. Add
cross-user regression tests before changing behavior so guest checkout and
idempotent retries remain valid.

### Phases 5–7

Not implemented. Prometheus, query-latency measurement, metrics-driven caching,
and future-provider readiness are still roadmap work. Keep provider credentials
server-side and future external requests on the Vercel Node.js runtime.

## Manual review / resume

To inspect this work manually:

1. `git status --short` — lists all pending files.
2. `git diff` — review the source and dependency changes.
3. `gql/persisted-documents.json` — review the generated operation safelist.
4. `server/graphql-security.ts` and `pages/api/graphql.ts` — review Yoga
   production enforcement.
5. `lib/apollo-client.ts` and `codegen.ts` — review client/server hash agreement.
6. `tests/graphql-security.test.ts` — review security behavior assertions.
7. `agent/security-roadmap.md` — see checklist progress.
8. `agent/development-guide.md` — test, type, schema, and persisted-operation workflow.

No changes are committed. Before deploying, set the Upstash TCP/TLS `REDIS_URL`
in each Vercel environment and run the Redis verification against staging. Keep
`NEXT_PUBLIC_CATALOG_ENABLED` unset until the catalog is ready to reappear.
Phase 4 still needs booking/quote ownership regression tests, and dependency
audit findings remain untriaged. These are separate from Phase 3.
