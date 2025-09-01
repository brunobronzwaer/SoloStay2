import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="nl">
      <Head>
        {/* Travelpayouts tracking script */}
        <script
          data-noptimize="1"
          data-cfasync="false"
          data-wpfc-render="false"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var script = document.createElement("script");
                script.async = 1;
                script.src = 'https://tpembars.com/NDU1MjY5.js?t=455269';
                document.head.appendChild(script);
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
