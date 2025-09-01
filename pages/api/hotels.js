// pages/api/hotels.js
// Server-side proxy naar Hotellook (Travelpayouts) om CORS te vermijden en je token te verbergen.

export default async function handler(req, res) {
  try {
    const { city = "", checkIn = "", checkOut = "", adults = "1", lang = "nl" } = req.query;

    if (!city) return res.status(400).json({ error: "city is required" });

    const TP_API_TOKEN = process.env.TP_API_TOKEN || "2078fe1e506ad018ec23a168c48277f4";

    // 1) City lookup
    const lookupUrl = `https://engine.hotellook.com/api/v2/lookup.json?query=${encodeURIComponent(
      city
    )}&lang=${encodeURIComponent(lang)}&lookFor=both&limit=1`;

    const lookupResp = await fetch(lookupUrl, {
      headers: { "X-Access-Token": TP_API_TOKEN },
      // Hotellook ondersteunt GET + header; server-side is dit oké
    });

    if (!lookupResp.ok) {
      const txt = await lookupResp.text();
      return res.status(lookupResp.status).json({ error: "lookup failed", detail: txt });
    }

    const lookup = await lookupResp.json();
    const loc =
      lookup?.results?.locations?.[0] ||
      lookup?.results?.hotels?.[0] ||
      null;

    if (!loc) return res.status(404).json({ error: "No location found" });

    const locationName = loc?.fullName || loc?.name || `${city}, ${loc?.country || ""}`;

    // 2) Prices via cache endpoint
    const params = new URLSearchParams({
      location: locationName,
      limit: "12",
      adults: adults || "1",
    });
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);

    const cacheUrl = `https://engine.hotellook.com/api/v2/cache.json?${params.toString()}`;

    const pricesResp = await fetch(cacheUrl, {
      headers: { "X-Access-Token": TP_API_TOKEN },
    });

    if (!pricesResp.ok) {
      const txt = await pricesResp.text();
      return res.status(pricesResp.status).json({ error: "prices failed", detail: txt });
    }

    const prices = await pricesResp.json();

    const items = (prices || []).map((p) => ({
      id: `${p.hotelId}-${p.location}-${p.priceAvg}`,
      name: p.hotelName,
      city: p.location,
      price: p.priceAvg,
      stars: p.stars,
      photo: p.photo || null,
      distance: p.distance || null,
    }));

    res.status(200).json({
      city: locationName,
      checkIn,
      checkOut,
      adults,
      count: items.length,
      items,
    });
  } catch (e) {
    console.error("api/hotels error:", e);
    res.status(500).json({ error: "failed", detail: String(e) });
  }
}
