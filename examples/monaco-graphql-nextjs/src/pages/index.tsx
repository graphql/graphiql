import Head from 'next/head';
import dynamic from 'next/dynamic';

const DynamicEditor = dynamic(() => import('../editor'), {
  suspense: true,
  ssr: false,
});

export default function Home() {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DynamicEditor />
    </>
  );
}
