import Image from 'next/image';

export interface FixedPackage {
  name: string;
  destination: string;
  departure: string;
  duration: string;
  price: string;
  priceNote: string;
  image: string;
}

interface PackageCardProps {
  travelPackage: FixedPackage;
}

function whatsappLink(packageName: string) {
  const message = `Hola, me interesa el paquete ${packageName}. ¿Me pueden compartir disponibilidad y detalles?`;
  return `https://wa.me/523313353452?text=${encodeURIComponent(message)}`;
}

export function PackageCard({ travelPackage }: PackageCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-950/10">
      <div className="relative aspect-[4/5] overflow-hidden bg-sky-50">
        <Image
          src={travelPackage.image}
          alt={`Paquete ${travelPackage.name} de Aleca Travel`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.025]"
        />
      </div>
      <div className="p-5">
        <p className="text-sm font-medium text-brand-700">{travelPackage.destination}</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-950">{travelPackage.name}</h3>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          <span>{travelPackage.departure}</span>
          <span aria-hidden="true">·</span>
          <span>{travelPackage.duration}</span>
        </div>
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-sky-100 pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Desde</p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-sky-900">
              {travelPackage.price}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{travelPackage.priceNote}</p>
          </div>
          <a
            href={whatsappLink(travelPackage.name)}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            aria-label={`Consultar por WhatsApp el paquete ${travelPackage.name}`}
          >
            Consultar
          </a>
        </div>
      </div>
    </article>
  );
}
