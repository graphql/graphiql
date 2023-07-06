import type { AppProps } from 'next/app';
import '../style.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
