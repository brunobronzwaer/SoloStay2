import React, { useMemo, useState } from "react";
import Head from "next/head";
import { Search, ShieldCheck, Users, Percent, Star, MapPin, Calendar, Plane } from "lucide-react";
import DatePicker from "react-datepicker";

// --- Mock data ---
const DESTINATIONS = [
  { slug: "lisbon", name: "Lisbon", country: "Portugal", img: "https://images.unsplash.com/photo-1518306727298-4c3d516e3870?q=80&w=1400&auto=format&fit=crop", tags: ["sunny", "walkable", "budget"], ppn: 68 },
  { slug: "barcelona", name: "Barcelona", country: "Spain", img: "https://images.unsplash.com/photo-1494783367193-149034c05e8f?q=80&w=1400&auto=format&fit=crop", tags: ["beach", "food", "nightlife"], ppn: 92 },
  { slug: "porto", name: "Porto", country: "Portugal", img: "https://images.unsplash.com/photo-1520975922375-5d99f2dce040?q=80&w=1400&auto=format&fit=crop", tags: ["cozy", "historic", "budget"], ppn: 61 },
  { slug: "seville", name: "Seville", country: "Spain", img: "https://images.unsplash.com/photo-1579503841516-e0bd7f8e3fbb?q=80&w=1400&auto=format&fit=crop", tags: ["warm", "walkable"], ppn: 74 },
  { slug: "valencia", name: "Valencia", country: "Spain", img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1400&auto=format&fit=crop", tags: ["beach", "modern"], ppn: 70 },
  { slug: "prague", name: "Prague", country: "Czechia", img: "https://images.unsplash.com/photo-1471623432079-b009d30b6729?q=80&w=1400&auto=format&fit=crop", tags: ["historic", "romantic"], ppn: 64 },
  { slug: "budapest", name: "Budapest", country: "Hungary", img: "https://images.unsplash.com/photo-1546707012-c46675f12741?q=80&w=1400&auto=format&fit=crop", tags: ["thermal baths", "nightlife"], ppn: 58 },
  { slug: "copenhagen", name: "Copenhagen", country: "Denmark", img: "https://images.unsplash.com/photo-1502790671504-542ad42d5189?q=80&w=1400&auto=format&fit=crop", tags: ["safe", "design"], ppn: 115 },
  { slug: "reykjavik", name: "Reykjavík", country: "Iceland", img: "https://images.unsplash.com/photo-1564325724739-bae0bd08762f?q=80&w=1400&auto=format&fit=crop", tags: ["nature", "safe"], ppn: 128 },
  { slug: "krakow", name: "Kraków", country: "Poland", img: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=1400&auto=format&fit=crop", tags: ["budget", "culture"], ppn: 46 },
];

const HOTELS = [
  { id: "h1", name: "Riverside Boutique Hotel", city: "Lisbon", img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1400&auto=format&fit=crop", pricePerRoom: 120, maxOccupancy: 2, soloFriendly: ["No single supplement", "Central & walkable"], rating: 4.6, distance: "0.6 km from center" },
  { id: "h2", name: "Old Town Studio", city: "Porto", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1400&auto=format&fit=crop", pricePerRoom: 78, maxOccupancy: 1, soloFriendly: ["Single Room", "Quiet street"], rating: 4.4, distance: "1.1 km from center" },
  { id: "h3", name: "Cathedral View Rooms", city: "Seville", img: "https://images.unsplash.com/photo-1551776235-dde6d4829808?q=80&w=1400&auto=format&fit=crop", pricePerRoom: 110, maxOccupancy: 2, soloFriendly: ["Shared twin option", "Late check-in"], rating: 4.5, distance: "0.4 km from center" },
];

const FLIGHT_MOCKS = [
  { id: "f1", from: "EIN", to: "LIS", airline: "FR", duration: "3u05", price: 79, nonstop: true },
  { id: "f2", from: "AMS", to: "LIS", airline: "TP", duration: "3u00", price: 129, nonstop: true },
  { id: "f3", from: "AMS", to: "SVQ", airline: "HV", duration: "3u05", price: 109, nonstop: true },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default function SoloHotelsLanding() {
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [filteredHotels, setFilteredHotels] = useState(HOTELS);

  const [includeFlights, setIncludeFlights] = useState(false);
  const [origin, setOrigin] = useState("AMS");
  const [filteredFlights, setFilteredFlights] = useState<typeof FLIGHT_MOCKS>([]);

  const filteredDestinations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DESTINATIONS;
    return DESTINATIONS.filter(d => d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q));
  }, [query]);

  function handleSearch() {
    const q = query.trim().toLowerCase();
    const results = HOTELS.filter(h => {
      const cityMatch = !q || h.city.toLowerCase().includes(q);
      const guestsOk = Math.max(1, h.maxOccupancy || 1) >= Math.max(1, guests || 1);
      return cityMatch && guestsOk;
    });
    setFilteredHotels(results);

    if (includeFlights) {
      const destCode = (q.includes("lis") && "LIS") || (q.includes("sev") && "SVQ") || (q.includes("por") && "OPO") || null;
      const flights = FLIGHT_MOCKS.filter(f => (!destCode || f.to === destCode) && f.from.toUpperCase() === origin.toUpperCase());
      setFilteredFlights(flights);
    } else {
      setFilteredFlights([]);
    }

    const el = document.getElementById("results");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Head>
        {/* Tailwind (CDN) */}
        <script src="https://cdn.tailwindcss.com" />
        {/* React Datepicker CSS */}
        <link rel="stylesheet" href="https://unpkg.com/react-datepicker/dist/react-datepicker.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SoloStay</title>
      </Head>

      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-extrabold text-xl tracking-tight">Solo<span className="text-blue-600">Stay</span></div>
          <nav className="hidden md:flex gap-6 text-sm items-center">
            <a href="#destinations" className="hover:text-blue-600">Bestemmingen</a>
            <a href="#how" className="hover:text-blue-600">Zo werkt het</a>
            <a href="#newsletter" className="hover:text-blue-600">Deals</a>
            <a href="/login" className="rounded-xl px-4 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Login</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"/>
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-24 md:py-32">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white drop-shadow">Hotels met <span className="text-blue-300">eerlijke</span> 1-persoons prijzen</h1>
          <p className="mt-4 max-w-2xl text-white/90 text-lg">Nooit meer gokken of de prijs per kamer of per persoon is. Wij tonen altijd de <strong>prijs voor jou alleen</strong> — helder en eerlijk.</p>

          {/* Search box */}
          <div className="mt-8 bg-white/95 rounded-2xl p-3 md:p-4 shadow-xl">
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 bg-white">
                <Search className="w-5 h-5" />
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Zoek stad of land (bijv. Lissabon)" className="w-full outline-none bg-transparent" />
              </div>
