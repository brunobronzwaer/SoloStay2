import React, { useMemo, useState } from "react";
import Head from "next/head";
import { Search, Star, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";

// ==== CONFIG ====
const TP_PARTNER_ID = "669798";
const HOTELLOOK_BASE = "https://search.hotellook.com/";

function hotellookUrl({ city, checkIn = "", checkOut = "" }, subId = "") {
  const params = new URLSearchParams({
    marker: TP_PARTNER_ID,
    adults: "1",
    locale: "nl",
    language: "nl",
    currency: "EUR",
    city: city || "",
    check_in: checkIn || "",
    check_out: checkOut || "",
  });
  if (subId) params.set("sub_id", subId);
  return `${HOTELLOOK_BASE}?${params.toString()}`;
}

function formatCurrency(n) {
  const safe = Number.isFinite(Number(n)) ? Number(n) : 0;
  try {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(safe);
  } catch {
    return `${safe} €`;
  }
}

// Demo blok
const HOTELS = [
  { id: "h1", name: "Riverside Boutique Hotel", city: "Lisbon", img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1400&auto=format&fit=crop", pricePerRoom: 120, maxOccupancy: 2, soloFriendly: ["No single supplement", "Central & walkable"], rating: 4.6, distance: "0.6 km from center" },
  { id: "h2", name: "Old Town Studio", city: "Porto", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1400&auto=format&fit=crop", pricePerRoom: 78, maxOccupancy: 1, soloFriendly: ["Single Room", "Quiet street"], rating: 4.4, distance: "1.1 km from center" },
  { id: "h3", name: "Cathedral View Rooms", city: "Seville", img: "https://images.unsplash.com/photo-1551776235-dde6d4829808?q=80&w=1400&auto=format&fit=crop", pricePerRoom: 110, maxOccupancy: 2, soloFriendly: ["Shared twin option", "Late check-in"], rating: 4.5, distance: "0.4 km from center" },
];

export default function SoloStay() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [guests, setGuests] = useState(1);

  const [filteredHotels, setFilteredHotels] = useState(HOTELS);

  const [liveCity, setLiveCity] = useState("");
  const [liveResults, setLiveResults] = useState([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const resultsCountLabel = filteredHotels.length === 1 ? "1 resultaat" : `${filteredHotels.length} resultaten`;

  async function fetchLiveHotels(cityText, checkInISO, checkOutISO) {
    try {
      setLoadingLive(true);
      setLiveResults([]);
      console.log("[fetchLiveHotels] start", { cityText, checkInISO, checkOutISO });

      const qs = new URLSearchParams({
        city: cityText,
        checkIn: checkInISO || "",
        checkOut: checkOutISO || "",
        adults: "1",
        lang: "nl",
      });

      const url = `/api/hotels?${qs.toString()}`;
      const resp = await fetch(url);
      console.log("[fetchLiveHotels] status", resp.status);

      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch { data = null; }
      console.log("[fetchLiveHotels] payload", data || text);

      if (!resp.ok || !data) throw new Error((data && data.error) || "fetch error");

      setLiveCity(data.city || cityText);
      setLiveResults(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      console.error("[fetchLiveHotels] ERROR", e);
      setLiveCity("");
      setLiveResults([]);
    } finally {
      setLoadingLive(false);
    }
  }

  async function handleSearch() {
    try {
      const q = (query || "").trim().toLowerCase();

      const demo = HOTELS.filter(h => {
        const cityMatch = !q || (h.city || "").toLowerCase().includes(q);
        const guestsOk = Math.max(1, h.maxOccupancy || 1) >= Math.max(1, guests || 1);
        return cityMatch && guestsOk;
      });
      setFilteredHotels(demo);

      const ci = startDate instanceof Date ? startDate.toISOString().slice(0, 10) : "";
      const co = endDate instanceof Date ? endDate.toISOString().slice(0, 10) : "";

      if (q) {
        await fetchLiveHotels(q, ci, co);
      } else {
        setLiveCity("");
        setLiveResults([]);
      }

      const el = typeof document !== "undefined" && document.getElementById("results");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      console.error("[handleSearch] ERROR", e);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Head>
        <script src="https://cdn.tailwindcss.com" />
        <link rel="stylesheet" href="https://unpkg.com/react-datepicker/dist/react-datepicker.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SoloStay — Eerlijke 1-persoons hotelprijzen</title>
        <meta name="description" content="Hotels met eerlijke 1-persoons prijzen. Zoek live hotels via SoloStay en boek zonder verrassingen." />
      </Head>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="font-extrabold text-xl tracking-tight">
            Solo<span className="text-blue-600">Stay</span>
          </a>

          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden rounded-lg px-3 py-2 border border-neutral-300 bg-white text-sm"
            aria-label="Open menu"
            aria-expanded={mobileOpen ? "true" : "false"}
          >
            Menu
          </button>

          <nav className="hidden md:flex gap-6 text-sm items-center">
            <a href="#destinations" className="hover:text-blue-600">Bestemmingen</a>
            <a href="#how" className="hover:text-blue-600">Zo werkt het</a>
            <a href="#newsletter" className="hover:text-blue-600">Deals</a>
            <a href="/about" className="hover:text-blue-600">Over ons</a>
            <a href="/contact" className="hover:text-blue-600">Contact</a>
            <a href="/register" className="hover:text-blue-600">Registreren</a>
            <a href="/login" className="rounded-lg px-3 py-1.5 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Login</a>
          </nav>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white">
            <nav className="max-w-6xl mx-auto px-4 py-3 grid gap-3 text-base">
              <a href="#destinations" className="hover:text-blue-600" onClick={() => setMobileOpen(false)}>Bestemmingen</a>
              <a href="#how" className="hover:text-blue-600" onClick={() => setMobileOpen(false)}>Zo werkt het</a>
              <a href="#newsletter" className="hover:text-blue-600" onClick={() => setMobileOpen(false)}>Deals</a>
              <a href="/about" className="hover:text-blue-600" onClick={() => setMobileOpen(false)}>Over ons</a>
              <a href="/contact" className="hover:text-blue-600" onClick={() => setMobileOpen(false)}>Contact</a>
              <a href="/register" className="hover:text-blue-600" onClick={() => setMobileOpen(false)}>Registreren</a>
              <a href="/login" className="inline-block w-full text-center rounded-lg px-3 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition" onClick={() => setMobileOpen(false)}>Login</a>
            </nav>
          </div>
        )}
      </header>

      {/* Hero + zoek */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 md:py-28">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white drop-shadow">
            Hotels met <span className="text-blue-300">eerlijke</span> 1-persoons prijzen
          </h1>
          <p className="mt-4 max-w-2xl text-white/90 text-lg">
            Altijd de prijs voor <strong>jou alleen</strong> — helder en eerlijk. Geen single-toeslag verrassingen.
          </p>

          <div className="mt-8 bg-white/95 rounded-2xl p-3 md:p-4 shadow-xl">
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 bg-white">
                <Search className="w-5 h-5" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Zoek stad (bijv. Lissabon, Porto, Sevilla)"
                  className="w-full outline-none bg-transparent"
                  aria-label="Bestemming"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 bg-white">
                <Calendar className="w-5 h-5 text-neutral-500" />
                <DatePicker
                  selected={startDate || null}
                  onChange={(dates) => {
                    // react-datepicker geeft bij range ALTIJD een array terug
                    if (Array.isArray(dates)) {
                      const [start, end] = dates;
                      setStartDate(start || null);
                      setEndDate(end || null);
                    } else {
                      // safety: als er ooit een enkel Date-object komt
                      setStartDate(dates || null);
                      setEndDate(null);
                    }
                  }}
                  startDate={startDate || null}
                  endDate={endDate || null}
                  selectsRange
                  placeholderText="Selecteer data"
                  className="outline-none bg-transparent"
                />
              </div>
              <div className="md:w-44 flex items-center justify-between gap-2 rounded-xl border border-neutral-200 px-3 py-2 bg-white">
                <input
                  type="number"
                  min={1}
                  value={guests}
                  onChange={e => setGuests(Math.max(1, +e.target.value || 1))}
                  className="w-16 outline-none bg-transparent"
                  aria-label="Aantal personen"
                />
                <span className="text-sm text-neutral-600">{guests === 1 ? "persoon" : "personen"}</span>
              </div>
              <button
                onClick={handleSearch}
                className="rounded-2xl px-5 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition md:ml-auto"
              >
                Zoek
              </button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
      </section>

      {/* Aanbevolen */}
      <section id="results" className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Aanbevolen voor jou</h2>
            <p className="text-neutral-600 mt-1">Eerlijke 1-persoonsprijzen. Geen verrassingen bij het afrekenen.</p>
          </div>
          <div className="text-sm text-neutral-600">{resultsCountLabel}</div>
        </div>

        {filteredHotels.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-700">
            Geen hotels gevonden voor jouw filters. Probeer een andere stad.
          </div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map(h => <HotelCard key={h.id} {...h} />)}
          </div>
        )}
      </section>

      {/* LIVE Hotels */}
      <section className="max-w-6xl mx-auto px-4 pt-6 pb-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Live hotels {liveCity ? `in ${liveCity}` : ""}</h2>
            <p className="text-neutral-600 mt-1">Realtime via Hotellook (1 volwassene).</p>
          </div>
          <div className="text-sm text-neutral-600">
            {loadingLive ? "Laden…" : `${liveResults.length} resultaten`}
          </div>
        </div>

        {loadingLive ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">Even geduld, live prijzen worden opgehaald…</div>
        ) : liveResults.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-700">
            Geen live resultaten. Zoek op een stad (bijv. Lissabon) en selecteer data.
          </div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveResults.map((h, i) => (
              <article key={`${h.id || i}-${i}`} className="rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm hover:shadow-xl transition">
                <div className="aspect-[16/10] bg-neutral-100">
                  <img
                    src={h.photo || "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop"}
                    alt={h.name || "Hotel"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{h.name || "Hotel"}</h4>
                    <div className="text-sm text-neutral-600">{Number.isFinite(h.stars) ? `${h.stars}★` : "—"}</div>
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">{h.city || liveCity}</div>
                  <div className="mt-3">
                    <div className="text-xs text-neutral-500">vanaf</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(h.price)}{" "}
                      <span className="text-sm font-medium text-neutral-600">p.p./nacht*</span>
                    </div>
                  </div>
                  <a
                    href={hotellookUrl({
                      city: liveCity || h.city || "",
                      checkIn: startDate instanceof Date ? startDate.toISOString().slice(0,10) : "",
                      checkOut: endDate instanceof Date ? endDate.toISOString().slice(0,10) : ""
                    })}
                    target="_blank"
                    rel="nofollow noopener"
                    className="inline-block mt-4 rounded-xl px-4 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    Boek nu
                  </a>
                  <div className="mt-2 text-[11px] text-neutral-500">
                    *Indicatief o.b.v. tarieven bij 1 volwassene. Je boekt veilig via onze partner (Hotellook/Travelpayouts).
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="font-extrabold text-xl tracking-tight mb-2">
              Solo<span className="text-blue-600">Stay</span>
            </div>
            <p className="text-neutral-600">
              Eerlijke 1-persoonsprijzen voor hotels (en later vluchten). Geen verrassingen — reizen op jouw manier.
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
    </div>
  );
}

function HotelCard({ name, city, img, pricePerRoom, maxOccupancy, soloFriendly = [], rating, distance }) {
  const pricePerPerson = useMemo(() => {
    const divisor = Math.max(1, maxOccupancy || 1);
    const val = Number.isFinite(Number(pricePerRoom)) ? Number(pricePerRoom) : 0;
    return val / (divisor > 1 ? divisor : 1);
  }, [pricePerRoom, maxOccupancy]);

  const displayRating = Number.isFinite(Number(rating)) ? Number(rating).toFixed(1) : "—";

  return (
    <article className="rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm hover:shadow-xl transition">
      <div className="aspect-[16/10] bg-neutral-100">
        <img src={img} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg">{name}</h4>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-4 h-4" />
            <span className="text-sm text-neutral-800">{displayRating}</span>
          </div>
        </div>
        <div className="mt-1 text-sm text-neutral-600">{city} • {distance}</div>
        <ul className="mt-3 flex flex-wrap gap-2 text-xs">
          {soloFriendly.map((f, i) => (
            <li key={i} className="px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200">{f}</li>
          ))}
        </ul>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-xs text-neutral-500">vanaf</div>
            <div className="text-xl font-bold">
              {formatCurrency(pricePerPerson)}{" "}
              <span className="text-sm font-medium text-neutral-600">p.p./nacht</span>
            </div>
          </div>
          <a
            href="#"
            className="rounded-xl px-4 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            title="Boek nu"
          >
            Boek nu
          </a>
        </div>
      </div>
    </article>
  );
}
