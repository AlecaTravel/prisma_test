# Project Context: Aleca Travel

For the current implementation and security progress, read
[PROJECT-STATE.md](./PROJECT-STATE.md). This file records the durable
architecture constraints.

## Stack

- Next.js 16 Pages Router on Vercel Node.js.
- `/api/graphql` is the GraphQL BFF for the web app and future native clients.
- GraphQL Yoga 5, Pothos 4, Prisma 7/PostgreSQL.
- Apollo Client 4 and GraphQL Code Generator.
- Auth.js / next-auth v5 beta with Prisma adapter and JWT sessions. Credentials
  and Nodemailer are enabled; Google OAuth is conditional on
  `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`. Auth0 is not configured.
- Redis via `ioredis` and `rate-limiter-flexible`; Upstash TCP/TLS is used for
  shared provider services and production GraphQL rate limiting.
- No live third-party travel API integration is active.

## Architecture decisions

- Keep one Yoga BFF and the Pothos schema; do not add a separate API per client.
- Browser clients use generated persisted-operation hashes. Production rejects
  arbitrary GraphQL query text.
- Future provider requests originate server-side in the Node.js runtime; never
  ship provider credentials to the browser or a native app.
- Vercel client identity must use validated platform-forwarded IP information,
  not arbitrary client-supplied forwarding headers.
- The public landing page currently presents local package images and fixed
  package information. Database-backed catalog/search UI is temporarily gated,
  not deleted; enable it only after inventory data and API readiness are
  confirmed.
- Promotional packages use the `PromoPackage` model. The six current offers
  have been imported as published records in the configured production
  database, with their existing local flyers. The reviewed migration and
  idempotent `npm run packages:seed` command are in source control; apply both
  in other environments before using package management there. Local public
  images do not require a storage service. New flyer uploads target the
  connected private Vercel Blob store; `BLOB_READ_WRITE_TOKEN` is required for
  client-upload token generation. Published Blob flyers are served through a
  same-origin API route, while drafts require an ADMIN/AGENT session.
  Package administration is available at `/admin/paquetes` to ADMIN/AGENT.
- Role checks and object ownership must be enforced in resolvers. Auth.js
  authenticates sessions; it does not replace authorization.

## Security roadmap

1. Production introspection/suggestions protections.
2. Persisted operations only in production.
3. GraphQL Armor limits and shared Redis rate limiting.
4. Auth.js session hardening and complete object-level authorization.
5. Operation-level observability.
6. Performance improvements based on measured traffic.
7. Safe future provider abstractions.
