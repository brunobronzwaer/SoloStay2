import React from "react";
import Head from "next/head";
import { Search, Calendar, Star } from "lucide-react";
import DatePicker from "react-datepicker";

// =============================
// Config
// =============================
const TP_MARKER = "669798"; // jouw Travelpayouts/Hotellook marker
const HOTELLOOK_BASE = "https://hotellook.com/"; // white label / deeplink basis

function hotellookUrl({ destination, checkIn = "", checkOut = "", adults = 1, subId = "" }) {
  const u = new URL(HOTELLOOK_BASE);
  u.searchParams.set("marker", TP_MARKER);
  if (destination) u.searchParams.set("destination", destination);
  if (checkIn) u.searchParams.set("checkIn", checkIn); // YYYY-MM-DD
  if (checkOut) u.searchParams.set("checkOut", checkOut);
  u.searchParams.set("adults", String(Math.max(1, adults || 1)));
  if (subId) u.searchParams.set("sub_id", subId);
  return u.toString();
}

function hotelPhotoUrl(hotelId) {
  return `https://photo.hotellook.com/image_v2/limit/h${hotelId}_1/800/520.auto`;
}

function formatCurrency(n) {
  const v = Number(n);
  return Number.isFinite(v)
    ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v)
    : "€ –";
}

// =============================
// Page
// =============================
export default function Home() {
  const [q, setQ] = React.useState("");
  const [range, setRange] = React.useState([null, null]);
  const [guests, setGuests] = React.useState(1);

  const [liveCity, setLiveCity] = React.useState("");
  const [live, setLive] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const [deals, setDeals] = React.useState([]);
  const [loadingDeals, setLoadingDeals] = React.useState(false);

  const [startDate, endDate] = range;

  // ---- Fetch Live (Search bar) ----
  async function fetchLive(cityText) {
    try {
      setLoading(true);
      setLive([]);
      const ci = startDate instanceof Date ? startDate.toISOString().slice(0, 10) : "";
      const co = endDate instanceof Date ? endDate.toISOString().slice(0, 10) : "";
      const qs = new URLSearchParams({ city: cityText, checkIn: ci, checkOut: co, adults: "1", lang: "nl", limit: "60" });
      const r = await fetch(`/api/hotels?${qs.toString()}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "API error");
      const items = (data.items || [])
        .filter(h => Number.isFinite(Number(h.price)))
        .sort((a,b) => Number(a.price) - Number(b.price));
      setLiveCity(data.city || cityText);
      setLive(items);
      // scroll naar resultaten
      const el = document.getElementById("live");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      console.error(e);
      setLiveCity("");
      setLive([]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    const city = (q || "").trim();
    if (!city) return;
    fetchLive(city);
  }

  // ---- Curated Deals (Travelhunter‑style) ----
  React.useEffect(() => {
    // eenvoudige curated set: volgende vrijdag t/m zondag, 5 populaire steden
    const cities = ["Barcelona", "Sevilla", "Lissabon", "Porto", "Valencia"];
    const { checkIn, checkOut } = nextFridayWeekend();
    (async () => {
      try {
        setLoadingDeals(true);
        const out = [];
        for (const city of cities) {
          const qs = new URLSearchParams({ city, checkIn, checkOut, adults: "1", lang: "nl", limit: "60" });
          const r = await fetch(`/api/hotels?${qs.toString()}`);
          const data = await r.json();
          if (r.ok && Array.isArray(data.items)) {
            const best = data.items
              .filter(h => Number.isFinite(Number(h.price)))
              .sort((a,b) => Number(a.price) - Number(b.price))
              .slice(0, 3)
              .map(h => ({ ...h, destination: data.city, checkIn: data.checkIn, checkOut: data.checkOut }));
            out.push(...best);
          }
        }
        out.sort((a,b) => Number(a.price) - Number(b.price));
        setDeals(out);
      } catch (e) {
        console.error(e);
        setDeals([]);
      } finally {
        setLoadingDeals(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Head>
        <script src="https://cdn.tailwindcss.com" />
        <link rel="stylesheet" href="https://unpkg.com/react-datepicker/dist/react-datepicker.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SoloStay — De beste solo hoteldeals</title>
        <meta name="description" content="Curated hoteldeals voor solo reizigers. Eerlijke 1-persoonsprijzen, zonder verrassingen." />
      </Head>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 md:py-28">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white drop-shadow">
            De beste <span className="text-blue-300">solo hoteldeals</span>, elke week nieuw
          </h1>
          <p className="mt-4 max-w-2xl text-white/90 text-lg">
            Eerlijke 1-persoonsprijzen zonder gedoe. Klik door en zie direct waar je het boekt.
          </p>

          {/* Search bar (Travelhunter‑style) */}
          <form onSubmit={onSubmit} className="mt-8 bg-white/95 rounded-2xl p-3 md:p-4 shadow-xl">
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 bg-white">
                <Search className="w-5 h-5" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Waar wil jij naartoe? (bijv. Sevilla)"
                  className="w-full outline-none bg-transparent"
                  aria-label="Bestemming"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 bg-white">
                <Calendar className="w-5 h-5 text-neutral-500" />
                <DatePicker
                  selected={startDate}
                  onChange={(update) => setRange(update)}
                  startDate={startDate}
                  endDate={endDate}
                  selectsRange
                  placeholderText="Selecteer data"
                  className="outline-none bg-transparent"
                />
              </div>
              <button type="submit" className="rounded-2xl px-5 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition md:ml-auto">
                Zoek
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Curated Deals */}
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Topdeals voor solo reizigers</h2>
            <p className="text-neutral-600 mt-1">Strak geselecteerd — alleen de beste prijzen.</p>
          </div>
          <div className="text-sm text-neutral-600">{loadingDeals ? "Laden…" : `${deals.length} deals`}</div>
        </div>

        {loadingDeals ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">Deals laden…</div>
        ) : !deals.length ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">Nog geen deals. Kom snel terug!</div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((h, i) => (
              <DealCard key={`${h.id}-${i}`} h={h} />
            ))}
          </div>
        )}
      </section>

      {/* Live Search Results */}
      <section id="live" className="max-w-6xl mx-auto px-4 pt-6 pb-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Live hotels {liveCity ? `in ${liveCity}` : ""}</h2>
            <p className="text-neutral-600 mt-1">Realtime via onze partner (1 volwassene).</p>
          </div>
          <div className="text-sm text-neutral-600">{loading ? "Laden…" : `${live.length} resultaten`}</div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">Even geduld…</div>
        ) : !live.length ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">Zoek hierboven op stad en data om live prijzen te zien.</div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {live.map((h, i) => (
              <LiveCard key={`${h.id}-${i}`} h={h} labelCity={liveCity} startDate={startDate} endDate={endDate} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

// =============================
// Components
// =============================
function DealCard({ h }) {
  return (
    <article className="rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm hover:shadow-xl transition">
      <div className="aspect-[16/10] bg-neutral-100">
        <img src={hotelPhotoUrl(h.id)} alt={h.name || "Hotel"} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg">{h.name || "Hotel"}</h4>
          <div className="text-sm text-neutral-600">{Number.isFinite(h.stars) ? `${h.stars}★` : "—"}</div>
        </div>
        <div className="mt-1 text-sm text-neutral-600">{h.destination}</div>
        <div className="mt-3">
          <div className="text-xs text-neutral-500">vanaf</div>
          <div className="text-xl font-bold">
            {formatCurrency(h.price)} <span className="text-sm font-medium text-neutral-600">p.p./nacht*</span>
          </div>
        </div>
        <a
          href={hotellookUrl({ destination: h.destination, checkIn: h.checkIn, checkOut: h.checkOut, adults: 1, subId: `deal_${h.id}` })}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="inline-block mt-4 rounded-xl px-4 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Waar te boeken?
        </a>
        <div className="mt-2 text-[11px] text-neutral-500">*Indicatief. Klik om aanbieders te vergelijken.</div>
      </div>
    </article>
  );
}

function LiveCard({ h, labelCity, startDate, endDate }) {
  const ci = startDate instanceof Date ? startDate.toISOString().slice(0, 10) : "";
  const co = endDate instanceof Date ? endDate.toISOString().slice(0, 10) : "";
  return (
    <article className="rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm hover:shadow-xl transition">
      <div className="aspect-[16/10] bg-neutral-100">
        <img src={hotelPhotoUrl(h.id)} alt={h.name || "Hotel"} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg">{h.name || "Hotel"}</h4>
          <div className="text-sm text-neutral-600">{Number.isFinite(h.stars) ? `${h.stars}★` : "—"}</div>
        </div>
        <div className="mt-1 text-sm text-neutral-600">{h.city || labelCity}</div>
        <div className="mt-3">
          <div className="text-xs text-neutral-500">vanaf</div>
          <div className="text-xl font-bold">
            {formatCurrency(h.price)} <span className="text-sm font-medium text-neutral-600">p.p./nacht*</span>
          </div>
        </div>
        <a
          href={hotellookUrl({ destination: labelCity || h.city || "", checkIn: ci, checkOut: co, adults: 1, subId: `live_${h.id}` })}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="inline-block mt-4 rounded-xl px-4 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Waar te boeken?
        </a>
        <div className="mt-2 text-[11px] text-neutral-500">*Indicatief o.b.v. 1 volwassene.</div>
      </div>
    </article>
  );
}

function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-extrabold text-xl tracking-tight mb-2">
            Solo<span className="text-blue-600">Stay</span>
          </div>
          <p className="text-neutral-600">
            Curated hoteldeals voor solo reizigers. Transparant en simpel boeken via onze partner.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Navigatie</h4>
          <ul className="space-y-2">
            <li><a href="/about" className="hover:text-blue-600">Over ons</a></li>
            <li><a href="/contact" className="hover:text-blue-600">Contact</a></li>
            <li><a href="/register" className="hover:text-blue-600">Registreren</a></li>
            <li><a href="/login" className="hover:text-blue-600">Login</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <p className="text-neutral-600 mb-2">Mail ons rechtstreeks:</p>
          <p className="font-medium">
            <a href="mailto:info@solostay.nl" className="text-blue-600 hover:text-blue-700">info@solostay.nl</a>
          </p>
        </div>
      </div>
      <div className="border-t border-neutral-200 text-center text-xs text-neutral-500 py-4">
        © {new Date().getFullYear()} SoloStay. Alle rechten voorbehouden.
      </div>
    </footer>
  );
}

// =============================
// Utils
// =============================
function nextFridayWeekend() {
  const now = new Date();
  const day = now.getDay(); // 0=zo ... 5=vr
  const diffToFri = (5 - day + 7) % 7 || 7;
  const fri = new Date(now);
  fri.setDate(now.getDate() + diffToFri);
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  const toISO = (d) => d.toISOString().slice(0, 10);
  return { checkIn: toISO(fri), checkOut: toISO(sun) };
}
