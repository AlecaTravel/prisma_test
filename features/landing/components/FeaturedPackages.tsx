import { PackageCard, type FixedPackage } from './PackageCard';

const packages: FixedPackage[] = [
  {
    name: 'Costa Rica Aventurero',
    destination: 'San José · Arenal · Manuel Antonio',
    departure: '21 de febrero de 2027',
    duration: '8 días · 7 noches',
    price: '$38,559 MXN',
    priceNote: 'por persona · base doble',
    image: '/0- Costa RicaAventurero.jpeg',
  },
  {
    name: 'Costa Amalfi & Mediterráneo',
    destination: 'Salida desde Milán',
    departure: 'Noviembre de 2026',
    duration: '8 días · 7 noches',
    price: '$47,990 MXN',
    priceNote: 'por persona',
    image: '/1- Costa amalfi y mediterraneo.jpeg',
  },
  {
    name: 'The Hacienda · Día de las Madres',
    destination: 'Puerto Vallarta, Jalisco',
    departure: '8 al 11 de mayo de 2027',
    duration: '4 días · 3 noches',
    price: '$9,530 MXN',
    priceNote: 'por persona por estancia · base doble',
    image: '/DiaMadres Krystal Grand.jpeg',
  },
  {
    name: 'The Hacienda · Independencia',
    destination: 'Puerto Vallarta, Jalisco',
    departure: '14 al 17 de septiembre de 2027',
    duration: '4 días · 3 noches',
    price: '$11,698 MXN',
    priceNote: 'por persona por estancia · base doble',
    image: '/Independencia KrystalGrand.jpeg',
  },
  {
    name: 'Las Vegas',
    destination: 'Salida desde Guadalajara',
    departure: '13 de septiembre de 2027',
    duration: '5 días · 4 noches',
    price: '$19,715 MXN',
    priceNote: 'por persona · base doble',
    image: '/WhatsApp Image 2026-11-07 at 2.42.45 PM.jpeg',
  },
  {
    name: 'RIU Mazatlán · San Valentín',
    destination: 'Mazatlán, Sinaloa',
    departure: '12 al 15 de febrero de 2027',
    duration: '4 días · 3 noches',
    price: '$7,136 MXN',
    priceNote: 'por persona en base doble',
    image: '/WhatsApp Image 2026-11-07 at 2.42.45 PM (2).jpeg',
  },
];

export function FeaturedPackages() {
  return (
    <section id="paquetes" aria-labelledby="featured-packages-title" className="scroll-mt-28">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Viajes listos para disfrutar
          </p>
          <h2
            id="featured-packages-title"
            className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl"
          >
            Paquetes destacados
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-600">
          Precios publicados por persona según la base indicada en cada paquete.
          Consulta disponibilidad, restricciones y tarifas vigentes.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((travelPackage) => (
          <PackageCard key={travelPackage.name} travelPackage={travelPackage} />
        ))}
      </div>
    </section>
  );
}
