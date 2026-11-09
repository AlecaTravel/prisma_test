import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import { useMe } from '../../features/auth/useMe';

const Header = () => {
  const router = useRouter();
  const { user, status } = useMe();

  function isActive(pathname: string) {
    return router.pathname === pathname;
  }

  const navClass = (pathname: string) =>
    `rounded-full px-3 py-2 text-sm font-medium transition hover:bg-white/10 hover:text-white ${
      isActive(pathname) ? 'bg-white/10 text-white' : 'text-sky-100'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-brand-900/95 text-white shadow-sm shadow-sky-950/10 backdrop-blur">
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8"
      >
        <Link href="/" className="flex items-center gap-2" aria-label="Aleca Travel, inicio">
          <Image src="/Logo.png" alt="" width={66} height={66} className="h-11 w-11 object-contain" />
          <span className="text-lg font-semibold tracking-tight text-white">Aleca Travel</span>
        </Link>

        <div className="flex flex-1 flex-wrap items-center gap-1">
          <Link href="/#paquetes" className={navClass('/')}>
            Paquetes
          </Link>
          <Link href="/search" className={navClass('/search')}>
            Hospedajes
          </Link>
          <Link href="/about" className={navClass('/about')}>
            Nosotros
          </Link>
          <Link href="/contact" className={navClass('/contact')}>
            Contáctanos
          </Link>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
          {status === 'authenticated' ? (
            <>
              <span className="hidden text-sky-100 sm:inline">{user?.name ?? user?.email}</span>
              <Link href="/mis-reservas" className={navClass('/mis-reservas')}>
                Mis reservas
              </Link>
              {(user?.role === 'ADMIN' || user?.role === 'AGENT') && (
                <Link href="/admin" className={navClass('/admin')}>
                  Administración
                </Link>
              )}
              {user?.role === 'ADMIN' && (
                <Link href="/create" className={navClass('/create')}>
                  + Nuevo hotel
                </Link>
              )}
              <button
                type="button"
                onClick={() => void signOut({ redirectTo: '/' })}
                className="rounded-full border border-white/40 px-3 py-2 font-medium text-white transition hover:bg-white hover:text-brand-900"
              >
                Cerrar sesión
              </button>
            </>
          ) : status === 'unauthenticated' ? (
            <>
              <Link href="/login" className={navClass('/login')}>
                Iniciar sesión
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-white px-4 py-2 font-semibold text-brand-900 transition hover:bg-brand-50"
              >
                Crear cuenta
              </Link>
            </>
          ) : (
            <span aria-live="polite" className="sr-only">
              Cargando sesión…
            </span>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
