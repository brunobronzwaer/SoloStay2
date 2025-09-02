import React from "react";
import Head from "next/head";

// ====== CONFIG ======
const TP_MARKER = "669798"; // jouw marker
const HOTELLOOK_BASE = "https://hotellook.com/"; // white label / deeplink basis

function hotellookUrl({ destination, checkIn = "", checkOut = "", adults = 1, subId = "" }) {
  const u = new URL(HOTELLOOK_BASE);
  u.searchParams.set("marker", TP_MARKER);
  if (destination) u.searchParams.set("destination", destination);
  if (checkIn) u.searchParams.set("checkIn", checkIn);
  if (checkOut) u.searchParams.set("checkOut", checkOut);
  u.searchParams.set("adults", String(Math.max(1, adults || 1)));
  if (subId) u.searchParams.set("sub_id", subId);
  return u.toString();
}

function photoUrl(hotelId) {
  return `https://photo.hotellook.com/image_v2/limit/h${hotelId}_1/800/520.auto`;
}

function formatCurrency(n) {
  const val = Number.isFinite(Number(n)) ? Number(n) : 0;
  try {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);
  } catch {
    return `${val} €`;
  }
}

// ====== HELPERS ======
function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_CHECKIN = todayPlus(14); // over 2 weken
const DEFAULT_CHECKOUT = todayPlus(16); // 2 nachten later

// ====== PAGE ======
export default function Home() {
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [cityLabel, setCityLabel] = React.useState("");
  const [items, setItems] = React.useState([]);

  // Voorstart: curated steden (als er nog niet gezocht is)
  const curated = ["Barcelona", "Sevilla", "Lissabon", "Porto", "Valencia", "Málaga"];

  React.useEffect(() => {
    // laad meteen een lichte "curated" deals-grid (goedkoopste 1-2 per stad)
    (async () => {
      setLoading(true);
      try {
        const deals = [];
        for (const city of curated) {
          const qs = new URLSearchParams({
            city,
            checkIn: DEFAULT_CHECKIN,
            checkOut: DEFAULT_CHECKOUT,
            adults: "1",
            lang: "nl",
            limit: "60",
          });
          const r = await fetch(`/api/hotels?${qs.toString()}`);
          const data = await r.json();
          if (r.ok && Array.isArray(data.items)) {
            const cheapest = data.items
              .filter((h) => Number.isFinite(Number(h.price)))
              .sort((a, b) => Number(a.price) - Number(b.price))
              .slice(0, 2)
              .map((h) => ({
                ...h,
                destination: data.city || city,
                checkIn: data.checkIn || DEFAULT_CHECKIN,
                checkOut: data.checkOut || DEFAULT_CHECKOUT,
              }));
            deals.push(...cheapest);
          }
        }
        deals.sort((a, b) => Number(a.price) - Number(b.price));
        setItems(deals);
        setCityLabel("");
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSearch(e) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    setItems([]);
    try {
      const qs = new URLSearchParams({
        city: query,
        checkIn: DEFAULT_CHECKIN,
        checkOut: DEFAULT_CHECKOUT,
        adults: "1",
        lang: "nl",
        limit: "100",
      });
      const r = await fetch(`/api/hotels?${qs.toString()}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Zoekfout");
      const arr = Array.isArray(data.items) ? data.items : [];
      const sorted = arr
        .filter((h) => Number.isFinite(Number(h.price)))
        .sort((a, b) => Number(a.price) - Number(b.price))
        .slice(0, 12)
        .map((h) => ({
          ...h,
          destination: data.city || query,
          checkIn: data.checkIn || DEFAULT_CHECKIN,
          checkOut: data.checkOut || DEFAULT_CHECKOUT,
        }));
      setItems(sorted);
      setCityLabel(data.city || query);
    } catch (e) {
      console.error(e);
      setItems([]);
      setCityLabel("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Head>
        <script src="https://cdn.tailwindcss.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SoloStay — Beste solo hoteldeals</title>
        <meta name="description" content="Curated hoteldeals voor solo reizigers. Altijd eerlijke 1-persoonsprijzen." />
      </Head>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="font-extrabold text-xl tracking-tight">Solo<span className="text-blue-600">Stay</span></a>
          <nav className="hidden md:flex gap-6 text-sm items-center">
            <a href="#deals" className="hover:text-blue-600">Deals</a>
            <a href="#uitleg" className="hover:text-blue-600">Zo werkt het</a>
            <a href="#contact" className="hover:text-blue-600">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero met zoekveld */}
      <section className="relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1505764706515-aa95265c5abc?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white">
            De beste <span className="text-blue-300">solo</span> hoteldeals
          </h1>
          <p className="mt-4 text-white/90 text-lg">Eerlijke 1‑persoonsprijzen — geen verborgen toeslagen.</p>

          <form onSubmit={onSearch} className="mt-8 bg-white/95 rounded-2xl p-3 md:p-4 shadow-xl">
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Waar wil jij naartoe?"
                className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 bg-white outline-none"
                aria-label="Bestemming"
              />
              <button
                type="submit"
                className="rounded-2xl px-6 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition md:ml-auto"
              >
                Zoek deals
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Deals */}
      <section id="deals" className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{cityLabel ? `Topdeals in ${cityLabel}` : "Topdeals voor jou"}</h2>
            <p className="text-neutral-600 mt-1">We tonen alleen de scherpste opties. Klik en bekijk waar te boeken.</p>
          </div>
          <div className="text-sm text-neutral-600">{loading ? "Laden…" : `${items.length} resultaten`}</div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">Deals laden…</div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">Nog geen deals gevonden. Probeer een andere bestemming.</div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((h, i) => (
              <article key={`${h.id}-${i}`} className="rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm hover:shadow-xl transition">
                <div className="aspect-[16/10] bg-neutral-100">
                  <img src={photoUrl(h.id)} alt={h.name || "Hotel"} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg line-clamp-1">{h.name || "Hotel"}</h4>
                    <div className="text-sm text-neutral-600">{Number.isFinite(h.stars) ? `${h.stars}★` : "—"}</div>
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">{h.destination || h.city}</div>
                  <div className="mt-3">
                    <div className="text-xs text-neutral-500">vanaf</div>
                    <div className="text-xl font-bold">{formatCurrency(h.price)} <span className="text-sm font-medium text-neutral-600">p.p./nacht*</span></div>
                  </div>
                  <a
                    href={hotellookUrl({ destination: h.destination || h.city, checkIn: h.checkIn || DEFAULT_CHECKIN, checkOut: h.checkOut || DEFAULT_CHECKOUT, adults: 1 })}
                    target="_blank"
                    rel="nofollow sponsored noopener"
                    className="inline-block mt-4 rounded-xl px-4 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                    title="Waar te boeken?"
                  >
                    Waar te boeken?
                  </a>
                  <div className="mt-2 text-[11px] text-neutral-500">*Indicatief o.b.v. 1 volwassene. Je boekt veilig via onze partner.</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Uitleg */}
      <section id="uitleg" className="max-w-5xl mx-auto px-4 pb-16">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8">
          <h3 className="text-xl font-bold">Zo werkt SoloStay</h3>
          <ol className="mt-4 list-decimal pl-6 space-y-2 text-neutral-700">
            <li>Wij tonen alleen de scherpste deals voor 1 persoon.</li>
            <li>Je klikt op "Waar te boeken?" en ziet alle aanbieders met live prijzen.</li>
            <li>Je boekt bij de aanbieder met de beste prijs. Simpel en transparant.</li>
          </ol>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="font-extrabold text-xl tracking-tight mb-2">Solo<span className="text-blue-600">Stay</span></div>
            <p className="text-neutral-600">Curated solo hoteldeals. Geen verborgen toeslagen — reizen op jouw manier.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Navigatie</h4>
            <ul className="space-y-2">
              <li><a href="#deals" className="hover:text-blue-600">Deals</a></li>
              <li><a href="#uitleg" className="hover:text-blue-600">Zo werkt het</a></li>
              <li><a href="mailto:info@solostay.nl" className="hover:text-blue-600">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Nieuwsbrief</h4>
            <p className="text-neutral-600">Ontvang 1x per week de beste solo-deals.</p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-3 flex gap-2">
              <input type="email" placeholder="jij@voorbeeld.nl" className="flex-1 rounded-xl border border-neutral-200 px-3 py-2" />
              <button className="rounded-xl px-4 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Aanmelden</button>
            </form>
          </div>
        </div>
        <div className="border-t border-neutral-200 text-center text-xs text-neutral-500 py-4">© {new Date().getFullYear()} SoloStay. Alle rechten voorbehouden.</div>
      </footer>
    </div>
  );
}
