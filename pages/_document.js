import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="nl">
      <Head>
        {/* Travelpayouts tracking script */}
        <script
          src="https://tpembars.com/NDU1MjY5.js?t=455269"
          data-noptimize="1"
          data-cfasync="false"
          data-wpfc-render="false"
          async
        ></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
