# Security Roadmap (own API first, integrations later)

## Phase 1 — Immediate hardening (today, low effort, high impact)
- [x] Disable GraphiQL in production in `createYoga`
- [x] `useDisableIntrospection()` gated on `NODE_ENV === "production"`
- [x] `blockFieldSuggestionsPlugin()` from `@escape.tech/graphql-armor-block-field-suggestions`

## Phase 2 — Persisted Operations (this week, structural)
- [x] Yoga persisted-operation plugin with arbitrary operations rejected in production
- [x] graphql-codegen client preset with `persistedDocuments: true`
- [x] Apollo sends hashes via APQ format (`extensions.persistedQuery.sha256Hash`)
- [x] Verify the Apollo client -> generated manifest -> Yoga flow
- [x] Verify Next.js TypeScript and production compilation include the persisted manifest

> In Yoga 5, use `allowArbitraryOperations: false` (the default) rather than
> `onlyPersistedOperations: true`. See [PROJECT-STATE.md](./PROJECT-STATE.md).

## Phase 3 — Abuse prevention
- [x] `@escape.tech/graphql-armor`:
      maxDepth 6, costLimit 1000, maxAliases 15, maxTokens 1000 (baseline, tune later)
- [x] Verify depth and alias rejection through the production Yoga plugin setup
- [x] `rate-limiter-flexible` with shared Upstash Redis limits by trusted client IP
      and authenticated user; API-key bucket is deferred because API keys do not
      exist in this project.
- [x] Fail closed: return 503 when client identity or Upstash limiter is
      unavailable; return 429 with `Retry-After` when a bucket is exceeded.
- [x] Disable GraphQL HTTP batching and cap request bodies at 1 MB.

The initial limits are 300 requests/minute per IP and 120 requests/minute per
authenticated user. They are conservative launch baselines, not traffic-derived
limits; review them against production request volume and 429 rates before
tightening. Vercel's `x-vercel-forwarded-for` (fallback `x-forwarded-for`) is
validated as a single IP; local Node uses the socket peer. Vercel documents
`x-forwarded-for` as overwritten to prevent IP spoofing:
[Request headers](https://vercel.com/docs/headers/request-headers). Do not use
arbitrary forwarded headers. The limiter hashes identifiers before storing Redis keys.
Use Upstash TCP/TLS `REDIS_URL`, not REST credentials; see
[`docs/FASE_B2.md`](../docs/FASE_B2.md).

Verify the shared limiter against the configured Redis instance with
`npm run security:verify-rate-limit`. This uses random, namespaced keys and
removes them afterward.

## Phase 4 — Auth & authorization
- [x] Auth.js / next-auth with Prisma identity and role in the GraphQL context
- [ ] Complete role and object-level authorization; review booking/quote ownership
      (BOLA is OWASP API #1). No Auth0 migration is required for this work.

## Phase 5 — Observability
- [ ] `@graphql-yoga/plugin-prometheus` with
      `graphql_yoga_http_duration` + `labelNames: ['operationName']`
- [ ] Compare operation latencies before optimizing anything
- Do NOT enable resolver-level tracing in production

## Phase 6 — Performance (only after Phase 5 data)
- [ ] DataLoader for relations
- [ ] `@praha/envelop-request-cache` for per-request user/loader caching
- [ ] Yoga Response Cache for low-churn catalog queries
- [ ] Redis cache for hot paths

## Phase 7 — Future third-party API readiness (design now, implement later)
Goal: when an external provider is certified and connected, the integration
lands safely without re-architecting.

Prepare these capabilities in advance:
- [ ] **Server-side only calls**: every external request originates from a Yoga resolver
      (Node.js runtime, never Edge). No API keys or tokens ever shipped to clients.
- [ ] **Secret management**: all provider credentials live in Vercel env vars
      (scoped per environment), never in code or client bundles.
- [ ] **Outbound IP strategy**: document the decision (QuotaGuard vs Vercel Static IPs)
      so it can be applied per provider on demand.
- [ ] **Timeouts and retries**: a shared HTTP client wrapper with timeouts,
      exponential backoff with jitter, and idempotency keys for unsafe operations.
- [ ] **Circuit breaker**: prevent a failing provider from cascading into Yoga latency.
      Use a small library or a Redis-backed counter.
- [ ] **Per-provider rate limiter**: separate buckets so one provider cannot exhaust
      shared capacity (rate-limiter-flexible supports named limiters).
- [ ] **Webhook verification**: signature validation (HMAC) and replay protection
      (timestamp + nonce) for any inbound provider callbacks.
- [ ] **Outbox pattern** (BullMQ already available): durable events for booking state
      changes and conversion tracking, decoupling provider reliability from request path.
- [ ] **Audit log**: structured log of every external call and state transition
      (who, what, when, outcome) for compliance and debugging.
- [ ] **Error taxonomy**: distinguish "provider down", "provider rejected", "our bug"
      in GraphQL error extensions so clients react correctly.
- [ ] **Test doubles**: mock server / recorded fixtures per provider so CI never
      hits real endpoints.