CREATE TYPE "PromoPackageCategory" AS ENUM ('AVENTURA', 'EUROPA', 'PLAYA', 'CIUDAD');

CREATE TYPE "PromoPackageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "PromoPackage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "PromoPackageCategory" NOT NULL,
    "destination" TEXT NOT NULL,
    "departure" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "priceNote" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "blobPathname" TEXT NOT NULL,
    "status" "PromoPackageStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoPackage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoPackage_slug_key" ON "PromoPackage"("slug");
CREATE INDEX "PromoPackage_status_startsAt_endsAt_idx"
    ON "PromoPackage"("status", "startsAt", "endsAt");
CREATE INDEX "PromoPackage_createdAt_idx" ON "PromoPackage"("createdAt" DESC);
