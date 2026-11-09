import Image from 'next/image';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="hero-organic relative isolate overflow-hidden rounded-[2rem] px-6 py-10 text-white shadow-xl shadow-sky-950/10 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.75fr]">
        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
            Aleca Travel · Viajes con intención
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            El mundo se disfruta mejor cuando el viaje ya está pensado.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-sky-50/90">
            Escapadas seleccionadas, paquetes claros y acompañamiento cercano
            desde que empiezas a imaginarlo hasta que vuelves a casa.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#paquetes"
              className="inline-flex items-center rounded-full bg-white px-6 py-3 font-semibold text-sky-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50"
            >
              Descubre los paquetes <span className="ml-2" aria-hidden="true">→</span>
            </a>
            <Link
              href="/about"
              className="inline-flex items-center rounded-full border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Conoce Aleca
            </Link>
          </div>
          <p className="mt-5 text-xs text-sky-100/80">
            Paquetes y tarifas sujetos a disponibilidad y cambios.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-4 rotate-3 rounded-[1.75rem] bg-cyan-300/20 blur-sm" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/10 shadow-2xl">
            <Image
              src="/0- Costa RicaAventurero.jpeg"
              alt="Paquete Costa Rica Aventurero de Aleca Travel"
              fill
              priority
              sizes="(max-width: 1024px) 80vw, 360px"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -left-5 rounded-2xl border border-white/70 bg-white px-5 py-3 text-sky-950 shadow-xl">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-700">
              Tu próxima historia
            </p>
            <p className="mt-1 text-lg font-bold">empieza aquí</p>
          </div>
        </div>
      </div>
      <span className="pointer-events-none absolute -right-20 -top-32 -z-10 h-96 w-96 rounded-full border border-white/10" />
      <span className="pointer-events-none absolute -bottom-48 left-1/3 -z-10 h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl" />
    </section>
  );
}
