import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import { FeaturedPackages } from '../features/landing/components/FeaturedPackages';
import { Hero } from '../features/landing/components/Hero';

const travelSteps = [
  {
    step: '01',
    title: 'Elige tu experiencia',
    description: 'Explora paquetes con fechas y precios publicados.',
  },
  {
    step: '02',
    title: 'Pregunta con confianza',
    description: 'Nuestro equipo comparte detalles y disponibilidad vigente.',
  },
  {
    step: '03',
    title: 'Planea con acompañamiento',
    description: 'Resuelve tus dudas directamente con Aleca Travel.',
  },
];

const LandingPage = () => (
  <Layout>
    <Head>
      <title>Aleca Travel | Paquetes para tu próximo viaje</title>
      <meta
        name="description"
        content="Explora paquetes de viaje seleccionados y solicita información personalizada con Aleca Travel."
      />
    </Head>
    <main className="mx-auto max-w-7xl space-y-14 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Hero />
      <FeaturedPackages />
      <section
        aria-label="Cómo planear con Aleca Travel"
        className="grid gap-5 rounded-3xl border border-sky-100 bg-white/80 p-6 shadow-sm sm:grid-cols-3 sm:p-8"
      >
        {travelSteps.map(({ step, title, description }) => (
          <div
            key={step}
            className="rounded-2xl p-3 transition-colors hover:bg-sky-50"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-800">
              {step}
            </span>
            <h2 className="mt-3 font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </section>
      <section className="rounded-3xl bg-gradient-to-br from-sky-100 via-blue-50 to-white px-6 py-12 text-center shadow-inner shadow-sky-900/5 sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">
          ¿Tienes un destino en mente?
        </p>
        <h2 className="mt-2 text-2xl font-bold text-sky-950 sm:text-3xl">
          Hablemos de tu próximo viaje
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sky-900/75">
          Estamos preparando nuestro catálogo de hospedajes. Por ahora, nuestro
          equipo puede ayudarte personalmente a encontrar una opción.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex rounded-full bg-sky-700 px-6 py-3 font-semibold text-white shadow-md shadow-sky-700/20 transition hover:-translate-y-0.5 hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 motion-reduce:transform-none"
        >
          Hablar con el equipo
        </Link>
      </section>
    </main>
  </Layout>
);

export default LandingPage;
