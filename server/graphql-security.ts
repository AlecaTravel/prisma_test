import { EnvelopArmorPlugin } from '@escape.tech/graphql-armor';
import { blockFieldSuggestionsPlugin } from '@escape.tech/graphql-armor-block-field-suggestions';
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection';
import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations';
import persistedDocuments from '../gql/persisted-documents.json';

type PersistedOperationManifest = Record<string, string>;

export function getGraphQLSecurityPlugins(
  isProduction: boolean,
  manifest: PersistedOperationManifest = persistedDocuments,
) {
  return [
    usePersistedOperations({
      allowArbitraryOperations: !isProduction,
      getPersistedOperation: (hash) => manifest[hash] ?? null,
    }),
    ...(isProduction
      ? [
          EnvelopArmorPlugin({
            maxDepth: { enabled: true, n: 6 },
            costLimit: { enabled: true, maxCost: 1000 },
            maxAliases: { enabled: true, n: 15 },
            maxTokens: { enabled: true, n: 1000 },
          }),
          useDisableIntrospection(),
          blockFieldSuggestionsPlugin(),
        ]
      : []),
  ];
}
