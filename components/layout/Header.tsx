import Link from "next/link"
import { useRouter } from "next/router"
import { signOut } from "next-auth/react"
import { useMe } from "../../features/auth/useMe"

const Header = () => {
  const router = useRouter()
  const { user, status } = useMe()

  function isActive(pathname: string) {
    return router.pathname === pathname
  }

  return (
    <nav
      aria-label="Navegación principal"
      className="grid grid-cols-[1fr_auto_1fr] items-center px-8 py-6 gap-4"
    >
      {/* Columna izquierda */}
      <div className="left flex items-center gap-4">
        <Link href="/" legacyBehavior>
          <a className="bold" data-active={isActive("/")}>
            Catálogo
          </a>
        </Link>
        <Link href="/search" legacyBehavior>
          <a data-active={isActive("/search")}>Buscar</a>
        </Link>
        <Link href="/whoweare" legacyBehavior>
          <a data-active={isActive("/whoweare")}>Quienes Somos</a>
        </Link>
        <Link href="/contactus" legacyBehavior>
          <a data-active={isActive("/contactus")}>Contactanos</a>
        </Link>
      </div>

      {/* Columna central — LOGO */}
      <Link href="/" legacyBehavior>
        <a
          aria-label="Aleca Travel — Ir al inicio"
          className="justify-self-center flex items-center"
        >
          <img
            src="/loguito.png"
            alt="Aleca Travel"
            className="h-24 w-auto sm:h-24 select-none"
            draggable={false}
          />
        </a>
      </Link>

      {/* Columna derecha */}
      <div className="right flex items-center justify-end gap-3">
        {status === "authenticated" ? (
          <>
            <span>{user?.name ?? user?.email}</span>
            <Link href="/mis-reservas" legacyBehavior>
              <a data-active={isActive("/mis-reservas")}>Mis reservas</a>
            </Link>
            {(user?.role === "ADMIN" || user?.role === "AGENT") && (
              <Link href="/admin" legacyBehavior>
                <a data-active={isActive("/admin")}>Administración</a>
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link href="/create" legacyBehavior>
                <a data-active={isActive("/create")}>+ Nuevo Hotel</a>
              </Link>
            )}
            <button type="button" onClick={() => void signOut({ redirectTo: "/" })}>
              Cerrar sesión
            </button>
          </>
        ) : status === "unauthenticated" ? (
          <>
            <Link href="/login" legacyBehavior>
              <a data-active={isActive("/login")}>Iniciar sesión</a>
            </Link>
            <Link href="/signup" legacyBehavior>
              <a data-active={isActive("/signup")}>Crear cuenta</a>
            </Link>
          </>
        ) : (
          <span aria-live="polite">Cargando sesión…</span>
        )}
      </div>

      <style jsx>{`
        .bold {
          font-weight: bold;
        }
        a {
          text-decoration: none;
          color: #ffffff;
          display: inline-block;
        }
        .left a[data-active="true"] {
          color: white;
        }
        a + a {
          margin-left: 1rem;
        }
        .right a {
          border: 1px solid white;
          padding: 0.5rem 1rem;
          border-radius: 3px;
        }
        button {
          background: white;
          border: 2px solid white;
          padding: 0.5rem 1rem;
          border-radius: 3px;
        }
      `}</style>
    </nav>
  )
}

export default Header