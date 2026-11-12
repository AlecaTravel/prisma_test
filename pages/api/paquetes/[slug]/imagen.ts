import type { NextApiRequest, NextApiResponse } from 'next';
import { get } from '@vercel/blob';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import prisma from '../../../../lib/prisma';
import { getRequestSession } from '../../../../server/request-session';

const STAFF_ROLES = ['ADMIN', 'AGENT'] as const;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isPublicPackage(
  status: string,
  startsAt: Date | null,
  endsAt: Date | null,
  now: Date,
) {
  return (
    status === 'PUBLISHED' &&
    (!startsAt || startsAt <= now) &&
    (!endsAt || endsAt >= now)
  );
}

export default async function promoPackageImage(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const { slug } = req.query;
  if (typeof slug !== 'string' || slug.length > 200) {
    return res.status(400).end();
  }

  try {
    const travelPackage = await prisma.promoPackage.findUnique({
      where: { slug },
      select: {
        status: true,
        startsAt: true,
        endsAt: true,
        blobPathname: true,
      },
    });

    if (!travelPackage?.blobPathname) {
      return res.status(404).end();
    }

    const publiclyVisible = isPublicPackage(
      travelPackage.status,
      travelPackage.startsAt,
      travelPackage.endsAt,
      new Date(),
    );

    if (!publiclyVisible) {
      const session = await getRequestSession(req, res);
      if (!session) {
        res.setHeader('Cache-Control', 'private, no-store');
        return res.status(401).end();
      }
      if (
        session.user.role !== STAFF_ROLES[0] &&
        session.user.role !== STAFF_ROLES[1]
      ) {
        res.setHeader('Cache-Control', 'private, no-store');
        return res.status(403).end();
      }
    }

    const blob = await get(travelPackage.blobPathname, { access: 'private' });
    if (!blob) {
      return res.status(404).end();
    }

    const contentType = blob.blob.contentType;
    if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
      return res.status(415).end();
    }
    if (!blob.stream) {
      throw new Error('Vercel Blob returned no image stream');
    }

    res.setHeader(
      'Cache-Control',
      publiclyVisible
        ? 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
        : 'private, no-store',
    );
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    const reader = blob.stream.getReader();
    const chunks = (async function* () {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return;
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    })();

    res.status(200);
    await pipeline(Readable.from(chunks), res);
  } catch (error) {
    console.error('No se pudo entregar el flyer privado del paquete.', error);
    if (res.headersSent) {
      res.destroy(error instanceof Error ? error : undefined);
      return;
    }
    return res.status(500).end();
  }
}
