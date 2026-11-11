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
    `rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-sky-100 hover:text-sky-950 ${
      isActive(pathname) ? 'bg-sky-100 text-sky-950' : 'text-sky-800'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-sky-100 bg-white/95 text-sky-950 shadow-sm shadow-sky-950/5 backdrop-blur">
      <nav
        aria-label="Navegación principal"
        className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-2 gap-y-3 px-4 py-3 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2 sm:px-6 lg:px-8"
      >
        <Link href="/" className="flex items-center gap-2" aria-label="Aleca Travel, inicio">
          <Image src="/Logo.png" alt="" width={66} height={66} className="h-11 w-11 object-contain" />
          <span className="text-lg font-semibold tracking-tight text-sky-950">Aleca Travel</span>
        </Link>

        <div className="col-span-2 flex flex-wrap items-center justify-center gap-1 sm:col-span-1 sm:flex-1 sm:justify-start">
          <Link href="/#paquetes" className={navClass('/')}>
            Paquetes
          </Link>
          <Link href="/about" className={navClass('/about')}>
            Nosotros
          </Link>
          <Link href="/contact" className={navClass('/contact')}>
            Contacto
          </Link>
        </div>

        <div className="col-start-2 row-start-1 ml-auto flex flex-wrap items-center justify-end gap-2 text-sm">
          {status === 'authenticated' ? (
            <>
              <span className="hidden text-sky-700 sm:inline">{user?.name ?? user?.email}</span>
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
                className="rounded-full border border-sky-300 px-3 py-2 font-medium text-sky-800 transition hover:bg-sky-100 hover:text-sky-950"
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
                className="rounded-full bg-sky-700 px-4 py-2 font-semibold text-white transition hover:bg-sky-800"
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
