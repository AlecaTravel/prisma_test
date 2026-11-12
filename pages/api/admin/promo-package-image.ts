import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getRequestSession } from '../../../server/request-session';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const PATH_PREFIX = 'combo-flyers/';

export const config = {
  api: {
    bodyParser: { sizeLimit: '1mb' },
  },
};

function createWebRequest(req: NextApiRequest): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(name, value);
    else if (value) headers.set(name, value.join(', '));
  }

  return new Request(
    new URL(req.url ?? '/', 'https://aleca-travel.invalid'),
    {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    },
  );
}

export default async function promoPackageImageUpload(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return res.status(503).json({
      error: 'La carga de flyers no está configurada en este entorno.',
    });
  }

  try {
    const body = req.body as HandleUploadBody;
    const result = await handleUpload({
      body,
      request: createWebRequest(req),
      onBeforeGenerateToken: async (pathname) => {
        const session = await getRequestSession(req, res);
        if (!session) throw new Error('UNAUTHENTICATED');
        if (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT') {
          throw new Error('FORBIDDEN');
        }
        if (
          !pathname.startsWith(PATH_PREFIX) ||
          !/\.(jpe?g|png|webp)$/i.test(pathname)
        ) {
          throw new Error('INVALID_UPLOAD_PATH');
        }

        return {
          allowedContentTypes: ALLOWED_IMAGE_TYPES,
          maximumSizeInBytes: MAX_IMAGE_SIZE,
          addRandomSuffix: true,
        };
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return res.status(401).json({ error: 'Inicia sesión para cargar imágenes.' });
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'No tienes permiso para cargar imágenes.' });
    }
    if (error instanceof Error && error.message === 'INVALID_UPLOAD_PATH') {
      return res.status(400).json({ error: 'La ruta o el formato de imagen no es válido.' });
    }

    console.error('No se pudo procesar la carga del flyer del paquete.', error);
    return res.status(500).json({ error: 'No se pudo procesar la carga de la imagen.' });
  }
}
