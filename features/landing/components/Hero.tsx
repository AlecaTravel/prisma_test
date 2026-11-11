import Image from 'next/image';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="hero-organic relative isolate overflow-hidden rounded-[2rem] px-6 py-10 text-sky-950 shadow-xl shadow-sky-900/10 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.75fr]">
        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Aleca Travel · Viajar es Evolucionar
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Tu próximo viaje empieza con una buena historia.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-sky-900/80">
            Descubre viajes seleccionados y recibe acompañamiento cercano para
            encontrar el que va contigo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#paquetes"
              className="inline-flex items-center rounded-full bg-sky-700 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-700/20 transition hover:-translate-y-0.5 hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 motion-reduce:transform-none"
            >
              Explorar paquetes <span className="ml-2" aria-hidden="true">→</span>
            </a>
            <Link
              href="/about"
              className="inline-flex items-center rounded-full border border-sky-300 bg-white/70 px-6 py-3 font-semibold text-sky-900 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
            >
              Conoce Aleca
            </Link>
          </div>
          <p className="mt-5 text-xs text-sky-700">
            Paquetes y tarifas sujetos a disponibilidad y cambios.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-4 rotate-3 rounded-[1.75rem] bg-sky-300/50 blur-sm" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white bg-white/80 shadow-2xl shadow-sky-900/10">
            <Image
              src="/0- Costa RicaAventurero.jpeg"
              alt="Paquete Costa Rica Aventurero de Aleca Travel"
              fill
              priority
              sizes="(max-width: 1024px) 80vw, 360px"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -left-5 rounded-2xl border border-sky-100 bg-white px-5 py-3 text-sky-950 shadow-xl">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-700">
              Viaja a tu manera
            </p>
            <p className="mt-1 text-lg font-bold">con Aleca Travel</p>
          </div>
        </div>
      </div>
      <span className="pointer-events-none absolute -right-20 -top-32 -z-10 h-96 w-96 rounded-full border border-sky-300/40" />
      <span className="pointer-events-none absolute -bottom-48 left-1/3 -z-10 h-96 w-96 rounded-full bg-sky-300/30 blur-3xl" />
    </section>
  );
}
