import Link from "next/link"
import { useRouter } from "next/router"
import { useMe } from "../../features/auth/useMe"

const Footer = () => {
  const router = useRouter()
  const { user, status } = useMe()

  function isActive(pathname: string) {
    return router.pathname === pathname
  }

  return (
    <nav aria-label="Pie de página">
      <div className="left">
        <Link href="/" legacyBehavior>
          <a className="bold" data-active={isActive("/")}>
            Aleca Travel
          </a>
        </Link>
        <Link href="/search" legacyBehavior>
          <a data-active={isActive("/search")}> +52 3313353452 </a>
        </Link>
        <Link href="/whoweare" legacyBehavior>
          <a data-active={isActive("/whoweare")}>@aleca_travel</a>
        </Link>
        <Link href="/contactus" legacyBehavior>
          <a data-active={isActive("/contactus")}>alecago.aventuras@gmail.com</a>
        </Link>
      </div>
      <div className="right text-mist-50">
        <span aria-live="polite">
          Av. Rosario Castellanos 2293, Col. Jardines de la Cruz
        </span>
      </div>

      <style jsx>{`
        nav {
          position: relative;
          overflow: hidden;
          display: flex;
          padding: 2rem;
          align-items: center;
        }

        /* Marca de agua del logo, centrada */
        nav::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url('/loguito.png');
          background-repeat: no-repeat;
          background-position: center;
          background-size: 200px auto; /* ajusta el tamaño a tu gusto */
          opacity: 0.12;               /* 0.08 – 0.15 = sutil */
          pointer-events: none;
        }

        /* Asegura que el contenido quede POR ENCIMA del logo */
        nav > div {
          position: relative;
          z-index: 1;
        }

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
          margin-left: 2rem;
        }
        a + a {
          margin-left: 1rem;
        }
        .right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .right a {
          border: 1px solid black;
          padding: 0.5rem 1rem;
          border-radius: 3px;
        }
        button {
          background: white;
          border: 1px solid black;
          padding: 0.5rem 1rem;
          border-radius: 3px;
        }
      `}</style>
    </nav>
  )
}

export default Footer