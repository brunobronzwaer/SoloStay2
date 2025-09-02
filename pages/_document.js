// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="nl">
      <Head />
      <body>
        <Main />
        <NextScript />

        {/* TradeTracker PageTools / SuperTag - vóór </body> */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var _TradeTrackerTagOptions = {
                t: 'a',
                s: '494921',
                chk: '347bee0680b2765249798e06b756ae23e',
                overrideOptions: {}
              };
              (function() {
                var tt = document.createElement('script'),
                    s = document.getElementsByTagName('script')[0];
                tt.setAttribute('type', 'text/javascript');
                tt.setAttribute('src',
                  (document.location.protocol === 'https' ? 'https' : 'http') +
                  '://tm.tradetracker.net/tag?t=' + _TradeTrackerTagOptions.t +
                  '&s=' + _TradeTrackerTagOptions.s +
                  '&chk=' + _TradeTrackerTagOptions.chk);
                s.parentNode.insertBefore(tt, s);
              })();
            `,
          }}
        />
      </body>
    </Html>
  );
}
