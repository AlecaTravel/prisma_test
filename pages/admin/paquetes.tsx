import { useState, type FormEvent } from 'react';
import type { GetServerSideProps } from 'next';
import type { Session } from 'next-auth';
import Image from 'next/image';
import Head from 'next/head';
import { upload } from '@vercel/blob/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { AdminLayout } from '../../features/auth/AdminLayout';
import { roleRedirect } from '../../features/auth/roleRedirect';
import { graphql } from '../../gql';
import { auth } from '../../server/auth';

const CATEGORIES = ['AVENTURA', 'EUROPA', 'PLAYA', 'CIUDAD'] as const;
const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  AVENTURA: 'Aventura',
  EUROPA: 'Europa',
  PLAYA: 'Playa',
  CIUDAD: 'Ciudad',
};
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ADMIN_PROMO_PACKAGES_QUERY = graphql(`
  query AdminPromoPackages {
    adminPromoPackages {
      id
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
      status
      startsAt
      endsAt
      createdAt
    }
  }
`);

const CREATE_PROMO_PACKAGE = graphql(`
  mutation CreatePromoPackage(
    $title: String!
    $category: PromoPackageCategory!
    $destination: String!
    $departure: String!
    $duration: String!
    $price: String!
    $currency: String!
    $priceNote: String!
    $description: String!
    $imageUrl: String!
    $blobPathname: String!
    $status: PromoPackageStatus
    $startsAt: DateTime
    $endsAt: DateTime
  ) {
    createPromoPackage(
      title: $title
      category: $category
      destination: $destination
      departure: $departure
      duration: $duration
      price: $price
      currency: $currency
      priceNote: $priceNote
      description: $description
      imageUrl: $imageUrl
      blobPathname: $blobPathname
      status: $status
      startsAt: $startsAt
      endsAt: $endsAt
    ) {
      id
      title
      status
    }
  }
`);

const SET_PROMO_PACKAGE_STATUS = graphql(`
  mutation SetPromoPackageStatus($id: String!, $status: PromoPackageStatus!) {
    setPromoPackageStatus(id: $id, status: $status) {
      id
      status
    }
  }
`);

function packageStatusLabel(status: string) {
  if (status === 'PUBLISHED') return 'Publicado';
  if (status === 'ARCHIVED') return 'Archivado';
  return 'Borrador';
}

function nextStatus(status: string) {
  if (status === 'PUBLISHED') return 'ARCHIVED' as const;
  return 'PUBLISHED' as const;
}

function dateInputToIso(value: FormDataEntryValue | null, endOfDay = false) {
  if (typeof value !== 'string' || !value) return null;
  return new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`).toISOString();
}

export default function AdminPromoPackagesPage({
  blobConfigured,
}: {
  blobConfigured: boolean;
}) {
  const { data, loading, error } = useQuery(ADMIN_PROMO_PACKAGES_QUERY, {
    fetchPolicy: 'cache-and-network',
  });
  const [createPackage, { loading: creating }] = useMutation(CREATE_PROMO_PACKAGE);
  const [updateStatus, { loading: changingStatus }] = useMutation(SET_PROMO_PACKAGE_STATUS);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formNotice, setFormNotice] = useState('');
  const [statusError, setStatusError] = useState('');
  const [uploading, setUploading] = useState(false);
  const packages = data?.adminPromoPackages ?? [];

  const handleImageChange = (file: File | null) => {
    setSelectedImage(file);
    setImagePreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFormNotice('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const image = selectedImage;

    if (!blobConfigured) {
      setFormError('La carga de flyers no está configurada todavía. Los paquetes existentes siguen disponibles.');
      return;
    }
    if (!image) {
      setFormError('Selecciona el flyer o imagen del paquete.');
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
      setFormError('Usa una imagen JPG, PNG o WebP.');
      return;
    }
    if (image.size > MAX_IMAGE_SIZE) {
      setFormError('La imagen debe pesar 8 MB o menos.');
      return;
    }

    setUploading(true);
    try {
      const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const blob = await upload(
        `combo-flyers/${crypto.randomUUID()}-${safeName}`,
        image,
        {
          access: 'private',
          handleUploadUrl: '/api/admin/promo-package-image',
        },
      );

      const rawPrice = String(form.get('price') ?? '').trim();
      const status = String(form.get('status') ?? 'DRAFT');
      await createPackage({
        variables: {
          title: String(form.get('title') ?? '').trim(),
          category: String(form.get('category') ?? 'PLAYA') as (typeof CATEGORIES)[number],
          destination: String(form.get('destination') ?? '').trim(),
          departure: String(form.get('departure') ?? '').trim(),
          duration: String(form.get('duration') ?? '').trim(),
          price: rawPrice,
          currency: String(form.get('currency') ?? 'MXN').trim().toUpperCase(),
          priceNote: String(form.get('priceNote') ?? '').trim(),
          description: String(form.get('description') ?? '').trim(),
          imageUrl: blob.url,
          blobPathname: blob.pathname,
          status: status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
          startsAt: dateInputToIso(form.get('startsAt')),
          endsAt: dateInputToIso(form.get('endsAt'), true),
        },
        refetchQueries: [{ query: ADMIN_PROMO_PACKAGES_QUERY }],
        awaitRefetchQueries: true,
      });

      formElement.reset();
      handleImageChange(null);
      setFormNotice('El paquete se guardó correctamente.');
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo guardar el paquete. Inténtalo de nuevo.',
      );
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (id: string, currentStatus: string) => {
    setStatusError('');
    try {
      await updateStatus({
        variables: { id, status: nextStatus(currentStatus) },
        refetchQueries: [{ query: ADMIN_PROMO_PACKAGES_QUERY }],
        awaitRefetchQueries: true,
      });
    } catch (cause) {
      setStatusError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo actualizar el estado del paquete.',
      );
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Paquetes — Administración | Aleca Travel</title>
      </Head>
      <section className="space-y-6">
        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-sky-700">Contenido</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Paquetes promocionales</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Registra la información del paquete y su flyer. Los borradores solo son visibles
            para el equipo; los paquetes publicados aparecen en la página principal.
          </p>
        </header>

        <form
          onSubmit={(event) => void handleCreate(event)}
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-6 lg:grid-cols-3"
          aria-label="Registrar paquete"
        >
          <h3 className="text-lg font-semibold text-slate-900 sm:col-span-2 lg:col-span-3">
            Registrar un paquete
          </h3>
          {!blobConfigured && (
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-2 lg:col-span-3">
              La carga de flyers todavía no está configurada. Puedes consultar los paquetes existentes; para publicar uno nuevo, primero configura Vercel Blob.
            </p>
          )}
          <label className="text-sm font-medium text-slate-700">
            Nombre del paquete
            <input name="title" required maxLength={120} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Categoría
            <select name="category" defaultValue="PLAYA" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3">
              {CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Destino
            <input name="destination" required maxLength={160} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Fecha o temporada
            <input name="departure" required maxLength={120} placeholder="Ej. Semana Santa 2027" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Duración
            <input name="duration" required maxLength={80} placeholder="Ej. 4 días · 3 noches" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
            <label className="text-sm font-medium text-slate-700">
              Precio
              <input name="price" required type="number" min="0.01" max="9999999999.99" step="0.01" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Moneda
              <input name="currency" required minLength={3} maxLength={3} defaultValue="MXN" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 uppercase" />
            </label>
          </div>
          <label className="text-sm font-medium text-slate-700">
            Nota del precio
            <input name="priceNote" required maxLength={160} placeholder="Ej. por persona · base doble" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Visible desde (opcional)
            <input name="startsAt" type="date" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Vigente hasta (opcional)
            <input name="endsAt" type="date" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
            Descripción
            <textarea name="description" required maxLength={2000} rows={4} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_12rem] lg:col-span-3">
            <label className="text-sm font-medium text-slate-700">
              Flyer o imagen (JPG, PNG o WebP; máximo 8 MB)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                disabled={!blobConfigured}
                onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)}
                className="mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:font-semibold file:text-sky-800"
              />
            </label>
            {imagePreview && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-sky-100 bg-sky-50">
                <Image src={imagePreview} alt="Vista previa del flyer seleccionado" fill unoptimized sizes="192px" className="object-contain" />
              </div>
            )}
          </div>
          <label className="text-sm font-medium text-slate-700">
            Al guardar
            <select name="status" defaultValue="DRAFT" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3">
              <option value="DRAFT">Guardar como borrador</option>
              <option value="PUBLISHED">Publicar en la página</option>
            </select>
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-2">
            <button type="submit" disabled={!blobConfigured || creating || uploading} className="min-h-11 w-full rounded-lg bg-sky-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-800 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
              {uploading ? 'Subiendo flyer…' : creating ? 'Guardando paquete…' : 'Guardar paquete'}
            </button>
          </div>
          {formError && <p role="alert" className="text-sm text-red-700 sm:col-span-2 lg:col-span-3">{formError}</p>}
          {formNotice && <p role="status" className="text-sm text-emerald-800 sm:col-span-2 lg:col-span-3">{formNotice}</p>}
        </form>

        <section aria-labelledby="promo-package-list-heading" className="space-y-4">
          <div>
            <h3 id="promo-package-list-heading" className="text-lg font-semibold text-slate-900">Paquetes registrados</h3>
            <p className="text-sm text-slate-600">Máximo 100 paquetes recientes en esta vista.</p>
          </div>
          {loading && <p role="status" className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Cargando paquetes…</p>}
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">No se pudieron cargar los paquetes.</p>}
          {statusError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{statusError}</p>}
          {!loading && !error && packages.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
              Aún no hay paquetes registrados. Puedes guardar uno como borrador antes de publicarlo.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {packages.map((travelPackage) => (
              <article key={travelPackage.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[4/3] bg-slate-100">
                  <Image src={travelPackage.imageUrl} alt={`Flyer de ${travelPackage.title}`} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" />
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{CATEGORY_LABELS[travelPackage.category]}</p>
                      <h4 className="mt-1 break-words font-semibold text-slate-900">{travelPackage.title}</h4>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{packageStatusLabel(travelPackage.status)}</span>
                  </div>
                  <p className="text-sm text-slate-600">{travelPackage.destination} · {travelPackage.departure}</p>
                  <p className="line-clamp-3 text-sm leading-6 text-slate-600">{travelPackage.description}</p>
                  <p className="text-lg font-bold text-sky-950">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: travelPackage.currency }).format(Number(travelPackage.price))}
                    <span className="ml-1 text-xs font-normal text-slate-500">{travelPackage.priceNote}</span>
                  </p>
                  <button
                    type="button"
                    disabled={changingStatus}
                    onClick={() => void handleStatusChange(travelPackage.id, travelPackage.status)}
                    className="min-h-10 rounded-lg border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-800 transition-colors hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:opacity-50"
                  >
                    {travelPackage.status === 'PUBLISHED' ? 'Archivar paquete' : 'Publicar en la página'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<{
  session: Session;
  blobConfigured: boolean;
}> = async (context) => {
  const session = await auth(context);
  if (!session) {
    return {
      redirect: {
        destination: `/login?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }
  const redirect = roleRedirect(session.user, ['ADMIN', 'AGENT']);
  if (redirect) return { redirect: { destination: redirect, permanent: false } };
  return {
    props: {
      session,
      blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
    },
  };
};
