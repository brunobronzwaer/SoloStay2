// pages/api/hotels.js
// Server-side proxy naar Hotellook (Travelpayouts)

export default async function handler(req, res) {
  try {
    const {
      city = "",
      checkIn = "",
      checkOut = "",
      adults = "1",
      lang = "nl",
      limit = "12",
    } = req.query;

    if (!city) return res.status(400).json({ error: "city is required" });

    const TP_API_TOKEN = process.env.TP_API_TOKEN || "2078fe1e506ad018ec23a168c48277f4";
    const TP_PARTNER_ID = process.env.TP_PARTNER_ID || "669798";

    // 1) City lookup -> haal nette stadsnaam op (bv. "Lisbon")
    const lookupUrl = new URL("https://engine.hotellook.com/api/v2/lookup.json");
    lookupUrl.searchParams.set("query", city);
    lookupUrl.searchParams.set("lang", lang);
    lookupUrl.searchParams.set("lookFor", "both");
    lookupUrl.searchParams.set("limit", "1");
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
      lookup?.results?.hotels?.[0] ||
      null;

    if (!loc) return res.status(404).json({ error: "No location found" });

    // Maak nette strings
    const cityName =
      loc?.cityName || loc?.name || city; // bv. "Lisbon"
    const countryName = loc?.countryName || loc?.country || "";
    const locationLabel = countryName ? `${cityName}, ${countryName}` : cityName;

    // 2) Prices via cache endpoint – gebruik de correcte params
    const cacheUrl = new URL("https://engine.hotellook.com/api/v2/cache.json");
    cacheUrl.searchParams.set("city", cityName);
    cacheUrl.searchParams.set("checkIn", checkIn);
    cacheUrl.searchParams.set("checkOut", checkOut);
    cacheUrl.searchParams.set("adultsCount", String(adults || "1"));
    cacheUrl.searchParams.set("limit", String(limit));
    cacheUrl.searchParams.set("token", TP_API_TOKEN);
    cacheUrl.searchParams.set("partnerId", TP_PARTNER_ID);

    const pricesResp = await fetch(cacheUrl.toString());
    if (!pricesResp.ok) {
      const txt = await pricesResp.text();
      return res.status(pricesResp.status).json({ error: "prices failed", detail: txt });
    }

    const prices = await pricesResp.json();
    const arr = Array.isArray(prices) ? prices : [];

    // 3) Laat keys zoveel mogelijk intact en maak city tot string
    const items = arr.map((p) => ({
      id: p.hotelId,                                // laat numeriek/primair id intact
      name: p.hotelName ?? p.name ?? "Unknown",
      city: cityName,                               // string (geen object)
      country: countryName || null,
      stars: p.stars ?? null,
      price: p.priceAvg ?? p.priceFrom ?? null,
      distance: p.distance ?? null,
      photo: p.photo ?? null,                       // alleen doorgeven als beschikbaar
      // Je kunt hier extra eigen velden toevoegen, maar verander bestaande niet
      raw: undefined,                               // TIP: zet evt. raw:p om te debuggen
    }));

    // Output
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({
      city: locationLabel,
      checkIn,
      checkOut,
      adults: Number(adults),
      count: items.length,
      items,
    });
  } catch (e) {
    console.error("api/hotels error:", e);
    return res.status(500).json({ error: "failed", detail: String(e) });
  }
}
