// pages/api/hotels.js
export default async function handler(req, res) {
  try {
    const {
      city = "",
      checkIn = "",
      checkOut = "",
      adults = "1",
      lang = "nl",
      limit = "60",         // ↑ standaard meer resultaten
      debug = "0",
    } = req.query;

    if (!city) {
      return res.status(400).json({ error: "city is required" });
    }

    // Parse & clamp inputs
    const adultsNum = Math.max(1, parseInt(String(adults), 10) || 1);
    const limitNum  = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 60)); // cap 100

    const TP_API_TOKEN  = process.env.TP_API_TOKEN  || "2078fe1e506ad018ec23a168c48277f4";
    const TP_PARTNER_ID = process.env.TP_PARTNER_ID || "669798";

    // 1) Lookup -> haal locationId
    const lookupUrl = new URL("https://engine.hotellook.com/api/v2/lookup.json");
    lookupUrl.searchParams.set("query", city);
    lookupUrl.searchParams.set("lang", lang);
    lookupUrl.searchParams.set("lookFor", "both");
    lookupUrl.searchParams.set("limit", "1");
    lookupUrl.searchParams.set("token", TP_API_TOKEN);
    lookupUrl.searchParams.set("partnerId", TP_PARTNER_ID);

    const lookupResp = await fetch(lookupUrl.toString(), { headers: { "Accept": "application/json" } });
    if (!lookupResp.ok) {
      const txt = await lookupResp.text();
      return res.status(lookupResp.status).json({ error: "lookup failed", detail: txt });
    }
    const lookup = await lookupResp.json();

    const loc =
      lookup?.results?.locations?.[0] ||
      lookup?.results?.hotels?.[0] || null;

    if (!loc) return res.status(404).json({ error: "No location found" });

    const locationId  = loc?.id || loc?.locationId;
    if (!locationId) {
      return res.status(400).json({ error: "No locationId in lookup result", raw: loc });
    }

    const cityName    = loc?.cityName || loc?.name || city;
    const countryName = loc?.countryName || loc?.country || "";

    // 2) Prices via cache endpoint -> gebruik locationId
    const cacheUrl = new URL("https://engine.hotellook.com/api/v2/cache.json");
    cacheUrl.searchParams.set("locationId", String(locationId));
    if (checkIn)  cacheUrl.searchParams.set("checkIn",  checkIn);   // YYYY-MM-DD
    if (checkOut) cacheUrl.searchParams.set("checkOut", checkOut);  // YYYY-MM-DD
    cacheUrl.searchParams.set("adultsCount", String(adultsNum));
    // vraag ruimer op, we limiteren zelf na sorteren
    cacheUrl.searchParams.set("limit", "120");
    cacheUrl.searchParams.set("currency", "EUR");
    cacheUrl.searchParams.set("token", TP_API_TOKEN);
    cacheUrl.searchParams.set("partnerId", TP_PARTNER_ID);

    const pricesResp = await fetch(cacheUrl.toString(), { headers: { "Accept": "application/json" } });
    if (!pricesResp.ok) {
      const txt = await pricesResp.text();
      return res.status(pricesResp.status).json({ error: "prices failed", detail: txt });
    }

    const prices = await pricesResp.json();
    const arr = Array.isArray(prices) ? prices : [];

    // 3) Normaliseren + foto fallback
    const normalized = arr.map((p) => {
      const id    = p.hotelId;
      const name  = p.hotelName ?? p.name ?? "Unknown";
      const stars = p.stars ?? null;
      const price = (p.priceAvg ?? p.priceFrom ?? null);
      const photo = p.photo ?? (id ? `https://photo.hotellook.com/image_v2/limit/h${id}_1/800/520.auto` : null);
      const distance = p.distance ?? null;
      return { id, name, city: cityName, country: countryName || null, stars, price, distance, photo };
    });

    // 4) Sorteer goedkoopste eerst, daarna limiten
    const items = normalized
      .filter(h => Number.isFinite(Number(h.price)))
      .sort((a, b) => Number(a.price) - Number(b.price))
      .slice(0, limitNum);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({
      city: countryName ? `${cityName}, ${countryName}` : cityName,
      checkIn,
      checkOut,
      adults: adultsNum,
      count: items.length,
      items,
      ...(debug === "1" ? { debug: {
        locationId,
        requestedLimit: limitNum,
        rawCount: arr.length,
        sample: arr[0] || null
      }} : {})
    });
  } catch (e) {
    console.error("api/hotels error:", e);
    return res.status(500).json({ error: "failed", detail: String(e) });
  }
}
