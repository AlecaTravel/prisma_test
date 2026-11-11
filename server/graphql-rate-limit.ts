import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import Redis from 'ioredis';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Plugin } from 'graphql-yoga';
import { getRequestSession } from './request-session';
import { sessionUserFromSession } from './session-user';

export const GRAPHQL_RATE_LIMITS = {
  ip: { points: 300, duration: 60, blockDuration: 60 },
  user: { points: 120, duration: 60, blockDuration: 60 },
};

interface RateLimitOptions {
  points: number;
  duration: number;
  blockDuration: number;
}

interface GraphQLRateLimitOptions {
  ip: RateLimitOptions;
  user: RateLimitOptions;
}

export interface GraphQLRateLimitIdentity {
  ip: string;
  userId?: string;
}

export interface GraphQLRateLimiters {
  ip: RateLimiterRedis;
  user: RateLimiterRedis;
}

type GraphQLApiContext = {
  req: NextApiRequest;
  res: NextApiResponse;
};

let redisClient: Redis | undefined;
let rateLimiters: GraphQLRateLimiters | undefined;

function getRedisUrl(): string {
  const redisUrl = process.env.REDIS_URL?.trim() || process.env.VALKEY_URL?.trim();
  if (!redisUrl) {
    throw new Error('GraphQL rate limiting requires REDIS_URL or VALKEY_URL');
  }
  return redisUrl;
}

function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  const client = new Redis(getRedisUrl(), {
    connectTimeout: 2_500,
    commandTimeout: 2_500,
    maxRetriesPerRequest: 1,
    retryStrategy: (attempt) => (attempt <= 2 ? attempt * 100 : null),
    enableReadyCheck: true,
  });
  client.on('error', () => {
    console.error('[graphql:rate-limit] Redis connection failed');
  });
  redisClient = client;
  return client;
}

export function createGraphQLRateLimiters(
  client: Redis,
  limits: GraphQLRateLimitOptions = GRAPHQL_RATE_LIMITS,
  keyPrefix = 'graphql',
): GraphQLRateLimiters {
  return {
    ip: new RateLimiterRedis({
      storeClient: client,
      keyPrefix: `${keyPrefix}:ip:v1`,
      ...limits.ip,
    }),
    user: new RateLimiterRedis({
      storeClient: client,
      keyPrefix: `${keyPrefix}:user:v1`,
      ...limits.user,
    }),
  };
}

function getRateLimiters(): GraphQLRateLimiters {
  if (!rateLimiters || redisClient?.status === 'end') {
    rateLimiters = createGraphQLRateLimiters(getRedisClient());
  }
  return rateLimiters;
}

export function hashRateLimitIdentity(identity: string): string {
  return createHash('sha256').update(identity).digest('hex');
}

export async function consumeGraphQLIpRateLimit(
  ip: string,
  limiters = getRateLimiters(),
): Promise<void> {
  await limiters.ip.consume(hashRateLimitIdentity(ip));
}

export async function consumeGraphQLUserRateLimit(
  userId: string,
  limiters = getRateLimiters(),
): Promise<void> {
  await limiters.user.consume(hashRateLimitIdentity(userId));
}

export async function consumeGraphQLRateLimit(
  identity: GraphQLRateLimitIdentity,
  limiters = getRateLimiters(),
): Promise<void> {
  await consumeGraphQLIpRateLimit(identity.ip, limiters);
  if (identity.userId) {
    await consumeGraphQLUserRateLimit(identity.userId, limiters);
  }
}

export function getTrustedClientIp(req: NextApiRequest): string | null {
  const forwardedIp =
    process.env.VERCEL === '1'
      ? req.headers['x-vercel-forwarded-for'] ?? req.headers['x-forwarded-for']
      : req.socket.remoteAddress;
  if (typeof forwardedIp !== 'string') return null;

  const ip = forwardedIp.trim();
  return ip && !ip.includes(',') && isIP(ip) ? ip : null;
}

function jsonResponse(status: number, message: string, code: string, retryAfter?: number) {
  const headers = new Headers({
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  });
  if (retryAfter !== undefined) headers.set('retry-after', String(retryAfter));

  return new Response(
    JSON.stringify({
      errors: [{ message, extensions: { code } }],
    }),
    { status, headers },
  );
}

export function createGraphQLRateLimitPlugin(): Plugin<{}, GraphQLApiContext> {
  return {
    onRequestParse: async ({ serverContext, endResponse }) => {
      const { req, res } = serverContext;
      const ip = getTrustedClientIp(req);
      if (!ip) {
        endResponse(
          jsonResponse(
            503,
            'GraphQL service is temporarily unavailable.',
            'RATE_LIMIT_UNAVAILABLE',
          ),
        );
        return;
      }

      try {
        await consumeGraphQLIpRateLimit(ip);
      } catch (error) {
        if (error instanceof RateLimiterRes) {
          endResponse(
            jsonResponse(
              429,
              'Too many requests. Please retry later.',
              'TOO_MANY_REQUESTS',
              Math.max(1, Math.ceil(error.msBeforeNext / 1_000)),
            ),
          );
          return;
        }

        console.error(
          '[graphql:rate-limit] Redis limiter unavailable',
          error instanceof Error ? error.name : 'UnknownError',
        );
        endResponse(
          jsonResponse(
            503,
            'GraphQL service is temporarily unavailable.',
            'RATE_LIMIT_UNAVAILABLE',
          ),
        );
        return;
      }

      let userId: string | undefined;
      try {
        const session = await getRequestSession(req, res);
        userId = sessionUserFromSession(session)?.id;
      } catch {
        console.error('[graphql:rate-limit] Could not resolve request identity');
        endResponse(
          jsonResponse(
            503,
            'GraphQL service is temporarily unavailable.',
            'RATE_LIMIT_UNAVAILABLE',
          ),
        );
        return;
      }

      try {
        if (userId) await consumeGraphQLUserRateLimit(userId);
      } catch (error) {
        if (error instanceof RateLimiterRes) {
          endResponse(
            jsonResponse(
              429,
              'Too many requests. Please retry later.',
              'TOO_MANY_REQUESTS',
              Math.max(1, Math.ceil(error.msBeforeNext / 1_000)),
            ),
          );
          return;
        }

        console.error(
          '[graphql:rate-limit] Redis limiter unavailable',
          error instanceof Error ? error.name : 'UnknownError',
        );
        endResponse(
          jsonResponse(
            503,
            'GraphQL service is temporarily unavailable.',
            'RATE_LIMIT_UNAVAILABLE',
          ),
        );
      }
    },
  };
}
