import React from "react";
import Head from "next/head";
import { Search, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";

// =====================================
// Soft, clean, Skyscanner‑like styling
// Accent: emerald/mint, subtle pink highlights
// =====================================
const TP_MARKER = "669798";
const HOTELLOOK_BASE = "https://hotellook.com/";

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

function hotelPhotoUrl(hotelId) {
  return `https://photo.hotellook.com/image_v2/limit/h${hotelId}_1/800/520.auto`;
}

function formatCurrency(n) {
  const v = Number(n);
  return Number.isFinite(v)
    ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v)
    : "€ –";
}

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

  React.useEffect(() => {
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
    <div className="min-h-screen bg-[#F7F8FA] text-neutral-900">
      <Head>
        <script src="https://cdn.tailwindcss.com" />
        <link rel="stylesheet" href="https://unpkg.com/react-datepicker/dist/react-datepicker.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SoloStay — De beste solo hoteldeals</title>
        <meta name="description" content="Curated hoteldeals voor solo reizigers. Eerlijke 1-persoonsprijzen." />
      </Head>

      {/* Soft hero met lichte blobs */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-pink-200/50 blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-900">
            De beste solo‑hoteldeals
            <span className="block text-emerald-600">strak geselecteerd</span>
          </h1>
          <p className="mt-4 max-w-2xl text-neutral-600 text-lg">
            Vind snel je scherpste 1‑persoonsprijs. Simpel, helder en zonder gedoe.
          </p>

          {/* Search bar */}
          <form onSubmit={onSubmit} className="mt-8">
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <div className="flex-1 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                <Search className="w-5 h-5 text-neutral-500" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Waar wil jij naartoe? (bijv. Sevilla)"
                  className="w-full outline-none bg-transparent"
                  aria-label="Bestemming"
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                <Calendar className="w-5 h-5 text-neutral-500" />
                <DatePicker
                  selected={startDate}
                  onChange={(update) => setRange(update)}
                  startDate={startDate}
                  endDate={endDate}
                  selectsRange
                  placeholderText="Data kiezen"
                  className="outline-none bg-transparent"
                />
              </div>
              <button type="submit" className="rounded-2xl px-6 py-3 bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 transition">
                Zoek deals
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Curated deals */}
      <section className="max-w-6xl mx-auto px-6 pt-6 pb-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Topdeals voor solo reizigers</h2>
            <p className="text-neutral-600 mt-1">Alleen de scherpste prijzen — dagelijks ververst.</p>
          </div>
          <div className="text-sm text-neutral-600">{loadingDeals ? "Laden…" : `${deals.length} deals`}</div>
        </div>

        {loadingDeals ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">Deals laden…</div>
        ) : !deals.length ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">Nog geen deals. Kom snel terug!</div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((h, i) => (
              <DealCard key={`${h.id}-${i}`} h={h} />
            ))}
          </div>
        )}
      </section>

      {/* Live resultaten */}
      <section id="live" className="max-w-6xl mx-auto px-6 pt-4 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Live hotels {liveCity ? `in ${liveCity}` : ""}</h2>
            <p className="text-neutral-600 mt-1">Realtime via onze partner (1 volwassene).</p>
          </div>
          <div className="text-sm text-neutral-600">{loading ? "Laden…" : `${live.length} resultaten`}</div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">Even geduld…</div>
        ) : !live.length ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">Zoek hierboven op stad en data om live prijzen te zien.</div>
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

function DealCard({ h }) {
  return (
    <article className="rounded-3xl overflow-hidden border border-neutral-100 bg-white shadow-md hover:shadow-xl transition">
      <div className="aspect-[16/10] bg-neutral-100">
        <img src={hotelPhotoUrl(h.id)} alt={h.name || "Hotel"} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg">{h.name || "Hotel"}</h4>
          <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1">
            {Number.isFinite(h.stars) ? `${h.stars}★` : "Deal"}
          </span>
        </div>
        <div className="mt-1 text-sm text-neutral-600">{h.destination}</div>
        <div className="mt-3">
          <div className="text-xs text-neutral-500">vanaf</div>
          <div className="text-2xl font-bold">
            {formatCurrency(h.price)} <span className="text-sm font-medium text-neutral-500">p.p./nacht*</span>
          </div>
        </div>
        <a
          href={hotellookUrl({ destination: h.destination, checkIn: h.checkIn, checkOut: h.checkOut, adults: 1, subId: `deal_${h.id}` })}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="inline-block mt-4 rounded-full px-5 py-2.5 bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 transition"
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
    <article className="rounded-3xl overflow-hidden border border-neutral-100 bg-white shadow-md hover:shadow-xl transition">
      <div className="aspect-[16/10] bg-neutral-100">
        <img src={hotelPhotoUrl(h.id)} alt={h.name || "Hotel"} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg">{h.name || "Hotel"}</h4>
          <span className="inline-flex items-center justify-center rounded-full bg-pink-100 text-pink-700 text-xs px-2 py-1">
            {Number.isFinite(h.stars) ? `${h.stars}★` : "Live"}
          </span>
        </div>
        <div className="mt-1 text-sm text-neutral-600">{h.city || labelCity}</div>
        <div className="mt-3">
          <div className="text-xs text-neutral-500">vanaf</div>
          <div className="text-2xl font-bold">
            {formatCurrency(h.price)} <span className="text-sm font-medium text-neutral-500">p.p./nacht*</span>
          </div>
        </div>
        <a
          href={hotellookUrl({ destination: labelCity || h.city || "", checkIn: ci, checkOut: co, adults: 1, subId: `live_${h.id}` })}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="inline-block mt-4 rounded-full px-5 py-2.5 bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 transition"
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
      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-extrabold text-xl tracking-tight mb-2">
            Solo<span className="text-emerald-600">Stay</span>
          </div>
          <p className="text-neutral-600">
            Curated hoteldeals voor solo reizigers. Transparant en simpel boeken via onze partner.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Navigatie</h4>
          <ul className="space-y-2">
            <li><a href="/about" className="hover:text-emerald-600">Over ons</a></li>
            <li><a href="/contact" className="hover:text-emerald-600">Contact</a></li>
            <li><a href="/register" className="hover:text-emerald-600">Registreren</a></li>
            <li><a href="/login" className="hover:text-emerald-600">Login</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <p className="text-neutral-600 mb-2">Mail ons rechtstreeks:</p>
          <p className="font-medium">
            <a href="mailto:info@solostay.nl" className="text-emerald-700 hover:text-emerald-800">info@solostay.nl</a>
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
import React from "react";
import Head from "next/head";
import { Search, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";

// =====================================
// Soft, clean, Skyscanner‑like styling
// Accent: emerald/mint, subtle pink highlights
// =====================================
const TP_MARKER = "669798";
const HOTELLOOK_BASE = "https://hotellook.com/";

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

function hotelPhotoUrl(hotelId) {
  return `https://photo.hotellook.com/image_v2/limit/h${hotelId}_1/800/520.auto`;
}

function formatCurrency(n) {
  const v = Number(n);
  return Number.isFinite(v)
    ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v)
    : "€ –";
}

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

  React.useEffect(() => {
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
    <div className="min-h-screen bg-[#F7F8FA] text-neutral-900">
      <Head>
        <script src="https://cdn.tailwindcss.com" />
        <link rel="stylesheet" href="https://unpkg.com/react-datepicker/dist/react-datepicker.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SoloStay — De beste solo hoteldeals</title>
        <meta name="description" content="Curated hoteldeals voor solo reizigers. Eerlijke 1-persoonsprijzen." />
      </Head>

      {/* Soft hero met lichte blobs */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-pink-200/50 blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-900">
            De beste solo‑hoteldeals
            <span className="block text-emerald-600">strak geselecteerd</span>
          </h1>
          <p className="mt-4 max-w-2xl text-neutral-600 text-lg">
            Vind snel je scherpste 1‑persoonsprijs. Simpel, helder en zonder gedoe.
          </p>

          {/* Search bar */}
          <form onSubmit={onSubmit} className="mt-8">
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <div className="flex-1 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                <Search className="w-5 h-5 text-neutral-500" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Waar wil jij naartoe? (bijv. Sevilla)"
                  className="w-full outline-none bg-transparent"
                  aria-label="Bestemming"
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                <Calendar className="w-5 h-5 text-neutral-500" />
                <DatePicker
                  selected={startDate}
                  onChange={(update) => setRange(update)}
                  startDate={startDate}
                  endDate={endDate}
                  selectsRange
                  placeholderText="Data kiezen"
                  className="outline-none bg-transparent"
                />
              </div>
              <button type="submit" className="rounded-2xl px-6 py-3 bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 transition">
                Zoek deals
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Curated deals */}
      <section className="max-w-6xl mx-auto px-6 pt-6 pb-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Topdeals voor solo reizigers</h2>
            <p className="text-neutral-600 mt-1">Alleen de scherpste prijzen — dagelijks ververst.</p>
          </div>
          <div className="text-sm text-neutral-600">{loadingDeals ? "Laden…" : `${deals.length} deals`}</div>
        </div>

        {loadingDeals ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">Deals laden…</div>
        ) : !deals.length ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">Nog geen deals. Kom snel terug!</div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((h, i) => (
              <DealCard key={`${h.id}-${i}`} h={h} />
            ))}
          </div>
        )}
      </section>

      {/* Live resultaten */}
      <section id="live" className="max-w-6xl mx-auto px-6 pt-4 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Live hotels {liveCity ? `in ${liveCity}` : ""}</h2>
            <p className="text-neutral-600 mt-1">Realtime via onze partner (1 volwassene).</p>
          </div>
          <div className="text-sm text-neutral-600">{loading ? "Laden…" : `${live.length} resultaten`}</div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">Even geduld…</div>
        ) : !live.length ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">Zoek hierboven op stad en data om live prijzen te zien.</div>
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

function DealCard({ h }) {
  return (
    <article className="rounded-3xl overflow-hidden border border-neutral-100 bg-white shadow-md hover:shadow-xl transition">
      <div className="aspect-[16/10] bg-neutral-100">
        <img src={hotelPhotoUrl(h.id)} alt={h.name || "Hotel"} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg">{h.name || "Hotel"}</h4>
          <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1">
            {Number.isFinite(h.stars) ? `${h.stars}★` : "Deal"}
          </span>
        </div>
        <div className="mt-1 text-sm text-neutral-600">{h.destination}</div>
        <div className="mt-3">
          <div className="text-xs text-neutral-500">vanaf</div>
          <div className="text-2xl font-bold">
            {formatCurrency(h.price)} <span className="text-sm font-medium text-neutral-500">p.p./nacht*</span>
          </div>
        </div>
        <a
          href={hotellookUrl({ destination: h.destination, checkIn: h.checkIn, checkOut: h.checkOut, adults: 1, subId: `deal_${h.id}` })}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="inline-block mt-4 rounded-full px-5 py-2.5 bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 transition"
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
    <article className="rounded-3xl overflow-hidden border border-neutral-100 bg-white shadow-md hover:shadow-xl transition">
      <div className="aspect-[16/10] bg-neutral-100">
        <img src={hotelPhotoUrl(h.id)} alt={h.name || "Hotel"} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg">{h.name || "Hotel"}</h4>
          <span className="inline-flex items-center justify-center rounded-full bg-pink-100 text-pink-700 text-xs px-2 py-1">
            {Number.isFinite(h.stars) ? `${h.stars}★` : "Live"}
          </span>
        </div>
        <div className="mt-1 text-sm text-neutral-600">{h.city || labelCity}</div>
        <div className="mt-3">
          <div className="text-xs text-neutral-500">vanaf</div>
          <div className="text-2xl font-bold">
            {formatCurrency(h.price)} <span className="text-sm font-medium text-neutral-500">p.p./nacht*</span>
          </div>
        </div>
        <a
          href={hotellookUrl({ destination: labelCity || h.city || "", checkIn: ci, checkOut: co, adults: 1, subId: `live_${h.id}` })}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="inline-block mt-4 rounded-full px-5 py-2.5 bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 transition"
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
      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-extrabold text-xl tracking-tight mb-2">
            Solo<span className="text-emerald-600">Stay</span>
          </div>
          <p className="text-neutral-600">
            Curated hoteldeals voor solo reizigers. Transparant en simpel boeken via onze partner.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Navigatie</h4>
          <ul className="space-y-2">
            <li><a href="/about" className="hover:text-emerald-600">Over ons</a></li>
            <li><a href="/contact" className="hover:text-emerald-600">Contact</a></li>
            <li><a href="/register" className="hover:text-emerald-600">Registreren</a></li>
            <li><a href="/login" className="hover:text-emerald-600">Login</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <p className="text-neutral-600 mb-2">Mail ons rechtstreeks:</p>
          <p className="font-medium">
            <a href="mailto:info@solostay.nl" className="text-emerald-700 hover:text-emerald-800">info@solostay.nl</a>
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
