import assert from 'node:assert/strict';
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { Kind, parse, print, visit } from 'graphql';
import { createSchema, createYoga } from 'graphql-yoga';
import * as generatedOperations from '../gql/graphql';
import { MeDocument } from '../gql/graphql';
import persistedDocuments from '../gql/persisted-documents.json';
import { createPersistedQueryLink, getPersistedDocumentHash } from '../lib/persisted-query-link';
import { getGraphQLSecurityPlugins } from '../server/graphql-security';

async function main() {
  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
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
    resolvers: { Query: { me: () => null } },
  });
  const yoga = createYoga({
    schema,
    graphqlEndpoint: '/api/graphql',
    logging: false,
    maskedErrors: false,
    plugins: getGraphQLSecurityPlugins(true),
  });

  let requestBody: Record<string, unknown> | undefined;
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: createPersistedQueryLink(true).concat(
      new HttpLink({
        uri: 'http://localhost/api/graphql',
        fetch: async (input, init) => {
          if (!init || typeof init.body !== 'string') {
            throw new Error('Apollo did not send a JSON request body');
          }
          requestBody = JSON.parse(init.body) as Record<string, unknown>;
          return yoga.fetch(new Request(input, init));
        },
      }),
    ),
  });

  try {
    const operationDocuments = Object.values(generatedOperations).filter(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        'kind' in value &&
        value.kind === 'Document',
    );
    assert.equal(operationDocuments.length, Object.keys(persistedDocuments).length);
    let maximumDepth = 0;
    let maximumAliases = 0;
    for (const document of operationDocuments) {
        const operation = document as typeof MeDocument;
        const source = print(operation);
        parse(source, { maxTokens: 1000 });

        let depth = 0;
        let aliases = 0;
        visit(operation, {
          Field(node, _key, _parent, _path, ancestors) {
            depth = Math.max(
              depth,
              ancestors.filter(
                (ancestor) =>
                  typeof ancestor === 'object' &&
                  ancestor !== null &&
                  'kind' in ancestor &&
                  ancestor.kind === Kind.FIELD,
              ).length + 1,
            );
            if (node.alias) aliases += 1;
          },
        });

        assert.ok(depth <= 6, `A generated operation exceeds depth 6 (${depth})`);
        assert.ok(aliases <= 15, `A generated operation exceeds 15 aliases (${aliases})`);
        maximumDepth = Math.max(maximumDepth, depth);
        maximumAliases = Math.max(maximumAliases, aliases);
        assert.ok(getPersistedDocumentHash(operation) in persistedDocuments);
    }

    const result = await client.query({ query: MeDocument, fetchPolicy: 'no-cache' });
    const hash = getPersistedDocumentHash(MeDocument);

    assert.deepEqual(result.data, { me: null });
    assert.ok(requestBody);
    assert.equal('query' in requestBody, false);
    assert.deepEqual(
      (requestBody.extensions as { persistedQuery: unknown }).persistedQuery,
      { version: 1, sha256Hash: hash },
    );

    const unknownHashResponse = await yoga.fetch('http://localhost/api/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        extensions: {
          persistedQuery: { version: 1, sha256Hash: 'unknown-operation-hash' },
        },
      }),
    });
    const unknownHashResult = (await unknownHashResponse.json()) as {
      errors?: Array<{ message: string }>;
    };
    assert.equal(unknownHashResult.errors?.[0]?.message, 'PersistedQueryNotFound');

    const arbitraryResponse = await yoga.fetch('http://localhost/api/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    });
    const arbitraryResult = (await arbitraryResponse.json()) as {
      errors?: Array<{ message: string }>;
    };
    assert.equal(arbitraryResult.errors?.[0]?.message, 'PersistedQueryOnly');

    const limitSchema = createSchema({
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
    const limitYoga = createYoga({
      schema: limitSchema,
      graphqlEndpoint: '/api/graphql',
      logging: false,
      maskedErrors: false,
      plugins: getGraphQLSecurityPlugins(true, limitedQueries),
    });

    for (const hash of Object.keys(limitedQueries)) {
      const response = await limitYoga.fetch('http://localhost/api/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          extensions: { persistedQuery: { version: 1, sha256Hash: hash } },
        }),
      });
      const result = (await response.json()) as {
        data?: unknown;
        errors?: Array<{ message: string }>;
      };
      assert.ok(result.errors?.length, `Armor accepted the ${hash} query`);
      assert.equal(result.data, undefined);
    }

    console.info(`Persisted-operation verification passed: Apollo sent only a manifest hash, Yoga executed it, rejected arbitrary text, production Armor blocked over-depth and over-alias operations, and all ${operationDocuments.length} generated operations fit depth, alias, and token limits (max depth ${maximumDepth}, aliases ${maximumAliases}).`);
  } finally {
    client.stop();
  }
}

main().catch((error: unknown) => {
  console.error('Persisted-operation verification failed:', error);
  process.exitCode = 1;
});
