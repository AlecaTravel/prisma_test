import Link from 'next/link';
import { useMe } from '../auth/useMe';

export function SearchLabLink() {
  const { user, status } = useMe();
  if (status !== 'authenticated' || (user?.role !== 'ADMIN' && user?.role !== 'AGENT')) {
    return null;
  }

  return (
    <Link
      href="/search-lab"
      className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-900 shadow-sm transition hover:border-sky-400 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
    >
      <span aria-hidden="true">✦</span>
      Abrir lab de búsqueda
    </Link>
  );
}
