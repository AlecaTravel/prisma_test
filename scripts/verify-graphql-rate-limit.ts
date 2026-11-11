import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import { RateLimiterRes } from 'rate-limiter-flexible';
import {
  consumeGraphQLRateLimit,
  createGraphQLRateLimiters,
  hashRateLimitIdentity,
  type GraphQLRateLimitIdentity,
} from '../server/graphql-rate-limit';

async function main() {
  const redisUrl = process.env.REDIS_URL?.trim() || process.env.VALKEY_URL?.trim();
  if (!redisUrl) {
    throw new Error('Set REDIS_URL or VALKEY_URL to verify GraphQL rate limits against Redis');
  }

  const redis = new Redis(redisUrl, {
    connectTimeout: 5_000,
    commandTimeout: 10_000,
    maxRetriesPerRequest: 1,
    retryStrategy: (attempt) => (attempt <= 2 ? attempt * 100 : null),
  });
  redis.on('error', (error) => {
    console.error(
      '[graphql:rate-limit:verify] Redis connection failed',
      error.name,
    );
  });
  const namespace = `graphql:verification:${randomUUID()}`;
  const identity: GraphQLRateLimitIdentity = {
    ip: '203.0.113.10',
    userId: `verification-${randomUUID()}`,
  };
  const limiters = createGraphQLRateLimiters(
    redis,
    {
      ip: { points: 2, duration: 60, blockDuration: 60 },
      user: { points: 1, duration: 60, blockDuration: 60 },
    },
    namespace,
  );

  try {
    await redis.ping();
    await consumeGraphQLRateLimit(identity, limiters);
    await assert.rejects(
      consumeGraphQLRateLimit(identity, limiters),
      (error: unknown) => error instanceof RateLimiterRes,
    );
    await assert.rejects(
      consumeGraphQLRateLimit(identity, limiters),
      (error: unknown) => error instanceof RateLimiterRes,
    );
    console.info('GraphQL rate-limit verification passed against Redis: user and IP limits reject excess requests.');
  } finally {
    await Promise.all([
      limiters.ip.delete(hashRateLimitIdentity(identity.ip)),
      limiters.user.delete(hashRateLimitIdentity(identity.userId ?? '')),
    ]);
    await redis.quit();
  }
}

main().catch((error: unknown) => {
  console.error('GraphQL rate-limit verification failed:', error);
  process.exitCode = 1;
});
