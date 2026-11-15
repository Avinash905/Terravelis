import { io } from "socket.io-client";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const apiFetch = async (path, options = {}, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("API endpoint unavailable");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Request failed (${res.status})`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
};

const FALLBACK_CABLES = [
  { id: "2africa", name: "2Africa", capacity: "180 Tbps", lengthKm: 45000, waypoints: [[50.8, -4.5], [38.7, -9.1], [30.0, 31.2], [21.5, 39.2], [19.07, 72.87]] },
  { id: "marea", name: "MAREA Trans-Atlantic", capacity: "200 Tbps", lengthKm: 6605, waypoints: [[36.85, -75.97], [40.2, -45.0], [43.37, -3.01]] },
  { id: "faster", name: "FASTER Trans-Pacific", capacity: "60 Tbps", lengthKm: 11629, waypoints: [[43.36, -124.2], [38.0, -165.0], [34.3, 136.8]] },
  { id: "sea-me-we-6", name: "SEA-ME-WE 6", capacity: "126 Tbps", lengthKm: 19200, waypoints: [[43.29, 5.37], [31.2, 29.9], [19.07, 72.87], [13.08, 80.27], [1.35, 103.82]] },
  { id: "southern-cross", name: "Southern Cross NEXT", capacity: "72 Tbps", lengthKm: 15840, waypoints: [[33.9, -118.4], [-18.1, 178.4], [-33.86, 151.2]] },
];

const FALLBACK_BEACONS = [
  { id: "fb-hyd", authorName: "Avinash", city: "Hyderabad", country: "India", lat: 17.385, lng: 78.4867, message: "Watching the planet's live chatter from HITEC City.", likes: 18 },
  { id: "fb-tok", authorName: "Kenji M.", city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, message: "Late night rain in Shibuya, tracking Pacific tremors.", likes: 11 },
  { id: "fb-rey", authorName: "Freyja", city: "Reykjavik", country: "Iceland", lat: 64.1466, lng: -21.9426, message: "Clear sub-arctic skies over Reykjanes.", likes: 14 },
  { id: "fb-sfo", authorName: "Maya Lin", city: "San Francisco", country: "United States", lat: 37.7749, lng: -122.4194, message: "Watching ISS cross the Pacific horizon.", likes: 9 },
];

// Direct browser-side resilience fallback in case free backend is waking from sleep or unconfigured
const fetchDirectBrowserFallbackSnapshot = async () => {
  const [quakeRes, eonetRes, issRes, radioRes] = await Promise.allSettled([
    fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson").then((r) =>
      r.json()
    ),
    fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=60").then((r) => r.json()),
    fetch("https://api.wheretheiss.at/v1/satellites/25544").then((r) => r.json()),
    fetch(
      "https://de1.api.radio-browser.info/json/stations/search?has_geo_info=true&is_https=true&hidebroken=true&order=clickcount&reverse=true&limit=90"
    ).then((r) => r.json()),
  ]);

  const earthquakes =
    quakeRes.status === "fulfilled"
      ? (quakeRes.value.features || []).slice(0, 90).map((f) => ({
          id: f.id,
          mag: Math.round(Number(f.properties?.mag || 0) * 10) / 10,
          place: f.properties?.place || "Seismic Zone",
          lng: Number(f.geometry?.coordinates?.[0] || 0),
          lat: Number(f.geometry?.coordinates?.[1] || 0),
          depth: Math.round(Number(f.geometry?.coordinates?.[2] || 0)),
          time: f.properties?.time || Date.now(),
          url: f.properties?.url || "",
        }))
      : [];

  const naturalEvents =
    eonetRes.status === "fulfilled"
      ? (eonetRes.value.events || [])
          .map((ev) => {
            const g = ev.geometry?.[ev.geometry.length - 1];
            if (!g || g.type !== "Point") return null;
            return {
              id: ev.id,
              title: ev.title,
              category: ev.categories?.[0]?.id || "natural",
              categoryLabel: ev.categories?.[0]?.title || "Natural Event",
              lng: Number(g.coordinates[0]),
              lat: Number(g.coordinates[1]),
              date: g.date,
              sourceUrl: ev.sources?.[0]?.url || "https://eonet.gsfc.nasa.gov/",
            };
          })
          .filter(Boolean)
      : [];

  const iss =
    issRes.status === "fulfilled"
      ? {
          lat: Number(issRes.value.latitude),
          lng: Number(issRes.value.longitude),
          altitudeKm: Math.round(Number(issRes.value.altitude || 418)),
          velocityKmh: Math.round(Number(issRes.value.velocity || 27580)),
          visibility: issRes.value.visibility || "daylight",
          orbitSegments: [],
        }
      : { lat: 18.4, lng: 72.8, altitudeKm: 418, velocityKmh: 27580, orbitSegments: [] };

  const radios =
    radioRes.status === "fulfilled"
      ? (radioRes.value || [])
          .filter((s) => s.url_resolved?.startsWith("https://") && s.geo_lat && s.geo_long)
          .slice(0, 60)
          .map((s) => ({
            id: s.stationuuid,
            name: (s.name || "Live Radio").trim().slice(0, 60),
            country: s.country || "",
            countryCode: s.countrycode || "",
            state: s.state || "",
            lat: Number(s.geo_lat),
            lng: Number(s.geo_long),
            streamUrl: s.url_resolved,
            tags: [],
            bitrate: s.bitrate || 128,
          }))
      : [];

  return {
    earthquakes,
    naturalEvents,
    iss,
    astronauts: { count: 10, people: [] },
    launches: [
      {
        id: "fb-isro",
        name: "LVM3 | Orbital Mission",
        provider: "ISRO",
        location: "Sriharikota, India",
        lat: 13.7199,
        lng: 80.2304,
        net: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
      },
      {
        id: "fb-spx",
        name: "Falcon 9 | Starlink Group",
        provider: "SpaceX",
        location: "Cape Canaveral, USA",
        lat: 28.5619,
        lng: -80.5773,
        net: new Date(Date.now() + 1000 * 60 * 60 * 14).toISOString(),
      },
    ],
    radios,
    cables: FALLBACK_CABLES,
    beacons: FALLBACK_BEACONS,
    chatter: earthquakes.slice(0, 8).map((q) => ({
      id: `q-${q.id}`,
      kind: "earthquake",
      title: `M${q.mag} Seismic Event`,
      subtitle: q.place,
      lat: q.lat,
      lng: q.lng,
      time: q.time,
    })),
  };
};

export const fetchSnapshot = async () => {
  try {
    return await apiFetch("/api/telemetry/snapshot", {}, 10000);
  } catch {
    return fetchDirectBrowserFallbackSnapshot();
  }
};

export const fetchPlaceIntel = async (lat, lng) => {
  try {
    return await apiFetch(`/api/telemetry/place?lat=${lat}&lng=${lng}`, {}, 11000);
  } catch {
    const [geo, weather, wiki] = await Promise.allSettled([
      fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      ).then((r) => r.json()),
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,uv_index&timezone=auto`
      ).then((r) => r.json()),
      fetch(
        `https://en.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}|${lng}&ggsradius=10000&ggslimit=10&prop=pageimages|extracts|coordinates|info&pithumbsize=600&exintro=1&explaintext=1&exchars=220&inprop=url&format=json&origin=*`
      ).then((r) => r.json()),
    ]);

    const g = geo.status === "fulfilled" ? geo.value : {};
    const w = weather.status === "fulfilled" ? weather.value?.current : null;
    const pages = wiki.status === "fulfilled" ? Object.values(wiki.value?.query?.pages || {}) : [];

    return {
      coordinates: { lat, lng },
      location: {
        name: g.city || g.locality || g.principalSubdivision || "Selected Point",
        subdivision: g.principalSubdivision || "",
        countryName: g.countryName || "International Waters",
        countryCode: g.countryCode || "",
        continent: g.continent || "",
        isOcean: !g.countryCode,
        timezone: weather.status === "fulfilled" ? weather.value?.timezone || "UTC" : "UTC",
      },
      country: g.countryCode
        ? {
            commonName: g.countryName,
            officialName: g.countryName,
            flagSvg: `https://flagcdn.com/${g.countryCode.toLowerCase()}.svg`,
            capital: "",
            population: 0,
            region: g.continent || "",
            currencies: [],
            languages: [],
          }
        : null,
      weather: w
        ? {
            tempC: Math.round(w.temperature_2m * 10) / 10,
            feelsLikeC: Math.round(w.apparent_temperature * 10) / 10,
            humidity: w.relative_humidity_2m,
            isDay: Boolean(w.is_day),
            weatherCode: w.weather_code,
            windKmh: Math.round(w.wind_speed_10m),
            uvIndex: w.uv_index ?? null,
            usAqi: null,
          }
        : null,
      landmarks: pages.map((p) => ({
        id: String(p.pageid),
        title: p.title,
        description: p.extract || "",
        thumbnail: p.thumbnail?.source || null,
        lat: p.coordinates?.[0]?.lat ?? null,
        lng: p.coordinates?.[0]?.lon ?? null,
        distKm: null,
        url: p.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title)}`,
      })),
      aircraft: [],
      radios: [],
      nearbyEvents: { earthquakes: [], naturalEvents: [], launches: [] },
      nearbyBeacons: [],
    };
  }
};

export const searchWorldQuery = async (q) => {
  try {
    const data = await apiFetch(`/api/telemetry/search?q=${encodeURIComponent(q)}`, {}, 6000);
    return data.results || [];
  } catch {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        q
      )}&count=8&language=en&format=json`
    ).then((r) => r.json());
    return (res?.results || []).map((r) => ({
      id: `city-${r.id}`,
      type: "place",
      title: r.name,
      subtitle: [r.admin1, r.country].filter(Boolean).join(", "),
      countryCode: r.country_code || "",
      lat: r.latitude,
      lng: r.longitude,
    }));
  }
};

export const createBeacon = (payload, token) =>
  apiFetch("/api/beacons", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  });

export const pulseBeacon = (id) =>
  apiFetch(`/api/beacons/${id}/pulse`, {
    method: "POST",
  });

export const loginUser = (credentials) =>
  apiFetch("/api/user/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

export const registerUser = (payload) =>
  apiFetch("/api/user/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchMe = (token) =>
  apiFetch("/api/user/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const addWatchlistItem = (item, token) =>
  apiFetch("/api/user/watchlist", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(item),
  });

export const removeWatchlistItem = (itemId, token) =>
  apiFetch(`/api/user/watchlist/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

export const resolveUserCoordinates = () =>
  new Promise((resolve, reject) => {
    const fallbackByIp = async () => {
      try {
        const ipGeo = await fetch("https://get.geojs.io/v1/ip/geo.json", {
          signal: AbortSignal.timeout(4000),
        }).then((r) => r.json());
        const lat = Number(ipGeo.latitude);
        const lng = Number(ipGeo.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          return resolve({
            lat,
            lng,
            city: ipGeo.city || "",
            country: ipGeo.country || "",
            countryCode: ipGeo.country_code || "",
          });
        }
      } catch {
        // Ignore IP fallback failure
      }
      return reject(new Error("Could not determine location"));
    };

    if (!navigator.geolocation) {
      fallbackByIp();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          city: "",
          country: "",
          countryCode: "",
        }),
      () => fallbackByIp(),
      { timeout: 2800, maximumAge: 120000 }
    );
  });

export const connectRealtimeSocket = (handlers = {}) => {
  const isLocalDev =
    !API_BASE &&
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  if (!API_BASE && !isLocalDev && typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app")) {
    // Static Vercel deployment without VITE_API_BASE_URL set — skip pointless WS retries
    return { disconnect: () => {} };
  }
  const socketUrl =
    API_BASE ||
    (window.location.port === "5173" ? "http://localhost:5050" : window.location.origin);
  const socket = io(socketUrl, {
    transports: ["websocket", "polling"],
    reconnectionAttempts: 8,
    reconnectionDelay: 3000,
  });

  if (handlers.onIss) socket.on("iss:update", handlers.onIss);
  if (handlers.onWikiSpark) socket.on("wiki:spark", handlers.onWikiSpark);
  if (handlers.onEarthRefresh) socket.on("earth:refresh", handlers.onEarthRefresh);
  if (handlers.onBeaconNew) socket.on("beacon:new", handlers.onBeaconNew);
  if (handlers.onBeaconPulse) socket.on("beacon:pulse", handlers.onBeaconPulse);
  if (handlers.onPresence) socket.on("presence:count", handlers.onPresence);

  return socket;
};
