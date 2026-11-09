import { ApolloClient, InMemoryCache } from '@apollo/client';
import { SchemaLink } from '@apollo/client/link/schema';
import Head from 'next/head';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import { FeaturedDestinations } from '../features/landing/components/FeaturedDestinations';
import { FeaturedPackages } from '../features/landing/components/FeaturedPackages';
import { Hero } from '../features/landing/components/Hero';
import { PopularHotels } from '../features/landing/components/PopularHotels';
import { graphql } from '../gql';
import { prisma } from '../lib/prisma';
import { schema } from '../server/schema';

const LANDING_CONTENT_QUERY = graphql(`
  query LandingContent {
    destinations(featuredOnly: true, take: 6) {
      id
      slug
      name
      countryCode
      imageUrl
      popularityScore
    }
    hotels(first: 12, sort: POPULAR) {
      edges {
        node {
          id
          slug
          title
          categoryStars
          ratingAvg
          reviewCount
          priceFrom
          priceCurrency
          mainImageUrl
          destination {
            name
            code
          }
        }
      }
    }
  }
`);

const LandingPage = ({
  destinations,
  hotels,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => (
  <Layout>
    <Head>
      <title>Aleca Travel | Encuentra tu próximo viaje</title>
      <meta
        name="description"
        content="Descubre destinos destacados y encuentra hoteles para planear tu próximo viaje."
      />
    </Head>
    <main className="mx-auto max-w-7xl space-y-20 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Hero />
      <FeaturedPackages />
      <div id="destinos" className="scroll-mt-28">
        <FeaturedDestinations destinations={destinations} />
      </div>
      <div id="hoteles" className="scroll-mt-28">
        <PopularHotels hotels={hotels} />
      </div>
      <section className="brand-gradient rounded-3xl px-6 py-12 text-center text-white shadow-xl shadow-sky-950/10 sm:px-12">
        <h2 className="text-2xl font-bold sm:text-3xl">
          ¿Te ayudamos a elegir tu próximo viaje?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-brand-50">
          Cuéntanos qué tienes en mente y nuestro equipo te acompaña a encontrar
          la opción ideal.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex rounded-lg bg-white px-5 py-3 font-semibold text-brand-900 transition hover:bg-brand-50"
        >
          Contáctanos
        </Link>
      </section>
    </main>
  </Layout>
);

export const getServerSideProps: GetServerSideProps = async () => {
  const client = new ApolloClient({
    ssrMode: true,
    link: new SchemaLink({
      schema,
      context: {
        prisma,
        user: null,
        anonymousId: null,
      },
    }),
    cache: new InMemoryCache(),
  });

  try {
    const { data } = await client.query({ query: LANDING_CONTENT_QUERY });
    if (!data) throw new Error('La consulta GraphQL de la landing no devolvió datos.');
    return {
      props: {
        destinations: data.destinations,
        hotels: data.hotels.edges.map(({ node }) => node),
      },
    };
  } finally {
    await client.stop();
  }
};

export default LandingPage;
