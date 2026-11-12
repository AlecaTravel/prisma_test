import { describe, expect, it } from 'vitest';
import { safeCallbackUrl } from '../features/auth/safeCallbackUrl';

describe('safeCallbackUrl', () => {
  it('allows same-origin relative paths and query strings', () => {
    expect(safeCallbackUrl('/admin/paquetes')).toBe('/admin/paquetes');
    expect(safeCallbackUrl('/login?callbackUrl=%2Fmis-reservas')).toBe(
      '/login?callbackUrl=%2Fmis-reservas',
    );
  });

  it('falls back for external, protocol-relative, and malformed values', () => {
    expect(safeCallbackUrl('https://example.com')).toBe('/');
    expect(safeCallbackUrl('//example.com')).toBe('/');
    expect(safeCallbackUrl('/\\example.com')).toBe('/');
    expect(safeCallbackUrl(['/', '/admin'])).toBe('/');
    expect(safeCallbackUrl(undefined)).toBe('/');
  });
});
