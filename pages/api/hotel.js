// pages/api/hotels.js
export default async function handler(req, res) {
  try {
    const {
      city = "",
      checkIn = "",
      checkOut = "",
      adults = "1",
      lang = "nl",
      limit = "100",
      maxPrice = "",     // optioneel: bv. 220 => filter server-side
      debug = "0",
    } = req.query;

    if (!city) return res.status(400).json({ error: "city is required" });

    const TP_API_TOKEN  = process.env.TP_API_TOKEN  || "2078fe1e506ad018ec23a168c48277f4";
    const TP_PARTNER_ID = process.env.TP_PARTNER_ID || "669798";

    // 1) Lookup -> locationId
    const lookupUrl = new URL("https://engine.hotellook.com/api/v2/lookup.json");
    lookupUrl.searchParams.set("query", city);
    lookupUrl.searchParams.set("lang", lang);
    lookupUrl.searchParams.set("lookFor", "both");
    lookupUrl.searchParams.set("limit", "1");
    // Hotellook accepteert token/partnerId in query
    lookupUrl.searchParams.set("token", TP_API_TOKEN);
    lookupUrl.searchParams.set("partnerId", TP_PARTNER_ID);

    const lookupResp = await fetch(lookupUrl.toString());
    if (!lookupResp.ok) {
      const txt = await lookupResp.text();
      return res.status(lookupResp.status).json({ error: "lookup failed", detail: txt });
    }
    const lookup = await lookupResp.json();

    const loc =
      lookup?.results?.locations?.[0] ||
      lookup?.results?.hotels?.[0] || null;

    if (!loc) return res.status(404).json({ error: "No location found" });

    const locationId = loc?.id || loc?.locationId;
    if (!locationId) return res.status(400).json({ error: "No locationId in lookup result", raw: loc });

    const cityName    = loc?.cityName || loc?.name || city;
    const countryName = loc?.countryName || loc?.country || "";

    // 2) Prices via cache -> met locationId
    const cacheUrl = new URL("https://engine.hotellook.com/api/v2/cache.json");
    cacheUrl.searchParams.set("locationId", String(locationId));
    if (checkIn)  cacheUrl.searchParams.set("checkIn",  checkIn);
    if (checkOut) cacheUrl.searchParams.set("checkOut", checkOut);
    cacheUrl.searchParams.set("adultsCount", String(adults || "1"));
    cacheUrl.searchParams.set("limit", String(limit));
    cacheUrl.searchParams.set("currency", "EUR");
    cacheUrl.searchParams.set("token", TP_API_TOKEN);
    cacheUrl.searchParams.set("partnerId", TP_PARTNER_ID);

    const pricesResp = await fetch(cacheUrl.toString());
    if (!pricesResp.ok) {
      const txt = await pricesResp.text();
      return res.status(pricesResp.status).json({ error: "prices failed", detail: txt });
    }
    const arr = await pricesResp.json();

    const numericMax = Number(maxPrice);
    const items = (Array.isArray(arr) ? arr : [])
      .map(p => ({
        id: p.hotelId,
        name: p.hotelName ?? p.name ?? "Hotel",
        city: cityName,
        country: countryName || null,
        stars: p.stars ?? null,
        price: p.priceAvg ?? p.priceFrom ?? null,
        distance: p.distance ?? null,
        photo: p.photo ?? null,
      }))
      .filter(h => Number.isFinite(Number(h.price)))
      .filter(h => Number.isFinite(numericMax) ? Number(h.price) <= numericMax : true)
      .sort((a,b) => Number(a.price) - Number(b.price));

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({
      city: countryName ? `${cityName}, ${countryName}` : cityName,
      checkIn,
      checkOut,
      adults: Number(adults),
      count: items.length,
      items,
      ...(debug === "1" ? { debug: { locationId, rawCount: Array.isArray(arr) ? arr.length : 0, sample: (arr && arr[0]) || null } } : {})
    });
  } catch (e) {
    console.error("api/hotels error:", e);
    return res.status(500).json({ error: "failed", detail: String(e) });
  }
}
