import Head from 'next/head';
import dynamic from 'next/dynamic';

const DynamicEditor = dynamic(() => import('../editor'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>Monaco Next.js Example</title>
        <meta name="description" content="Monaco Next.js Example" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DynamicEditor />
    </>
  );
}
