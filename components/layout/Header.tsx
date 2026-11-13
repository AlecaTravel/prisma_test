import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { useMe } from '../../features/auth/useMe';

const primaryLinks = [
  { href: '/#paquetes', label: 'Paquetes', pathname: '/' },
  { href: '/about', label: 'Nosotros', pathname: '/about' },
  { href: '/contact', label: 'Contacto', pathname: '/contact' },
];

const Header = () => {
  const router = useRouter();
  const { user, status } = useMe();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const showSearchLab =
    status === 'authenticated' && (user?.role === 'ADMIN' || user?.role === 'AGENT');

  const closeMenu = () => setMenuOpen(false);
  const isActive = (pathname: string) => router.pathname === pathname;

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
        menuButtonRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !headerRef.current?.contains(event.target)
      ) {
        closeMenu();
      }
    };
    const handleRouteChange = () => closeMenu();

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [menuOpen, router.events]);

  const renderPrimaryLinks = (compact: boolean) =>
    primaryLinks.map(({ href, label, pathname }) => (
      <Link
        key={href}
        href={href}
        aria-current={isActive(pathname) ? 'page' : undefined}
        onClick={compact ? closeMenu : undefined}
        className={`rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${
          isActive(pathname)
            ? 'bg-sky-100 text-sky-950'
            : 'text-sky-800 hover:bg-sky-100 hover:text-sky-950'
        } ${compact ? 'w-full' : ''}`}
      >
        {label}
      </Link>
    ));

  const renderAccountLinks = (compact: boolean) => {
    const linkClass = compact
      ? 'w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-sky-900 transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700'
      : 'rounded-full px-3 py-2 text-sm font-medium text-sky-800 transition-colors hover:bg-sky-100 hover:text-sky-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700';

    const searchLabLink = showSearchLab && (
      <Link
        href="/search-lab"
        onClick={compact ? closeMenu : undefined}
        aria-current={isActive('/search-lab') ? 'page' : undefined}
        className={linkClass}
      >
        Lab de búsqueda
      </Link>
    );

    if (status === 'authenticated') {
      return (
        <>
          {searchLabLink}
          {compact && (
            <p className="truncate px-3 pb-2 text-sm font-medium text-sky-700">
              {user?.name ?? user?.email}
            </p>
          )}
          <Link
            href="/mis-reservas"
            onClick={compact ? closeMenu : undefined}
            aria-current={isActive('/mis-reservas') ? 'page' : undefined}
            className={linkClass}
          >
            Mis reservas
          </Link>
          {(user?.role === 'ADMIN' || user?.role === 'AGENT') && (
            <Link
              href="/admin"
              onClick={compact ? closeMenu : undefined}
              aria-current={isActive('/admin') ? 'page' : undefined}
              className={linkClass}
            >
              Administración
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              closeMenu();
              void signOut({ redirectTo: '/' });
            }}
            className={`${linkClass} ${
              compact
                ? 'border-t border-sky-100 text-slate-600'
                : 'border border-sky-200'
            }`}
          >
            Cerrar sesión
          </button>
        </>
      );
    }

    if (status === 'unauthenticated') {
      return (
        <>
          {searchLabLink}
          <Link
            href="/login"
            onClick={compact ? closeMenu : undefined}
            aria-current={isActive('/login') ? 'page' : undefined}
            className={linkClass}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            onClick={compact ? closeMenu : undefined}
            aria-current={isActive('/signup') ? 'page' : undefined}
            className={`${
              compact
                ? 'w-full rounded-xl px-3 py-2.5 text-sm font-semibold'
                : 'rounded-full px-4 py-2 text-sm font-semibold'
            } bg-sky-700 text-white transition-colors hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700`}
          >
            Crear cuenta
          </Link>
        </>
      );
    }

    return (
      <span aria-live="polite" className="sr-only">
        Cargando sesión…
      </span>
    );
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 border-b border-sky-100 bg-white/95 text-sky-950 shadow-sm shadow-sky-950/5 backdrop-blur"
    >
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          aria-label="Aleca Travel, inicio"
        >
          <Image
            src="/Logo.png"
            alt=""
            width={66}
            height={66}
            className="h-10 w-10 object-contain sm:h-11 sm:w-11"
          />
          <span className="text-base font-semibold tracking-tight text-sky-950 sm:text-lg">
            Aleca Travel
          </span>
        </Link>

        <div className="hidden items-center gap-1 xl:flex">
          {renderPrimaryLinks(false)}
        </div>

        <div className="hidden items-center justify-end gap-1 xl:flex">
          {status === 'authenticated' && (
            <span className="mr-2 max-w-36 truncate text-sm text-sky-700 2xl:max-w-48">
              {user?.name ?? user?.email}
            </span>
          )}
          {renderAccountLinks(false)}
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-900 transition-colors hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 xl:hidden"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            {menuOpen ? (
              <path d="m6 6 12 12M18 6 6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      <div
        id="mobile-navigation"
        className={`border-t border-sky-100 bg-white px-4 pb-4 pt-3 shadow-lg shadow-sky-950/5 sm:px-6 xl:hidden ${
          menuOpen ? 'block' : 'hidden'
        }`}
      >
        <nav aria-label="Navegación móvil" className="mx-auto grid max-w-7xl gap-1">
          {renderPrimaryLinks(true)}
        </nav>
        <div className="mx-auto mt-3 grid max-w-7xl gap-1 border-t border-sky-100 pt-3">
          {renderAccountLinks(true)}
        </div>
      </div>
    </header>
  );
};

export default Header;
