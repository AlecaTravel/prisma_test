import Link from 'next/link'

const Footer = () => (
  <footer className="bg-brand-900 px-6 py-8 text-brand-50 sm:px-8">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="font-semibold text-white hover:text-brand-100">
          Aleca Travel
        </Link>
        <address className="mt-2 not-italic text-sm text-brand-100">
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
