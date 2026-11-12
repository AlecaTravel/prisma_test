import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { PackageCard, type FixedPackage } from './PackageCard';
import { featuredPackages } from '../data/featured-packages';
import { graphql } from '../../../gql';

type PackageCategory = 'Aventura' | 'Europa' | 'Playa' | 'Ciudad';
type PackageFilter = 'Todos' | PackageCategory;

const PUBLISHED_PROMO_PACKAGES_QUERY = graphql(`
  query PublishedPromoPackages {
    publishedPromoPackages {
      id
      slug
      title
      category
      destination
      departure
      duration
      price
      currency
      priceNote
      description
      imageUrl
    }
  }
`);

function packageCategory(category: string): FixedPackage['category'] {
  switch (category) {
    case 'AVENTURA':
      return 'Aventura';
    case 'EUROPA':
      return 'Europa';
    case 'CIUDAD':
      return 'Ciudad';
    default:
      return 'Playa';
  }
}

export function FeaturedPackages() {
  const [filter, setFilter] = useState<PackageFilter>('Todos');
  const { data: promoData, error } = useQuery(PUBLISHED_PROMO_PACKAGES_QUERY, {
    fetchPolicy: 'cache-and-network',
  });
  const publishedPackages: FixedPackage[] = (promoData?.publishedPromoPackages ?? []).map(
    (travelPackage) => ({
      id: travelPackage.slug,
      name: travelPackage.title,
      category: packageCategory(travelPackage.category),
      destination: travelPackage.destination,
      departure: travelPackage.departure,
      duration: travelPackage.duration,
      price: new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: travelPackage.currency,
      }).format(Number(travelPackage.price)),
      priceNote: travelPackage.priceNote,
      image: travelPackage.imageUrl,
      description: travelPackage.description,
    }),
  );
  const publishedSlugs = new Set(publishedPackages.map((travelPackage) => travelPackage.id));
  const packages = [
    ...publishedPackages,
    ...featuredPackages.filter((travelPackage) => !publishedSlugs.has(travelPackage.slug)),
  ];
  const visiblePackages = packages.filter(
    (travelPackage) => filter === 'Todos' || travelPackage.category === filter,
  );
  const filters: PackageFilter[] = ['Todos', 'Aventura', 'Europa', 'Playa', 'Ciudad'];

  return (
    <section id="paquetes" aria-labelledby="featured-packages-title" className="scroll-mt-24 sm:scroll-mt-28">
      <div className="mb-6 grid gap-3 sm:mb-7 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-6">
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
        <p className="max-w-md text-sm leading-6 text-slate-600 sm:justify-self-end">
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
              className={`min-h-10 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 motion-reduce:transition-none ${
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
      <div className="grid items-stretch gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-6">
        {visiblePackages.map((travelPackage) => (
          <PackageCard key={travelPackage.id ?? travelPackage.name} travelPackage={travelPackage} />
        ))}
      </div>
      {error && (
        <p role="status" className="mt-4 text-sm text-slate-600">
          No se pudieron actualizar los paquetes recientes. Los paquetes destacados siguen disponibles.
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {visiblePackages.length} paquetes disponibles en esta categoría.
      </p>
    </section>
  );
}
