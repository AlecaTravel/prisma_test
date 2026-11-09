import { useMemo } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';
import { createApolloClient } from "../lib/apollo-client";
import type { AppProps } from "next/app";

import { BookingProvider } from "../features/booking/BookingContext";
import '../globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const client = useMemo(() => createApolloClient(), []);

  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="/Logo.png" />
        <meta name="theme-color" content="#164e63" />
      </Head>
      <SessionProvider session={pageProps.session}>
        <ApolloProvider client={client}>
          <BookingProvider>
            <Component {...pageProps} />
          </BookingProvider>
        </ApolloProvider>
      </SessionProvider>
    </>
  );
}

export default MyApp;
