import { FormEvent, useEffect, useState } from 'react';
import Head from 'next/head';

export default function AboutPage() {
    return (<>
        <Head>Quienes Somos</Head>
        <main className="mx-auto max-w-3xl p-6 space-y-6">
            <p> Aleca Travel </p>
            <p> Somos una agencia de viajes dedicada a ofrecer experiencias únicas y personalizadas. </p>
            
        </main>
    </>);
}