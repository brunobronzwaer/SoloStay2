// pages/_app.js
import Head from "next/head";
import Script from "next/script";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>{/* plek voor meta-tags etc. */}</Head>

      {/* Laad Travelpayouts JS-bestand direct */}
      <Script
        src="https://tpembars.com/NDU1MjY5.js?t=455269"
        strategy="afterInteractive"
        data-noptimize="1"
        data-cfasync="false"
        data-wpfc-render="false"
      />

      <Component {...pageProps} />
    </>
  );
}
