import React from "react";
import Head from "next/head";
import Script from "next/script";
import { Search, CalendarDays, UtensilsCrossed, Star, ArrowRight } from "lucide-react";

// ====== CONFIG ======
const TP_MARKER = "669798";
// Vervang dit later door jouw eigen white-label domein (bijv. https://hotels.solostay.nl/)
const WL_BASE = "https://hotellook.com/";
const MAX_PRICE = 220; // cap per nacht in euro
const HERO_IMG =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2000&auto=format&fit=crop";

function wlUrl({ destination, checkIn = "", checkOut = "", adults = 1, subId = "" }) {
  const u = new URL(WL_BASE);
  u.searchParams.set("marker", TP_MARKER);
  if (destination) u.searchParams.set("destination", destination);
  if (checkIn) u.searchParams.set("checkIn", checkIn);
  if (checkOut) u.searchParams.set("checkOut", checkOut);
  u.searchParams.set("adults", String(Math.max(1, adults || 1)));
  if (subId) u.searchParams.set("sub_id", subId);
  return u.toString();
}

const photoUrl = (id) =>
  `https://photo.hotellook.com/image_v2/limit/h${id}_1/900/600.auto`;
const euro = (n) =>
  Number.isFinite(+n)
    ? new Intl.NumberFormat("nl-NL", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(+n)
    : "€ –";

export default function Home() {
  const [q, setQ] = React.useState("");
  const [deals, setDeals] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  async function safeFetchJson(url, signal) {
    const r = await fetch(url, { signal, headers: { Accept: "application/json" } });
    const data = await r.json().catch(() => null);
    if (!r.ok || !data) throw new Error(data?.error || "API error");
    return data;
  }

  function badgeNights(checkIn, checkOut) {
    if (!checkIn || !checkOut) return null;
    const a = new Date(checkIn),
      b = new Date(checkOut);
    const nights = Math.max(1, Math.round((b - a) / 86400000));
    return `${nights} ${nights === 1 ? "nacht" : "nachten"}`;
  }

  React.useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const cities = ["Barcelona", "Sevilla", "Lissabon", "Porto", "Valencia"];
        const { checkIn, checkOut } = nextFridayWeekend();
        const all = [];
        for (const city of cities) {
          const qs = new URLSearchParams({
            city,
            checkIn,
            checkOut,
            adults: "1",
            lang: "nl",
            limit: "100",
          });
          try {
            const data = await safeFetchJson(`/api/hotels?${qs}`, ac.signal);
            const cleaned = (data.items || [])
              .filter((h) => Number.isFinite(+h.price))
              .filter((h) => +h.price <= MAX_PRICE)
              .map((h) => ({
                ...h,
                destination: data.city,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
              }))
              .sort((a, b) => +a.price - +b.price)
              .slice(0, 4);
            all.push(...cleaned);
          } catch {
            /* skip city */
          }
        }
        all.sort((a, b) => +a.price - +b.price);
        setDeals(all.slice(0, 12));
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const city = (q || "").trim();
    if (!city) return;
    const ac = new AbortController();
    try {
      setLoading(true);
      const { checkIn, checkOut } = nextFridayWeekend();
      const qs = new URLSearchParams({
        city,
        checkIn,
        checkOut,
        adults: "1",
        lang: "nl",
        limit: "100",
      });
      const data = await safeFetchJson(`/api/hotels?${qs}`, ac.signal);
      const items = (data.items || [])
        .filter((h) => Number.isFinite(+h.price))
        .filter((h) => +h.price <= MAX_PRICE)
        .sort((a, b) => +a.price - +b.price)
        .slice(0, 12)
        .map((h) => ({
          ...h,
          destination: data.city,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
        }));
      setDeals(items);
      const el = document.getElementById("deals");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-neutral-900">
      <Head>
        <script src="https://cdn.tailwindcss.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SoloStay — Elke dag de beste solo-hoteldeals</title>
        <meta
          name="description"
          content="Elke dag de beste hoteldeals voor solo reizigers. Alleen de koopjes — snel en simpel boeken."
        />
      </Head>

      {/* TradeTracker SuperTag */}
      <Script
        id="tradetracker-supertag"
        strategy="afterInteractive"
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

      {/* HERO */}
      <section
        className="relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.25)), url('${HERO_IMG}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 text-center">
          <h1 className="text-white text-4xl md:text-6xl font-extrabold leading-tight drop-shadow-sm">
            Elke dag de beste <span className="text-rose-300">solo-hoteldeals</span>
          </h1>
          <p className="mt-3 text-white/90 text-lg">
            We tonen alleen de scherpste prijzen. Rood ={" "}
            <span className="font-semibold">korting</span>.
          </p>

          <form onSubmit={onSubmit} className="mt-8 max-w-2xl mx-auto">
            <div className="flex items-stretch rounded-full overflow-hidden bg-white shadow-lg ring-1 ring-black/5">
              <div className="px-4 py-3 flex items-center gap-2 flex-1">
                <Search className="w-5 h-5 text-neutral-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Waar wil jij naartoe?"
                  className="w-full outline-none bg-transparent"
                  aria-label="Bestemming"
                />
              </div>
              <button
                type="submit"
                className="px-6 md:px-8 bg-rose-600 text-white font-semibold hover:bg-rose-700 transition"
              >
                Zoek deals
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* AANBIEDINGEN */}
      <section id="deals" className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold">Aanbiedingen</h2>
          <div className="text-sm text-neutral-600">
            {loading ? "Laden…" : `${deals.length} deals`}
          </div>
        </div>

        {loading ? (
          <ShimmerGrid />
        ) : !deals.length ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            Geen deals gevonden. Probeer een andere bestemming of kom later terug.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deals.map((h, i) => (
              <DealCard
                key={`${h.id}-${i}`}
                h={h}
                nightsText={badgeNights(h.checkIn, h.checkOut)}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function DealCard({ h, nightsText }) {
  const href = wlUrl({
    destination: h.destination,
    checkIn: h.checkIn,
    checkOut: h.checkOut,
    adults: 1,
    subId: `deal_${h.id}`,
  });

  return (
    <article className="relative rounded-3xl overflow-hidden bg-white border border-neutral-100 shadow-md hover:shadow-xl transition">
      <div className="absolute left-0 top-4 z-10">
        <div className="bg-rose-600 text-white text-sm font-bold px-3 py-1 rounded-r-full shadow">
          vanaf {euro(h.price)}
        </div>
      </div>

      <div className="aspect-[16/10] bg-neutral-100">
        <img
          src={photoUrl(h.id)}
          alt={h.name || "Hotel"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-lg leading-snug line-clamp-2">
            {h.name || "Hotel"}
          </h3>
          <div className="shrink-0">
            <Stars stars={h.stars} />
          </div>
        </div>

        <div className="mt-1 text-sm text-neutral-600">{h.destination}</div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-700">
          {nightsText && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-4 h-4 text-rose-600" />
              {nightsText}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <UtensilsCrossed className="w-4 h-4 text-rose-600" />
            Logies
          </span>
        </div>

        <a
          href={href}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="mt-4 inline-flex items-center justify-center gap-2 w-full rounded-full px-5 py-2.5 bg-rose-600 text-white font-semibold shadow-sm hover:bg-rose-700 transition"
        >
          Bekijk aanbieding <ArrowRight className="w-4 h-4" />
        </a>

        <div className="mt-2 text-[11px] text-neutral-500">
          *Indicatief. Klik om aanbieders te vergelijken (via partner).
        </div>
      </div>
    </article>
  );
}

function Stars({ stars }) {
  const s = Number(stars);
  if (!Number.isFinite(s) || s <= 0) return null;
  return (
    <div className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: Math.min(5, Math.round(s)) }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-current" />
      ))}
    </div>
  );
}

function ShimmerGrid() {
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl overflow-hidden bg-white border border-neutral-100 shadow-md"
        >
          <div className="aspect-[16/10] bg-neutral-200 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-neutral-200 rounded-md animate-pulse" />
            <div className="h-4 w-1/2 bg-neutral-200 rounded-md animate-pulse" />
            <div className="h-10 bg-neutral-200 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-extrabold text-xl tracking-tight mb-2">
            Solo<span className="text-rose-600">Stay</span>
          </div>
          <p className="text-neutral-600">
            Curated hoteldeals voor solo reizigers. Transparant en simpel boeken
            via onze partner.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Navigatie</h4>
          <ul className="space-y-2">
            <li>
              <a href="/about" className="hover:text-rose-600">
                Over ons
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-rose-600">
                Contact
              </a>
            </li>
            <li>
              <a href="/register" className="hover:text-rose-600">
                Registreren
              </a>
            </li>
            <li>
              <a href="/login" className="hover:text-rose-600">
                Login
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <p className="text-neutral-600 mb-2">Mail ons rechtstreeks:</p>
          <p className="font-medium">
            <a
              href="mailto:info@solostay.nl"
              className="text-rose-700 hover:text-rose-800"
            >
              info@solostay.nl
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-neutral-200 text-center text-xs text-neutral-500 py-4">
        © {new Date().getFullYear()} SoloStay. Alle rechten voorbehouden.
      </div>
    </footer>
  );
}

function nextFridayWeekend() {
  const now = new Date();
  const day = now.getDay();
  const diffToFri = (5 - day + 7) % 7 || 7;
  const fri = new Date(now);
  fri.setDate(now.getDate() + diffToFri);
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  const toISO = (d) => d.toISOString().slice(0, 10);
  return { checkIn: toISO(fri), checkOut: toISO(sun) };
}
