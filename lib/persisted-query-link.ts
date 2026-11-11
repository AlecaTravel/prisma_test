import { PersistedQueryLink } from '@apollo/client/link/persisted-queries';
import type { DocumentNode } from 'graphql';

export function getPersistedDocumentHash(document: DocumentNode): string {
  if (!('__meta__' in document)) {
    throw new Error('GraphQL operation is missing its generated persisted hash');
  }

  const metadata = document.__meta__;
  if (
    typeof metadata !== 'object' ||
    metadata === null ||
    !('hash' in metadata) ||
    typeof metadata.hash !== 'string'
  ) {
    throw new Error('GraphQL operation has an invalid generated persisted hash');
  }

  return metadata.hash;
}

export function createPersistedQueryLink(
  isProduction = process.env.NODE_ENV === 'production',
) {
  return new PersistedQueryLink({
    generateHash: getPersistedDocumentHash,
    retry: ({ meta }) => !isProduction && meta.persistedQueryNotFound,
  });
}
