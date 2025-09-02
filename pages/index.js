import React from "react";
import Head from "next/head";
import { Search, Flame } from "lucide-react";

// ====== CONFIG ======
const TP_MARKER = "669798";
// Vervang straks door jouw WL-domein, bv. https://hotels.solostay.nl/
const WL_BASE = "https://hotellook.com/";
const MAX_PRICE = 200; // €-cap per nacht om dure resultaten te verbergen

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

const photoUrl = (id) => `https://photo.hotellook.com/image_v2/limit/h${id}_1/800/520.auto`;
const euro = (n) =>
  Number.isFinite(+n)
    ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(+n)
    : "€ –";

export default function Home() {
  const [q, setQ] = React.useState("");
  const [deals, setDeals] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  // helper: veilig JSON fetchen
  async function safeFetchJson(url, signal) {
    const r = await fetch(url, { signal, headers: { Accept: "application/json" } });
    const data = await r.json().catch(() => null);
    if (!r.ok || !data) throw new Error(data?.error || "API error");
    return data;
  }

  // standaard curated deals bij laden (5 steden, volgend weekend)
  React.useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const cities = ["Barcelona", "Sevilla", "Lissabon", "Porto", "Valencia"];
        const { checkIn, checkOut } = nextFridayWeekend();
        const all = [];
        for (const city of cities) {
          const qs = new URLSearchParams({ city, checkIn, checkOut, adults: "1", lang: "nl", limit: "100" });
          try {
            const data = await safeFetchJson(`/api/hotels?${qs}`, ac.signal);
            const top = (data.items || [])
              .filter((h) => Number.isFinite(+h.price))
              .filter((h) => +h.price <= MAX_PRICE) // cap op prijs
              .sort((a, b) => +a.price - +b.price)
              .slice(0, 3)
              .map((h) => ({ ...h, destination: data.city, checkIn: data.checkIn, checkOut: data.checkOut }));
            all.push(...top);
          } catch {
            /* stad overslaan bij fout */
          }
        }
        all.sort((a, b) => +a.price - +b.price);
        setDeals(all);
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // zoeken op eigen bestemming (ook zonder datum → volgend weekend)
  async function onSubmit(e) {
    e.preventDefault();
    const city = (q || "").trim();
    if (!city) return;
    const ac = new AbortController();
    try {
      setLoading(true);
      const { checkIn, checkOut } = nextFridayWeekend();
      const qs = new URLSearchParams({ city, checkIn, checkOut, adults: "1", lang: "nl", limit: "100" });
      const data = await safeFetchJson(`/api/hotels?${qs}`, ac.signal);
      const items = (data.items || [])
        .filter((h) => Number.isFinite(+h.price))
        .filter((h) => +h.price <= MAX_PRICE)
        .sort((a, b) => +a.price - +b.price)
        .slice(0, 9)
        .map((h) => ({ ...h, destination: data.city, checkIn: data.checkIn, checkOut: data.checkOut }));
      setDeals(items);
      // smooth scroll
      const el = document.getElementById("deals");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-neutral-900">
      <Head>
        <script src="https://cdn.tailwindcss.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SoloStay — De beste solo-hoteldeals</title>
        <meta
          name="description"
          content="Curated hoteldeals voor solo reizigers. Rood = korting. Eerlijke 1-persoonsprijzen zonder gedoe."
        />
      </Head>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* zachte blobs in rood/groen tint voor diepte */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-rose-200/50 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            De beste solo-hoteldeals{" "}
            <span className="block text-rose-600">strak geselecteerd</span>
          </h1>
          <p className="mt-4 max-w-2xl text-neutral-600 text-lg">
            Vind snel je scherpste 1-persoonsprijs. We tonen alleen de <strong className="text-rose-700">koopjes</strong>.
          </p>

          {/* ZOEK – alleen bestemming */}
          <form onSubmit={onSubmit} className="mt-8">
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <div className="flex-1 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                <Search className="w-5 h-5 text-neutral-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Waar wil jij naartoe? (bijv. Sevilla)"
                  className="w-full outline-none bg-transparent"
                  aria-label="Bestemming"
                />
              </div>
              <button
                type="submit"
                className="rounded-2xl px-6 py-3 bg-rose-600 text-white font-semibold shadow-sm hover:bg-rose-700 transition"
              >
                Zoek deals
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* DEALS */}
      <section id="deals" className="max-w-6xl mx-auto px-6 pt-6 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-600" />
            <h2 className="text-2xl md:text-3xl font-bold">Topdeals voor solo reizigers</h2>
          </div>
          <div className="text-sm text-neutral-600">{loading ? "Laden…" : `${deals.length} deals`}</div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">Deals laden…</div>
        ) : !deals.length ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            Nog geen deals. Probeer een andere bestemming of kom snel terug!
          </div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((h, i) => (
              <DealCard key={`${h.id}-${i}`} h={h} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

/* ===== Card ===== */
function DealCard({ h }) {
  return (
    <article className="rounded-3xl overflow-hidden border border-neutral-100 bg-white shadow-md hover:shadow-xl transition">
      <div className="aspect-[16/10] bg-neutral-100">
        <img
          src={photoUrl(h.id)}
          alt={h.name || "Hotel"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg">{h.name || "Hotel"}</h4>
          <span className="inline-flex items-center rounded-full bg-rose-100 text-rose-700 text-xs px-2 py-1">
            Deal
          </span>
        </div>
        <div className="mt-1 text-sm text-neutral-600">{h.destination}</div>
        <div className="mt-3">
          <div className="text-xs text-neutral-500">vanaf</div>
          <div className="text-2xl font-bold">
            {euro(h.price)} <span className="text-sm font-medium text-neutral-500">p.p./nacht*</span>
          </div>
        </div>
        <a
          href={wlUrl({
            destination: h.destination,
            checkIn: h.checkIn,
            checkOut: h.checkOut,
            adults: 1,
            subId: `deal_${h.id}`,
          })}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="inline-block mt-4 rounded-full px-5 py-2.5 bg-rose-600 text-white font-semibold shadow-sm hover:bg-rose-700 transition"
        >
          Waar te boeken?
        </a>
        <div className="mt-2 text-[11px] text-neutral-500">
          *Indicatief. Klik om aanbieders te vergelijken (via partner).
        </div>
      </div>
    </article>
  );
}

/* ===== Footer ===== */
function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white mt-12">
      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-extrabold text-xl tracking-tight mb-2">
            Solo<span className="text-rose-600">Stay</span>
          </div>
          <p className="text-neutral-600">
            Curated hoteldeals voor solo reizigers. Transparant en simpel boeken via onze partner.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Navigatie</h4>
          <ul className="space-y-2">
            <li><a href="/about" className="hover:text-rose-600">Over ons</a></li>
            <li><a href="/contact" className="hover:text-rose-600">Contact</a></li>
            <li><a href="/register" className="hover:text-rose-600">Registreren</a></li>
            <li><a href="/login" className="hover:text-rose-600">Login</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <p className="text-neutral-600 mb-2">Mail ons rechtstreeks:</p>
          <p className="font-medium">
            <a href="mailto:info@solostay.nl" className="text-rose-700 hover:text-rose-800">info@solostay.nl</a>
          </p>
        </div>
      </div>
      <div className="border-t border-neutral-200 text-center text-xs text-neutral-500 py-4">
        © {new Date().getFullYear()} SoloStay. Alle rechten voorbehouden.
      </div>
    </footer>
  );
}

/* ===== Utils ===== */
function nextFridayWeekend() {
  const now = new Date();
  const day = now.getDay(); // 0=zo … 5=vr
  const diffToFri = (5 - day + 7) % 7 || 7;
  const fri = new Date(now);
  fri.setDate(now.getDate() + diffToFri);
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  const toISO = (d) => d.toISOString().slice(0, 10);
  return { checkIn: toISO(fri), checkOut: toISO(sun) };
}
