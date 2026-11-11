import type { NextApiRequest, NextApiResponse } from 'next';
import type { Session } from 'next-auth';
import { auth } from './auth';

type RequestSession = Session | null;

const requestSessions = new WeakMap<NextApiRequest, Promise<RequestSession>>();

export function getRequestSession(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<RequestSession> {
  const cachedSession = requestSessions.get(req);
  if (cachedSession) return cachedSession;

  const session = auth(req, res);
  requestSessions.set(req, session);
  return session;
}
