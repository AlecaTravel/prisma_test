import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { createSchema, createYoga } from 'graphql-yoga';
import { describe, expect, it } from 'vitest';
import { MeDocument } from '../gql/graphql';
import { getGraphQLSecurityPlugins } from '../server/graphql-security';
import {
  createPersistedQueryLink,
  getPersistedDocumentHash,
} from '../lib/persisted-query-link';

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      hello: String!
      me: User
    }

    type User {
      id: ID
      email: String
      name: String
      image: String
      role: String
    }
  `,
  resolvers: {
    Query: {
      hello: () => 'world',
      me: () => null,
    },
  },
});

const productionYoga = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  logging: false,
  maskedErrors: false,
  plugins: getGraphQLSecurityPlugins(true),
});

async function execute(body: Record<string, unknown>) {
  const response = await productionYoga.fetch('http://localhost/api/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.json() as Promise<{
    data?: unknown;
    errors?: Array<{ message: string }>;
  }>;
}

describe('production GraphQL security plugins', () => {
  it('rejects schema introspection', async () => {
    const result = await execute({ query: '{ __schema { queryType { name } } }' });

    expect(result.errors).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  it('hides field suggestions for invalid fields', async () => {
    const result = await execute({ query: '{ hellp }' });

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toContain('[Suggestion hidden]');
    expect(result.errors?.[0]?.message).not.toContain('hello');
  });

  it('executes an operation from the generated manifest by hash', async () => {
    const persisted = await execute({
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: getPersistedDocumentHash(MeDocument),
        },
      },
    });
    expect(persisted).toEqual({ data: { me: null } });
  });

  it('rejects arbitrary operation text in production', async () => {
    const arbitrary = await execute({ query: '{ hello }' });
    expect(arbitrary.errors?.[0]?.message).toBe('PersistedQueryOnly');
  });

  it('rejects unknown hashes without accepting an operation body', async () => {
    const result = await execute({
      extensions: {
        persistedQuery: { version: 1, sha256Hash: 'unknown-operation-hash' },
      },
    });
    expect(result.errors?.[0]?.message).toBe('PersistedQueryNotFound');
  });

  it('rejects persisted operations over production depth and alias limits', async () => {
    const limitedSchema = createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String!
          start: LevelOne!
        }

        type LevelOne {
          next: LevelTwo!
          value: String!
        }

        type LevelTwo {
          next: LevelThree!
          value: String!
        }

        type LevelThree {
          next: LevelFour!
          value: String!
        }

        type LevelFour {
          next: LevelFive!
          value: String!
        }

        type LevelFive {
          next: LevelSix!
          value: String!
        }

        type LevelSix {
          value: String!
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'world',
          start: () => ({}),
        },
        LevelOne: { next: () => ({}) },
        LevelTwo: { next: () => ({}) },
        LevelThree: { next: () => ({}) },
        LevelFour: { next: () => ({}) },
        LevelFive: { next: () => ({}) },
      },
    });
    const limitedQueries = {
      tooDeep:
        '{ start { next { next { next { next { next { next { value } } } } } } } }',
      tooManyAliases: `{ ${Array.from(
        { length: 16 },
        (_, index) => `alias${index}: hello`,
      ).join(' ')} }`,
    };
    const yoga = createYoga({
      schema: limitedSchema,
      graphqlEndpoint: '/api/graphql',
      logging: false,
      maskedErrors: false,
      plugins: getGraphQLSecurityPlugins(true, limitedQueries),
    });

    for (const hash of Object.keys(limitedQueries)) {
      const result = await executeOn(yoga, hash);
      expect(result.errors).toBeDefined();
      expect(result.data).toBeUndefined();
    }
  });

  it('keeps introspection enabled when production plugins are not applied', async () => {
    const developmentYoga = createYoga({
      schema,
      graphqlEndpoint: '/api/graphql',
      logging: false,
      plugins: getGraphQLSecurityPlugins(false),
    });

    const response = await developmentYoga.fetch('http://localhost/api/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __schema { queryType { name } } }' }),
    });
    const result = (await response.json()) as { errors?: Array<{ message: string }> };

    expect(result.errors).toBeUndefined();
  });

  it('sends only the generated hash from Apollo in production mode', async () => {
    let requestBody: Record<string, unknown> | undefined;
    const apollo = new ApolloClient({
      cache: new InMemoryCache(),
      link: createPersistedQueryLink(true).concat(
        new HttpLink({
          uri: 'http://localhost/api/graphql',
          fetch: async (input, init) => {
            requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
            return productionYoga.fetch(new Request(input, init));
          },
        }),
      ),
    });

    try {
      const result = await apollo.query({
        query: MeDocument,
        fetchPolicy: 'no-cache',
      });

      expect(result.data).toEqual({ me: null });
      expect(requestBody).not.toHaveProperty('query');
      expect(requestBody).toMatchObject({
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: getPersistedDocumentHash(MeDocument),
          },
        },
      });
    } finally {
      apollo.stop();
    }
  });
});

async function executeOn(
  yoga: ReturnType<typeof createYoga>,
  hash: string,
): Promise<{ data?: unknown; errors?: Array<{ message: string }> }> {
  const response = await yoga.fetch('http://localhost/api/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      extensions: { persistedQuery: { version: 1, sha256Hash: hash } },
    }),
  });
  return response.json();
}
