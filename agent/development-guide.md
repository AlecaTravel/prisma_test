# Aleca Travel — Developer Workflow (DX)

This is the practical guide for making, testing, and reviewing changes in this
repository. For the current security progress and architectural decisions, start
with [PROJECT-STATE.md](./PROJECT-STATE.md).

## 1. Quick commands

Run these from the repository root:

```bash
# Start the Next.js development server
npm run dev

# Type-check all TypeScript without emitting files
npx tsc --noEmit

# Run all Vitest tests
npm test

# Run one test file
npm test -- tests/booking-auth.test.ts

# Export the Pothos schema, then regenerate client types and persisted operations
npm run graphql:sync

# Regenerate client types and persisted operations only
npm run graphql:codegen

# Check the production Apollo -> Yoga persisted-operation flow
npm run security:verify-persisted

# Verify per-IP and per-user GraphQL rate limits using configured Upstash Redis
npm run security:verify-rate-limit

# Build the production Next.js app
npm run build
```

There is currently no lint script in `package.json`. Do not assume linting ran
as part of the commands above.

## 2. How the type and schema pipelines fit together

There are three sources of truth and two generated outputs:

1. **Database models:** edit `prisma/schema.prisma`.
2. **GraphQL API:** edit Pothos definitions in `server/builder.ts` and
   `server/modules/*.ts`. The public API is the schema produced by Pothos, not
   `schema.graphql` by itself.
3. **Client operations:** write named GraphQL operations with the generated
   `graphql` helper imported from `gql`.
4. **Prisma/Pothos generated types:** `prisma/generated/` and
   `lib/pothos-prisma-types.ts`.
5. **GraphQL client generated artifacts:** `schema.graphql` and `gql/`,
   including `gql/persisted-documents.json`.

Never hand-edit generated files in `prisma/generated/` or `gql/`. Change their
source and rerun the corresponding generator.

## 3. Add a client query or mutation

Write a named operation in a file matched by `codegen.ts` (currently
`features/**/*.{ts,tsx}`, `pages/**/*.{ts,tsx}`, or `components/**/*.{ts,tsx}`):

```tsx
import { graphql } from '../gql';

const HOTEL_BY_SLUG = graphql(`
  query HotelBySlug($slug: String!) {
    hotelBySlug(slug: $slug) {
      id
      title
    }
  }
`);
```

Then:

1. Import and use the generated document with Apollo `useQuery` or `useMutation`.
   Let the generated document infer the result and variable types.
2. Run `npm run graphql:codegen`. This validates the operation against
   `schema.graphql`, regenerates TypeScript operation types, embeds the
   persisted hash in the document, and updates `gql/persisted-documents.json`.
3. Run `npx tsc --noEmit` and the relevant test(s).
4. Review the diff in both `gql/graphql.ts` and
   `gql/persisted-documents.json`; both generated changes are needed for the
   production client.

Use operation names and variables. Do not construct GraphQL strings from
user-controlled values, and do not manually pass a raw query string to Apollo.
The production API accepts only operations in the generated manifest.

If Codegen reports an unknown field, missing required argument, invalid
variable, or scalar mismatch, first check the exported API schema and fix the
operation or Pothos definition. Do not work around the error with `any`.

### Persisted-operation rollout rule

The browser Apollo client obtains the hash from each generated document and
sends it using `extensions.persistedQuery`. Production does not retry by sending
the whole operation text. Therefore:

- Generate and deploy the manifest together with the application code.
- A production client operation missing from the deployed manifest will fail
  rather than silently falling back to arbitrary query text.
- Keep the generated operation document and manifest entry in the same release.

## 7. Temporarily hiding the catalog UI

The public landing page displays fixed package cards whose images are in
`public/`; it does not render database-backed destination or hotel results. The
existing Prisma/Pothos catalog, search components, filters, and booking
implementation are retained in the codebase.

`/search` shows a Spanish coming-soon page unless
`NEXT_PUBLIC_CATALOG_ENABLED=true` is set when building the app. Keep it unset
for the presentation-only catalog; set it to `true` and redeploy when the
catalog is ready for public use. This flag hides the UI only: it is not API
authorization, and it does not remove or secure the public GraphQL operations.

The landing page's package filters are client-side and operate only on the
fixed package list. Use keyboard-operable buttons, visible focus states, and
respect reduced-motion preferences when extending these interactions.

## 8. Production GraphQL rate limiting

The production Yoga endpoint uses `rate-limiter-flexible` with Upstash Redis
over TCP/TLS (`REDIS_URL`, or `VALKEY_URL` for Valkey). Do not use Upstash REST
credentials with the `ioredis` client. Add the TCP/TLS URL as a secret in each
Vercel environment; never put the URL or token in source, screenshots, logs, or
the repository. The public user/IP identifiers are SHA-256 hashed for Redis
keys.

Initial budgets are 300 GraphQL requests/minute/IP and 120/minute/user. The
Redis bucket is shared by serverless instances. The API fails closed with 503
if it cannot establish a trusted client IP or reach Redis; 429 responses
include `Retry-After`. Batching is disabled and the request body limit is 1 MB.
Before changing the limits, measure per-user/IP request volume and 429 rates in
production. Vercel forwarded IPs are validated; do not replace them with a
client-controlled header such as arbitrary `X-Real-IP`.

Validate Upstash connectivity and enforcement from the same environment:

```bash
npm run providers:redis-check
npm run security:verify-rate-limit
```

The second command uses random, temporary namespaced keys and deletes them
afterward. Also run the production build and test deployment with the
environment-specific Upstash secret configured.

## 9. Change the GraphQL API schema

### Pothos-only change

For a new field, query, mutation, or GraphQL type:

1. Implement it in the appropriate `server/modules/*.ts` file and register a
   newly created module in `server/schema.ts`.
2. Add authorization in the resolver using `requireRole` or another explicit
   ownership check where the data is private.
3. Validate input, bound list sizes and expensive filters, and add tests for
   allowed and denied access.
4. Run `npm run graphql:sync`. This exports the assembled Pothos schema to
   `schema.graphql`, then regenerates operation types and the persisted manifest.
5. Add/update client operations and tests, then run type-check, tests, and build.

`npm run graphql:export` updates only the exported schema. `npm run
graphql:codegen` does not rebuild the schema from Pothos; it consumes the
existing `schema.graphql`. Use `graphql:sync` after Pothos changes to avoid
generating client types against a stale schema.

### Prisma model or database change

For a change to a database model, field, relation, or enum:

1. Edit `prisma/schema.prisma`.
2. Create and apply a migration in development:

   ```bash
   npx prisma migrate dev --name describe_the_change
   ```

3. Check in the generated migration. Prisma also regenerates
   `prisma/generated/` and `lib/pothos-prisma-types.ts`; do not hand-edit those
   outputs.
4. Expose only the intended fields through Pothos. A database column is not
   automatically a public GraphQL field.
5. Add or update tests, and run `npm run graphql:sync`, type-check, and build.

Use `npx prisma generate` when generated Prisma types are stale but the data
model has not changed. Avoid `db push` for shared or production schema changes;
use reviewed migrations so environments can be updated reproducibly. Prisma
reads `DATABASE_URL` through `prisma.config.ts`.

## 10. Test changes

Tests live under `tests/` and run with Vitest:

```bash
npm test -- tests/graphql-security.test.ts
npm test -- tests/booking-auth.test.ts
```

Use the smallest relevant test during development, then run broader tests when
the change spans modules. GraphQL integration tests commonly build Yoga with
the real Pothos schema and inject a test context/Prisma client. Database tests
need a configured test `DATABASE_URL`; test setup is in `tests/helpers/`.

For the persisted-operation path, this repository also has a standalone
verification that does not start Vitest:

```bash
npm run security:verify-persisted
```

It sends a generated Apollo document through `PersistedQueryLink` to an
in-process production-configured Yoga server, verifies that only its hash is
sent, confirms Yoga executes the manifest entry, and confirms arbitrary query
text is rejected.

### Current Vitest environment issue

In the current development environment, Vitest exits with an illegal-instruction
signal (`SIGILL`, exit code 132) before it prints a test result. Changing the
reporter or pool did not resolve it. This is a runner/runtime/native-binary
failure, not a reported test assertion failure. Continue to run TypeScript,
Codegen, the standalone persisted-operation verification, and the production
build; also rerun Vitest in a compatible Node/runtime environment. Do not report
the suite as passing until Vitest actually prints successful results.

## 11. Diagnose common mistakes

| Symptom | First check |
|---|---|
| `graphql()` does not recognize an operation | Run `npm run graphql:codegen`; confirm the source file matches `documents` in `codegen.ts`. |
| A GraphQL field/argument is unknown | Run `npm run graphql:sync` after the Pothos change; inspect `schema.graphql`. |
| A Prisma type is missing after a model edit | Run `npx prisma generate` (or complete the migration workflow). |
| Production reports `PersistedQueryNotFound` | The operation and generated manifest may be out of sync; regenerate and deploy them together. |
| Apollo operation lacks a persisted hash | The document was not generated by Codegen or was constructed manually; use the generated `graphql()` helper. |
| `tsc` reports nullable data or missing variables | Use the generated operation types and handle GraphQL nullability explicitly; avoid casts. |
| Vitest exits with SIGILL before tests start | Treat it as a runner/runtime failure; use the standalone verifier and type/build checks while investigating the environment. |

## 12. Before submitting a change

```bash
npm run graphql:sync       # if Pothos schema or client operations changed
npx tsc --noEmit
npm test -- tests/relevant.test.ts
npm run security:verify-persisted
npm run build
git diff --check
git status --short
git diff
```

For changes unrelated to GraphQL operations, skip schema/codegen steps that
aren't relevant. Never claim a test passed if its runner crashed or did not
execute it.
