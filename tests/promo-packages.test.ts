import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createYoga } from 'graphql-yoga';
import type { Context, SessionUser } from '../server/context';
import { schema } from '../server/schema';

let currentUser: SessionUser | null = null;
const promoPackage = {
  findMany: vi.fn().mockResolvedValue([]),
  create: vi.fn(),
  update: vi.fn(),
};

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  logging: false,
  maskedErrors: false,
  context: () =>
    ({
      prisma: { promoPackage },
      user: currentUser,
      anonymousId: null,
    }) as unknown as Context,
});

type GqlError = { message: string; extensions?: { code?: string } };

async function gql<TData>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ data?: TData; errors?: GqlError[] }> {
  const response = await yoga.fetch('http://test/api/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  return response.json() as Promise<{ data?: TData; errors?: GqlError[] }>;
}

const ADMIN_PACKAGES = /* GraphQL */ `
  query AdminPackages {
    adminPromoPackages { id title }
  }
`;

const CREATE_PACKAGE = /* GraphQL */ `
  mutation CreatePromoPackage(
    $title: String!
    $category: PromoPackageCategory!
    $destination: String!
    $departure: String!
    $duration: String!
    $price: String!
    $currency: String!
    $priceNote: String!
    $description: String!
    $imageUrl: String!
    $blobPathname: String!
  ) {
    createPromoPackage(
      title: $title
      category: $category
      destination: $destination
      departure: $departure
      duration: $duration
      price: $price
      currency: $currency
      priceNote: $priceNote
      description: $description
      imageUrl: $imageUrl
      blobPathname: $blobPathname
    ) { id }
  }
`;

const validPackageVariables = {
  title: 'Combo de prueba',
  category: 'PLAYA',
  destination: 'Mazatlán',
  departure: 'Temporada 2027',
  duration: '4 días',
  price: '1200',
  currency: 'MXN',
  priceNote: 'por persona',
  description: 'Descripción de prueba',
  imageUrl: 'https://store.public.blob.vercel-storage.com/combo-flyers/combo.jpg',
  blobPathname: 'combo-flyers/combo.jpg',
};

describe('promo packages access control', () => {
  beforeEach(() => {
    currentUser = null;
    vi.clearAllMocks();
    promoPackage.findMany.mockResolvedValue([]);
  });

  it.each([
    ['anonymous visitor', null],
    ['customer', { id: 'customer-1', role: 'CUSTOMER' as const }],
  ])('denies private reads and writes to %s', async (_label, user) => {
    currentUser = user;

    const readResult = await gql<{ adminPromoPackages: unknown[] }>(ADMIN_PACKAGES);
    const createResult = await gql(CREATE_PACKAGE, validPackageVariables);

    expect(readResult.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    expect(createResult.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    expect(promoPackage.findMany).not.toHaveBeenCalled();
    expect(promoPackage.create).not.toHaveBeenCalled();
  });

  it.each(['AGENT', 'ADMIN'] as const)('allows %s to read admin packages', async (role) => {
    currentUser = { id: `user-${role.toLowerCase()}`, role };

    const result = await gql<{ adminPromoPackages: unknown[] }>(ADMIN_PACKAGES);

    expect(result.errors).toBeUndefined();
    expect(result.data?.adminPromoPackages).toEqual([]);
    expect(promoPackage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });

  it('only queries published packages publicly', async () => {
    const result = await gql<{ publishedPromoPackages: unknown[] }>(`
      query PublishedPackages { publishedPromoPackages { id title } }
    `);

    expect(result.errors).toBeUndefined();
    expect(promoPackage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PUBLISHED' }),
        take: 100,
      }),
    );
  });

  it('rejects a blob URL that does not match the stored blob pathname', async () => {
    currentUser = { id: 'admin-1', role: 'ADMIN' };

    const result = await gql(CREATE_PACKAGE, {
      ...validPackageVariables,
      imageUrl: 'https://store.public.blob.vercel-storage.com/combo-flyers/other.jpg',
    });

    expect(result.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
    expect(promoPackage.create).not.toHaveBeenCalled();
  });
});
