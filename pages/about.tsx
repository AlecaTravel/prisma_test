import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/layout/Layout';

const AboutPage = () => (
  <Layout>
    <Head>
      <title>Sobre nosotros | Aleca Travel</title>
      <meta
        name="description"
        content="Conoce Aleca Travel: viajes seleccionados y acompañamiento cercano para cada aventura."
      />
    </Head>
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
      <section className="hero-organic overflow-hidden rounded-[2rem] px-6 py-12 text-white shadow-xl shadow-sky-950/10 sm:px-12 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">
          Sobre nosotros
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Creamos viajes que se sienten tuyos.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-sky-50/90">
          En Aleca Travel creemos que cada aventura comienza con una buena
          conversación. Te ayudamos a encontrar experiencias que conecten con
          tus ganas de descubrir, descansar y compartir.
        </p>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-2">
        <article className="rounded-3xl border border-sky-100 bg-white/80 p-7 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Nuestra forma de viajar</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Seleccionamos paquetes y hospedajes con información clara para que
            puedas comparar con calma y elegir lo que mejor se adapte a ti.
          </p>
        </article>
        <article className="rounded-3xl border border-sky-100 bg-white/80 p-7 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Acompañamiento cercano</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Nuestro equipo te orienta antes de reservar y durante la planeación,
            resolviendo tus dudas sobre fechas, servicios y tarifas.
          </p>
        </article>
      </section>

      <div className="mt-10 text-center">
        <Link
          href="/contact"
          className="inline-flex rounded-full bg-brand-700 px-6 py-3 font-semibold text-white transition hover:bg-brand-900"
        >
          Platiquemos de tu próximo viaje
        </Link>
      </div>
    </main>
  </Layout>
);

export default AboutPage;
