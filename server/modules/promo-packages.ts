import { GraphQLError } from 'graphql';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../../prisma/generated/client';
import { slugify } from '../../lib/text';
import { builder } from '../builder';
import { requireRole } from '../auth-guards';

const MAX_ADMIN_PACKAGES = 100;
const MAX_DESCRIPTION_LENGTH = 2_000;

const PromoPackageCategory = builder.enumType('PromoPackageCategory', {
  values: ['AVENTURA', 'EUROPA', 'PLAYA', 'CIUDAD'] as const,
});

const PromoPackageStatus = builder.enumType('PromoPackageStatus', {
  values: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const,
});

const PromoPackage = builder.prismaObject('PromoPackage', {
  fields: (t) => ({
    id: t.exposeID('id'),
    slug: t.exposeString('slug'),
    title: t.exposeString('title'),
    category: t.expose('category', { type: PromoPackageCategory }),
    destination: t.exposeString('destination'),
    departure: t.exposeString('departure'),
    duration: t.exposeString('duration'),
    price: t.string({ resolve: (item) => item.price.toString() }),
    currency: t.exposeString('currency'),
    priceNote: t.exposeString('priceNote'),
    description: t.exposeString('description'),
    imageUrl: t.string({
      resolve: (item) =>
        item.blobPathname
          ? `/api/paquetes/${encodeURIComponent(item.slug)}/imagen`
          : item.imageUrl,
    }),
    status: t.expose('status', { type: PromoPackageStatus }),
    startsAt: t.expose('startsAt', { type: 'DateTime', nullable: true }),
    endsAt: t.expose('endsAt', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

function badInput(message: string): never {
  throw new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}

function requiredText(value: string, label: string, maxLength: number): string {
  const text = value.trim();
  if (!text || text.length > maxLength) {
    badInput(`${label} es obligatorio y debe tener máximo ${maxLength} caracteres`);
  }
  return text;
}

function validateImage(imageUrl: string, blobPathname: string) {
  let url: URL;
  let decodedPathname: string;
  try {
    url = new URL(imageUrl);
    decodedPathname = decodeURIComponent(url.pathname.slice(1));
  } catch {
    return badInput('La imagen debe provenir de una carga privada válida de Vercel Blob');
  }

  if (
    url.protocol !== 'https:' ||
    !url.hostname.endsWith('.private.blob.vercel-storage.com') ||
    !blobPathname.startsWith('combo-flyers/') ||
    decodedPathname !== blobPathname ||
    url.username !== '' ||
    url.password !== '' ||
    url.port !== '' ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    badInput('La imagen debe provenir de una carga privada válida de Vercel Blob');
  }
}

function validateDates(startsAt?: Date | null, endsAt?: Date | null) {
  if (
    startsAt &&
    Number.isNaN(startsAt.getTime())
  ) {
    badInput('La fecha inicial no es válida');
  }
  if (endsAt && Number.isNaN(endsAt.getTime())) {
    badInput('La fecha final no es válida');
  }
  if (startsAt && endsAt && startsAt > endsAt) {
    badInput('La fecha inicial no puede ser posterior a la fecha final');
  }
}

builder.queryField('publishedPromoPackages', (t) =>
  t.field({
    type: [PromoPackage],
    resolve: (_root, _args, ctx) => {
      const now = new Date();
      return ctx.prisma.promoPackage.findMany({
        where: {
          status: 'PUBLISHED',
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          ],
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: MAX_ADMIN_PACKAGES,
      });
    },
  }),
);

builder.queryField('adminPromoPackages', (t) =>
  t.field({
    type: [PromoPackage],
    resolve: (_root, _args, ctx) => {
      requireRole(ctx, ['ADMIN', 'AGENT']);
      return ctx.prisma.promoPackage.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: MAX_ADMIN_PACKAGES,
      });
    },
  }),
);

builder.mutationField('createPromoPackage', (t) =>
  t.prismaField({
    type: 'PromoPackage',
    args: {
      title: t.arg.string({ required: true }),
      category: t.arg({ type: PromoPackageCategory, required: true }),
      destination: t.arg.string({ required: true }),
      departure: t.arg.string({ required: true }),
      duration: t.arg.string({ required: true }),
      price: t.arg.string({ required: true }),
      currency: t.arg.string({ required: true, defaultValue: 'MXN' }),
      priceNote: t.arg.string({ required: true }),
      description: t.arg.string({ required: true }),
      imageUrl: t.arg.string({ required: true }),
      blobPathname: t.arg.string({ required: true }),
      status: t.arg({ type: PromoPackageStatus, required: false, defaultValue: 'DRAFT' }),
      startsAt: t.arg({ type: 'DateTime', required: false }),
      endsAt: t.arg({ type: 'DateTime', required: false }),
    },
    resolve: (query, _root, args, ctx) => {
      requireRole(ctx, ['ADMIN', 'AGENT']);
      const title = requiredText(args.title, 'El título', 120);
      const destination = requiredText(args.destination, 'El destino', 160);
      const departure = requiredText(args.departure, 'La fecha o temporada', 120);
      const duration = requiredText(args.duration, 'La duración', 80);
      const priceNote = requiredText(args.priceNote, 'La nota de precio', 160);
      const description = requiredText(
        args.description,
        'La descripción',
        MAX_DESCRIPTION_LENGTH,
      );
      const currency = requiredText(args.currency, 'La moneda', 3).toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) badInput('La moneda debe ser un código de 3 letras');

      const price = new Prisma.Decimal(args.price);
      if (!price.isFinite() || price.lte(0) || price.gt('9999999999.99')) {
        badInput('El precio debe ser mayor a cero y tener un máximo de 10 dígitos enteros');
      }

      const imageUrl = requiredText(args.imageUrl, 'La imagen', 2_048);
      const blobPathname = requiredText(args.blobPathname, 'La ruta de imagen', 512);
      validateImage(imageUrl, blobPathname);
      validateDates(args.startsAt, args.endsAt);

      return ctx.prisma.promoPackage.create({
        ...query,
        data: {
          slug: `${slugify(title) || 'paquete'}-${randomUUID().slice(0, 8)}`,
          title,
          category: args.category,
          destination,
          departure,
          duration,
          price,
          currency,
          priceNote,
          description,
          imageUrl,
          blobPathname,
          status: args.status ?? 'DRAFT',
          startsAt: args.startsAt ?? null,
          endsAt: args.endsAt ?? null,
        },
      });
    },
  }),
);

builder.mutationField('setPromoPackageStatus', (t) =>
  t.prismaField({
    type: 'PromoPackage',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg({ type: PromoPackageStatus, required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      requireRole(ctx, ['ADMIN', 'AGENT']);
      return ctx.prisma.promoPackage.update({
        ...query,
        where: { id: args.id },
        data: { status: args.status },
      });
    },
  }),
);
