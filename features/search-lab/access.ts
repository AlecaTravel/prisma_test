import type { UserRole } from '../../prisma/generated/client';

export function searchLabRedirect(
  role: UserRole | undefined,
  isDevelopment: boolean,
  callbackUrl: string,
): string | null {
  if (isDevelopment || role === 'ADMIN' || role === 'AGENT') return null;
  if (!role) return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  return '/';
}
