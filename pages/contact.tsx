import Head from 'next/head';
import Layout from '../components/layout/Layout';

const ContactPage = () => (
  <Layout>
    <Head>
      <title>Contáctanos | Aleca Travel</title>
      <meta
        name="description"
        content="Contacta a Aleca Travel por WhatsApp, teléfono, correo o visítanos en Guadalajara."
      />
    </Head>
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
      <section className="hero-organic rounded-[2rem] px-6 py-12 text-white shadow-xl shadow-sky-950/10 sm:px-12 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">
          Contáctanos
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          ¿A dónde te gustaría ir?
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-sky-50/90">
          Escríbenos y te ayudamos a resolver tus dudas sobre paquetes, fechas y
          opciones para tu viaje.
        </p>
      </section>

      <section aria-label="Información de contacto" className="mt-8 grid gap-5 sm:grid-cols-2">
        <a
          href="https://wa.me/523313353452?text=Hola%2C%20me%20gustar%C3%ADa%20recibir%20informaci%C3%B3n%20sobre%20sus%20viajes."
          target="_blank"
          rel="noreferrer"
          className="rounded-3xl border border-sky-100 bg-white/90 p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">WhatsApp</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">33 1335 3452</h2>
          <p className="mt-2 text-slate-600">Escríbenos para cotizar tu viaje →</p>
        </a>
        <a
          href="tel:+523313353452"
          className="rounded-3xl border border-sky-100 bg-white/90 p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Teléfono</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">+52 33 1335 3452</h2>
          <p className="mt-2 text-slate-600">Llámanos para recibir atención personalizada →</p>
        </a>
        <a
          href="mailto:alecago.aventuras@gmail.com"
          className="rounded-3xl border border-sky-100 bg-white/90 p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Correo</p>
          <h2 className="mt-2 break-all text-xl font-semibold text-slate-950">
            alecago.aventuras@gmail.com
          </h2>
          <p className="mt-2 text-slate-600">Cuéntanos qué viaje tienes en mente →</p>
        </a>
        <address className="rounded-3xl border border-sky-100 bg-white/90 p-7 not-italic shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Visítanos</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Guadalajara, Jalisco</h2>
          <p className="mt-2 leading-6 text-slate-600">
            Av. Rosario Castellanos 2293, Col. Jardines de la Cruz
          </p>
        </address>
      </section>
    </main>
  </Layout>
);

export default ContactPage;
