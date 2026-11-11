import { useState } from 'react';
import { PackageCard, type FixedPackage } from './PackageCard';

type PackageCategory = 'Aventura' | 'Europa' | 'Playa' | 'Ciudad';
type PackageFilter = 'Todos' | PackageCategory;

const packages: FixedPackage[] = [
  {
    name: 'Costa Rica Aventurero',
    category: 'Aventura',
    destination: 'San José · Arenal · Manuel Antonio',
    departure: '21 de febrero de 2027',
    duration: '8 días · 7 noches',
    price: '$38,559 MXN',
    priceNote: 'por persona · base doble',
    image: '/0- Costa RicaAventurero.jpeg',
  },
  {
    name: 'Costa Amalfi & Mediterráneo',
    category: 'Europa',
    destination: 'Salida desde Milán',
    departure: 'Noviembre de 2026',
    duration: '8 días · 7 noches',
    price: '$47,990 MXN',
    priceNote: 'por persona',
    image: '/1- Costa amalfi y mediterraneo.jpeg',
  },
  {
    name: 'The Hacienda · Día de las Madres',
    category: 'Playa',
    destination: 'Puerto Vallarta, Jalisco',
    departure: '8 al 11 de mayo de 2027',
    duration: '4 días · 3 noches',
    price: '$9,530 MXN',
    priceNote: 'por persona por estancia · base doble',
    image: '/DiaMadres Krystal Grand.jpeg',
  },
  {
    name: 'The Hacienda · Independencia',
    category: 'Playa',
    destination: 'Puerto Vallarta, Jalisco',
    departure: '14 al 17 de septiembre de 2027',
    duration: '4 días · 3 noches',
    price: '$11,698 MXN',
    priceNote: 'por persona por estancia · base doble',
    image: '/Independencia KrystalGrand.jpeg',
  },
  {
    name: 'Las Vegas',
    category: 'Ciudad',
    destination: 'Salida desde Guadalajara',
    departure: '13 de septiembre de 2027',
    duration: '5 días · 4 noches',
    price: '$19,715 MXN',
    priceNote: 'por persona · base doble',
    image: '/WhatsApp Image 2026-11-07 at 2.42.45 PM.jpeg',
  },
  {
    name: 'RIU Mazatlán · San Valentín',
    category: 'Playa',
    destination: 'Mazatlán, Sinaloa',
    departure: '12 al 15 de febrero de 2027',
    duration: '4 días · 3 noches',
    price: '$7,136 MXN',
    priceNote: 'por persona en base doble',
    image: '/WhatsApp Image 2026-11-07 at 2.42.45 PM (2).jpeg',
  },
];

export function FeaturedPackages() {
  const [filter, setFilter] = useState<PackageFilter>('Todos');
  const visiblePackages = packages.filter(
    (travelPackage) => filter === 'Todos' || travelPackage.category === filter,
  );
  const filters: PackageFilter[] = ['Todos', 'Aventura', 'Europa', 'Playa', 'Ciudad'];

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
      <div
        role="group"
        aria-label="Filtrar paquetes por estilo de viaje"
        className="mb-6 flex flex-wrap gap-2"
      >
        {filters.map((category) => {
          const isSelected = filter === category;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setFilter(category)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${
                isSelected
                  ? 'border-sky-700 bg-sky-700 text-white shadow-sm shadow-sky-700/20'
                  : 'border-sky-200 bg-white/80 text-sky-800 hover:border-sky-400 hover:bg-sky-50'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePackages.map((travelPackage) => (
          <PackageCard key={travelPackage.name} travelPackage={travelPackage} />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {visiblePackages.length} paquetes disponibles en esta categoría.
      </p>
    </section>
  );
}
