import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/client';
import { featuredPackages } from '../features/landing/data/featured-packages';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function packageCategory(category: string) {
  switch (category) {
    case 'Aventura':
      return 'AVENTURA' as const;
    case 'Europa':
      return 'EUROPA' as const;
    case 'Ciudad':
      return 'CIUDAD' as const;
    default:
      return 'PLAYA' as const;
  }
}

async function main() {
  const importedAt = Date.now();
  const result = await prisma.promoPackage.createMany({
    data: featuredPackages.map((travelPackage, index) => {
      const { slug, name, category, destination, departure, duration, priceAmount, currency, priceNote, image } =
        travelPackage;
      const createdAt = new Date(importedAt - index * 1_000);
      return {
        slug,
        title: name,
        category: packageCategory(category),
        destination,
        departure,
        duration,
        price: priceAmount,
        currency,
        priceNote,
        description: '',
        imageUrl: image,
        blobPathname: null,
        status: 'PUBLISHED' as const,
        createdAt,
        updatedAt: createdAt,
      };
    }),
    skipDuplicates: true,
  });

  console.info(`Paquetes importados: ${result.count}. Los registros existentes se conservaron.`);
}

main()
  .catch((error: unknown) => {
    console.error('No se pudieron importar los paquetes publicados.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
