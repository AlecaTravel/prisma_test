import Link from 'next/link'

const Footer = () => (
  <footer className="border-t border-sky-200 bg-sky-100 px-6 py-8 text-sky-800 sm:px-8">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="font-semibold text-sky-950 hover:text-sky-700">
          Aleca Travel
        </Link>
        <address className="mt-2 not-italic text-sm text-sky-700">
          Av. Rosario Castellanos 2293, Col. Jardines de la Cruz
        </address>
      </div>

      <div className="flex flex-col gap-5 text-sm sm:flex-row sm:items-center sm:gap-8">
        <nav aria-label="Enlaces del sitio" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link className="hover:text-white" href="/about">Sobre nosotros</Link>
          <Link className="hover:text-white" href="/contact">Contáctanos</Link>
        </nav>
        <nav aria-label="Contacto" className="flex flex-col gap-2 sm:items-end">
          <a className="hover:text-white" href="tel:+523313353452">
            +52 33 1335 3452
          </a>
          <a className="hover:text-white" href="mailto:alecago.aventuras@gmail.com">
            alecago.aventuras@gmail.com
          </a>
          <a
            className="hover:text-white"
            href="https://www.instagram.com/aleca_travel/"
            target="_blank"
            rel="noreferrer"
          >
            @aleca_travel
          </a>
        </nav>
      </div>
    </div>
  </footer>
)

export default Footer
