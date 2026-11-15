const USER_AGENT =
  "ChatterBoxEarth/2.0 (https://github.com/Avinash905/ChatterBox; contact: avinash.90527@gmail.com)";

const cache = new Map();

const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) return null;
  return entry.data;
};

const getStale = (key) => cache.get(key)?.data ?? null;

const setCached = (key, data, ttlMs) => {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
};

const fetchJson = async (url, timeoutMs = 8500, extraHeaders = {}) => {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      ...extraHeaders,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};

const SUBMARINE_CABLES = [
  {
    id: "2africa",
    name: "2Africa",
    capacity: "180 Tbps",
    lengthKm: 45000,
    owners: "Meta, Vodafone, MTN, Orange",
    color: "#38bdf8",
    waypoints: [
      [50.8, -4.5],
      [38.7, -9.1],
      [30.0, 31.2],
      [21.5, 39.2],
      [19.07, 72.87],
    ],
  },
  {
    id: "marea",
    name: "MAREA Trans-Atlantic",
    capacity: "200 Tbps",
    lengthKm: 6605,
    owners: "Microsoft, Meta, Telxius",
    color: "#22d3ee",
    waypoints: [
      [36.85, -75.97],
      [40.2, -45.0],
      [43.37, -3.01],
    ],
  },
  {
    id: "grace-hopper",
    name: "Grace Hopper",
    capacity: "352 Tbps",
    lengthKm: 6250,
    owners: "Google",
    color: "#818cf8",
    waypoints: [
      [40.73, -73.0],
      [46.0, -35.0],
      [50.83, -4.55],
    ],
  },
  {
    id: "faster",
    name: "FASTER Trans-Pacific",
    capacity: "60 Tbps",
    lengthKm: 11629,
    owners: "Google, KDDI, Singtel, China Mobile",
    color: "#34d399",
    waypoints: [
      [43.36, -124.2],
      [38.0, -165.0],
      [34.3, 136.8],
    ],
  },
  {
    id: "jupiter",
    name: "JUPITER",
    capacity: "60 Tbps",
    lengthKm: 14557,
    owners: "Amazon, Meta, SoftBank, NTT",
    color: "#2dd4bf",
    waypoints: [
      [33.86, -118.4],
      [26.0, -165.0],
      [35.3, 139.9],
      [14.5, 120.9],
    ],
  },
  {
    id: "sea-me-we-6",
    name: "SEA-ME-WE 6",
    capacity: "126 Tbps",
    lengthKm: 19200,
    owners: "Airtel, Singtel, Orange, Telekom Malaysia",
    color: "#f472b6",
    waypoints: [
      [43.29, 5.37],
      [31.2, 29.9],
      [19.07, 72.87],
      [13.08, 80.27],
      [1.35, 103.82],
    ],
  },
  {
    id: "southern-cross-next",
    name: "Southern Cross NEXT",
    capacity: "72 Tbps",
    lengthKm: 15840,
    owners: "Southern Cross Cables, Telstra",
    color: "#60a5fa",
    waypoints: [
      [33.9, -118.4],
      [-18.1, 178.4],
      [-33.86, 151.2],
    ],
  },
  {
    id: "ellalink",
    name: "EllaLink Europe-South America",
    capacity: "72 Tbps",
    lengthKm: 6200,
    owners: "EllaLink",
    color: "#a78bfa",
    waypoints: [
      [37.95, -8.87],
      [14.9, -23.5],
      [-3.73, -38.52],
    ],
  },
  {
    id: "equiano",
    name: "Equiano",
    capacity: "144 Tbps",
    lengthKm: 15000,
    owners: "Google",
    color: "#38bdf8",
    waypoints: [
      [38.72, -9.14],
      [6.45, 3.39],
      [-33.92, 18.42],
    ],
  },
  {
    id: "curie",
    name: "Curie",
    capacity: "72 Tbps",
    lengthKm: 10476,
    owners: "Google",
    color: "#c084fc",
    waypoints: [
      [33.92, -118.43],
      [8.98, -79.52],
      [-33.04, -71.61],
    ],
  },
];

const FALLBACK_LAUNCHES = [
  {
    id: "fallback-isro-lvm3",
    name: "LVM3 | Gaganyaan Orbital Test",
    provider: "ISRO",
    rocket: "LVM3",
    padName: "Second Launch Pad",
    location: "Satish Dhawan Space Centre, Sriharikota, India",
    lat: 13.7199,
    lng: 80.2304,
    net: new Date(Date.now() + 1000 * 60 * 60 * 38).toISOString(),
    status: "Go for Launch",
    mission: "Orbital flight validation and telemetry relay demonstration from Sriharikota.",
  },
  {
    id: "fallback-spacex-starlink",
    name: "Falcon 9 Block 5 | Starlink Group",
    provider: "SpaceX",
    rocket: "Falcon 9 Block 5",
    padName: "SLC-40",
    location: "Cape Canaveral SFS, FL, USA",
    lat: 28.5619,
    lng: -80.5773,
    net: new Date(Date.now() + 1000 * 60 * 60 * 11).toISOString(),
    status: "Go for Launch",
    mission: "Low-Earth orbit broadband constellation deployment.",
  },
  {
    id: "fallback-starship",
    name: "Starship | Integrated Flight Test",
    provider: "SpaceX",
    rocket: "Starship / Super Heavy",
    padName: "Orbital Launch Mount A",
    location: "Starbase, Boca Chica, TX, USA",
    lat: 25.9968,
    lng: -97.1544,
    net: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString(),
    status: "To Be Confirmed",
    mission: "Heavy-lift orbital flight and booster catch test.",
  },
  {
    id: "fallback-esa-ariane6",
    name: "Ariane 62 | Galileo Navigation",
    provider: "Arianespace",
    rocket: "Ariane 62",
    padName: "ELA-4",
    location: "Guiana Space Centre, Kourou, French Guiana",
    lat: 5.255,
    lng: -52.789,
    net: new Date(Date.now() + 1000 * 60 * 60 * 64).toISOString(),
    status: "Go for Launch",
    mission: "Medium-Earth orbit navigation satellite deployment.",
  },
  {
    id: "fallback-rocketlab",
    name: "Electron | Earth Observation",
    provider: "Rocket Lab",
    rocket: "Electron",
    padName: "Launch Complex 1A",
    location: "Mahia Peninsula, New Zealand",
    lat: -39.2615,
    lng: 177.8649,
    net: new Date(Date.now() + 1000 * 60 * 60 * 52).toISOString(),
    status: "Go for Launch",
    mission: "Dedicated sun-synchronous Earth imaging satellite launch.",
  },
  {
    id: "fallback-jaxa",
    name: "H3-22S | ALOS Radar Mission",
    provider: "JAXA",
    rocket: "H3",
    padName: "Yoshinobu Launch Complex LP-2",
    location: "Tanegashima Space Center, Japan",
    lat: 30.4008,
    lng: 130.9777,
    net: new Date(Date.now() + 1000 * 60 * 60 * 128).toISOString(),
    status: "To Be Confirmed",
    mission: "Advanced L-band synthetic aperture radar Earth observation satellite.",
  },
];

const WIKI_HUBS = {
  enwiki: [
    { city: "New York, USA", lat: 40.7128, lng: -74.006 },
    { city: "London, UK", lat: 51.5074, lng: -0.1278 },
    { city: "Bengaluru, India", lat: 12.9716, lng: 77.5946 },
    { city: "San Francisco, USA", lat: 37.7749, lng: -122.4194 },
    { city: "Sydney, Australia", lat: -33.8688, lng: 151.2093 },
    { city: "Toronto, Canada", lat: 43.6532, lng: -79.3832 },
  ],
  jawiki: [{ city: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 }],
  hiwiki: [{ city: "New Delhi, India", lat: 28.6139, lng: 77.209 }],
  tewiki: [{ city: "Hyderabad, India", lat: 17.385, lng: 78.4867 }],
  tawiki: [{ city: "Chennai, India", lat: 13.0827, lng: 80.2707 }],
  bnwiki: [{ city: "Kolkata, India", lat: 22.5726, lng: 88.3639 }],
  dewiki: [{ city: "Berlin, Germany", lat: 52.52, lng: 13.405 }],
  frwiki: [{ city: "Paris, France", lat: 48.8566, lng: 2.3522 }],
  eswiki: [
    { city: "Madrid, Spain", lat: 40.4168, lng: -3.7038 },
    { city: "Mexico City, Mexico", lat: 19.4326, lng: -99.1332 },
    { city: "Buenos Aires, Argentina", lat: -34.6037, lng: -58.3816 },
  ],
  ptwiki: [
    { city: "Sao Paulo, Brazil", lat: -23.5505, lng: -46.6333 },
    { city: "Lisbon, Portugal", lat: 38.7223, lng: -9.1393 },
  ],
  itwiki: [{ city: "Rome, Italy", lat: 41.9028, lng: 12.4964 }],
  ruwiki: [{ city: "Moscow, Russia", lat: 55.7558, lng: 37.6173 }],
  ukwiki: [{ city: "Kyiv, Ukraine", lat: 50.4501, lng: 30.5234 }],
  plwiki: [{ city: "Warsaw, Poland", lat: 52.2297, lng: 21.0122 }],
  nlwiki: [{ city: "Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041 }],
  svwiki: [{ city: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686 }],
  zhwiki: [
    { city: "Taipei, Taiwan", lat: 25.033, lng: 121.5654 },
    { city: "Hong Kong", lat: 22.3193, lng: 114.1694 },
    { city: "Singapore", lat: 1.3521, lng: 103.8198 },
  ],
  kowiki: [{ city: "Seoul, South Korea", lat: 37.5665, lng: 126.978 }],
  arwiki: [
    { city: "Cairo, Egypt", lat: 30.0444, lng: 31.2357 },
    { city: "Dubai, UAE", lat: 25.2048, lng: 55.2708 },
  ],
  trwiki: [{ city: "Istanbul, Turkey", lat: 41.0082, lng: 28.9784 }],
  idwiki: [{ city: "Jakarta, Indonesia", lat: -6.2088, lng: 106.8456 }],
  viwiki: [{ city: "Ho Chi Minh City, Vietnam", lat: 10.8231, lng: 106.6297 }],
  thwiki: [{ city: "Bangkok, Thailand", lat: 13.7563, lng: 100.5018 }],
  fawiki: [{ city: "Tehran, Iran", lat: 35.6892, lng: 51.389 }],
  hewiki: [{ city: "Tel Aviv, Israel", lat: 32.0853, lng: 34.7818 }],
  elwiki: [{ city: "Athens, Greece", lat: 37.9838, lng: 23.7275 }],
  fiwiki: [{ city: "Helsinki, Finland", lat: 60.1699, lng: 24.9384 }],
  nowiki: [{ city: "Oslo, Norway", lat: 59.9139, lng: 10.7522 }],
  cswiki: [{ city: "Prague, Czechia", lat: 50.0755, lng: 14.4378 }],
  rowiki: [{ city: "Bucharest, Romania", lat: 44.4268, lng: 26.1025 }],
};

const liveChatterBuffer = [];
const MAX_CHATTER = 55;

const pushChatter = (item) => {
  liveChatterBuffer.unshift(item);
  if (liveChatterBuffer.length > MAX_CHATTER) {
    liveChatterBuffer.length = MAX_CHATTER;
  }
};

const getLiveChatter = () => liveChatterBuffer;

const getEarthquakes = async () => {
  const cached = getCached("earthquakes");
  if (cached) return cached;

  try {
    const [dayRes, hourRes] = await Promise.allSettled([
      fetchJson("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"),
      fetchJson("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson"),
    ]);

    const features = [
      ...(hourRes.status === "fulfilled" ? hourRes.value.features || [] : []),
      ...(dayRes.status === "fulfilled" ? dayRes.value.features || [] : []),
    ];

    const seen = new Set();
    const quakes = [];

    for (const f of features) {
      if (!f?.id || seen.has(f.id)) continue;
      const coords = f.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) continue;
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      const depth = Number(coords[2] || 0);
      const mag = Number(f.properties?.mag || 0);
      if (Number.isNaN(lat) || Number.isNaN(lng) || mag < 0.8) continue;

      seen.add(f.id);
      quakes.push({
        id: f.id,
        mag: Math.round(mag * 10) / 10,
        place: f.properties?.place || "Offshore Seismic Zone",
        lat,
        lng,
        depth: Math.round(depth * 10) / 10,
        time: f.properties?.time || Date.now(),
        url: f.properties?.url || "",
        tsunami: Boolean(f.properties?.tsunami),
      });
    }

    quakes.sort((a, b) => b.time - a.time);
    const result = quakes.slice(0, 120);
    return setCached("earthquakes", result, 60 * 1000);
  } catch (err) {
    console.warn("[Telemetry] Earthquakes fallback:", err.message);
    return getStale("earthquakes") || [];
  }
};

const extractEonetCoords = (geomList) => {
  if (!Array.isArray(geomList) || geomList.length === 0) return null;
  const latest = geomList[geomList.length - 1];
  if (!latest?.coordinates) return null;

  if (latest.type === "Point" && latest.coordinates.length >= 2) {
    return {
      lng: Number(latest.coordinates[0]),
      lat: Number(latest.coordinates[1]),
      date: latest.date || new Date().toISOString(),
    };
  }

  if (latest.type === "Polygon" && Array.isArray(latest.coordinates[0])) {
    const ring = latest.coordinates[0];
    if (ring.length > 0) {
      const sum = ring.reduce(
        (acc, pt) => ({ lng: acc.lng + Number(pt[0]), lat: acc.lat + Number(pt[1]) }),
        { lng: 0, lat: 0 }
      );
      return {
        lng: sum.lng / ring.length,
        lat: sum.lat / ring.length,
        date: latest.date || new Date().toISOString(),
      };
    }
  }
  return null;
};

const getNaturalEvents = async () => {
  const cached = getCached("naturalEvents");
  if (cached) return cached;

  try {
    const data = await fetchJson(
      "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=85",
      10000
    );
    const events = [];
    for (const ev of data.events || []) {
      const pt = extractEonetCoords(ev.geometry);
      if (!pt || Number.isNaN(pt.lat) || Number.isNaN(pt.lng)) continue;
      const catId = ev.categories?.[0]?.id || "natural";
      const catTitle = ev.categories?.[0]?.title || "Natural Phenomenon";
      events.push({
        id: ev.id,
        title: ev.title,
        category: catId,
        categoryLabel: catTitle,
        lat: pt.lat,
        lng: pt.lng,
        date: pt.date,
        sourceUrl: ev.sources?.[0]?.url || "https://eonet.gsfc.nasa.gov/",
      });
    }
    return setCached("naturalEvents", events, 5 * 60 * 1000);
  } catch (err) {
    console.warn("[Telemetry] NASA EONET fallback:", err.message);
    return (
      getStale("naturalEvents") || [
        {
          id: "volcano-etna",
          title: "Mount Etna Volcanic Activity, Sicily",
          category: "volcanoes",
          categoryLabel: "Volcanoes",
          lat: 37.751,
          lng: 14.9934,
          date: new Date().toISOString(),
          sourceUrl: "https://volcano.si.edu/",
        },
        {
          id: "volcano-kilauea",
          title: "Kilauea Summit Thermal Activity, Hawaii",
          category: "volcanoes",
          categoryLabel: "Volcanoes",
          lat: 19.421,
          lng: -155.287,
          date: new Date().toISOString(),
          sourceUrl: "https://www.usgs.gov/volcanoes/kilauea",
        },
        {
          id: "volcano-reykjanes",
          title: "Reykjanes Peninsula Fissure Zone, Iceland",
          category: "volcanoes",
          categoryLabel: "Volcanoes",
          lat: 63.88,
          lng: -22.39,
          date: new Date().toISOString(),
          sourceUrl: "https://en.vedur.is/",
        },
      ]
    );
  }
};

let prevIssLat = null;
let movingSouth = false;

const computeIssOrbitSegments = (lat0, lng0, goingSouth) => {
  const inc = (51.64 * Math.PI) / 180;
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const normalizeLng = (l) => ((((l + 180) % 360) + 360) % 360) - 180;

  const sinRatio = Math.max(-1, Math.min(1, Math.sin(toRad(lat0)) / Math.sin(inc)));
  let u0 = Math.asin(sinRatio);
  if (goingSouth) u0 = Math.PI - u0;

  const baseOrbLng = toDeg(Math.atan2(Math.cos(inc) * Math.sin(u0), Math.cos(u0)));
  const raanOffset = lng0 - baseOrbLng;

  const omegaOrb = (2 * Math.PI) / (92.9 * 60);
  const omegaEarth = (2 * Math.PI) / 86164;

  const segments = [];
  let currentSeg = [];

  for (let min = -46; min <= 46; min += 2) {
    const dt = min * 60;
    const u = u0 + omegaOrb * dt;
    const lat = toDeg(Math.asin(Math.sin(inc) * Math.sin(u)));
    const orbLng = toDeg(Math.atan2(Math.cos(inc) * Math.sin(u), Math.cos(u)));
    const lng = normalizeLng(raanOffset + orbLng - toDeg(omegaEarth * dt));

    if (currentSeg.length > 0) {
      const prev = currentSeg[currentSeg.length - 1];
      if (Math.abs(lng - prev[1]) > 150) {
        if (currentSeg.length > 1) segments.push(currentSeg);
        currentSeg = [];
      }
    }
    currentSeg.push([Math.round(lat * 100) / 100, Math.round(lng * 100) / 100]);
  }
  if (currentSeg.length > 1) segments.push(currentSeg);
  return segments;
};

const getIssTelemetry = async () => {
  const cached = getCached("iss");
  if (cached) return cached;

  try {
    const data = await fetchJson("https://api.wheretheiss.at/v1/satellites/25544", 5000);
    const lat = Number(data.latitude);
    const lng = Number(data.longitude);
    if (prevIssLat !== null && Math.abs(lat - prevIssLat) > 0.001) {
      movingSouth = lat < prevIssLat;
    }
    prevIssLat = lat;

    const result = {
      lat,
      lng,
      altitudeKm: Math.round(Number(data.altitude || 418) * 10) / 10,
      velocityKmh: Math.round(Number(data.velocity || 27580)),
      visibility: data.visibility || "daylight",
      timestamp: Date.now(),
      orbitSegments: computeIssOrbitSegments(lat, lng, movingSouth),
    };
    return setCached("iss", result, 3500);
  } catch {
    return (
      getStale("iss") || {
        lat: 18.4,
        lng: 72.8,
        altitudeKm: 418.2,
        velocityKmh: 27585,
        visibility: "daylight",
        timestamp: Date.now(),
        orbitSegments: computeIssOrbitSegments(18.4, 72.8, false),
      }
    );
  }
};

const getAstronauts = async () => {
  const cached = getCached("astronauts");
  if (cached) return cached;

  try {
    const data = await fetchJson("http://api.open-notify.org/astros.json", 4500);
    if (data?.people) {
      const result = {
        count: data.number || data.people.length,
        people: data.people,
      };
      return setCached("astronauts", result, 60 * 60 * 1000);
    }
  } catch {
    // Fallback when HTTP open-notify times out
  }

  return setCached(
    "astronauts",
    {
      count: 10,
      people: [
        { name: "ISS Expedition Crew (7)", craft: "ISS" },
        { name: "Tiangong Orbital Crew (3)", craft: "Tiangong" },
      ],
    },
    30 * 60 * 1000
  );
};

const getUpcomingLaunches = async () => {
  const cached = getCached("launches");
  if (cached) return cached;

  try {
    const data = await fetchJson(
      "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=14&hide_recent_previous=true",
      8500
    );
    const items = [];
    for (const l of data.results || []) {
      const lat = Number(l.pad?.latitude);
      const lng = Number(l.pad?.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
      items.push({
        id: l.id,
        name: l.name,
        provider: l.launch_service_provider?.name || "Space Agency",
        rocket: l.rocket?.configuration?.full_name || l.rocket?.configuration?.name || "Orbital Vehicle",
        padName: l.pad?.name || "Launch Complex",
        location: l.pad?.location?.name || "Spaceport",
        lat,
        lng,
        net: l.net,
        status: l.status?.name || "Scheduled",
        mission: l.mission?.description || "Upcoming orbital spaceflight mission.",
        image: l.image || null,
      });
    }
    if (items.length > 0) {
      return setCached("launches", items, 20 * 60 * 1000);
    }
  } catch (err) {
    console.warn("[Telemetry] Rocket launches fallback:", err.message);
  }

  return setCached("launches", getStale("launches") || FALLBACK_LAUNCHES, 10 * 60 * 1000);
};

const RADIO_MIRRORS = [
  "https://de1.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
];

const fetchRadioBrowser = async (pathAndQuery, timeoutMs = 6000) => {
  let lastErr;
  for (const base of RADIO_MIRRORS) {
    try {
      return await fetchJson(`${base}${pathAndQuery}`, timeoutMs);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Radio mirrors unreachable");
};

const getWorldRadios = async () => {
  const cached = getCached("radios");
  if (cached) return cached;

  try {
    const raw = await fetchRadioBrowser(
      "/json/stations/search?has_geo_info=true&is_https=true&hidebroken=true&order=clickcount&reverse=true&limit=280"
    );

    const gridCounts = new Map();
    const stations = [];

    for (const s of raw || []) {
      const lat = Number(s.geo_lat);
      const lng = Number(s.geo_long);
      if (!s.url_resolved || Number.isNaN(lat) || Number.isNaN(lng)) continue;
      if (lat === 0 && lng === 0) continue;
      if (!s.url_resolved.startsWith("https://")) continue;

      const cell = `${Math.round(lat / 5)}:${Math.round(lng / 5)}`;
      const count = gridCounts.get(cell) || 0;
      if (count >= 2) continue;
      gridCounts.set(cell, count + 1);

      stations.push({
        id: s.stationuuid,
        name: (s.name || "Live Radio").trim().slice(0, 60),
        country: s.country || "",
        countryCode: s.countrycode || "",
        state: s.state || "",
        lat,
        lng,
        streamUrl: s.url_resolved,
        tags: (s.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 3),
        bitrate: s.bitrate || 128,
        favicon: s.favicon && s.favicon.startsWith("https://") ? s.favicon : null,
      });

      if (stations.length >= 95) break;
    }

    return setCached("radios", stations, 30 * 60 * 1000);
  } catch (err) {
    console.warn("[Telemetry] World radios fallback:", err.message);
    return getStale("radios") || [];
  }
};

const getSubmarineCables = () => SUBMARINE_CABLES;

const getGlobalSnapshot = async () => {
  const [earthquakes, naturalEvents, iss, astronauts, launches, radios] = await Promise.all([
    getEarthquakes(),
    getNaturalEvents(),
    getIssTelemetry(),
    getAstronauts(),
    getUpcomingLaunches(),
    getWorldRadios(),
  ]);

  if (liveChatterBuffer.length === 0) {
    for (const q of earthquakes.slice(0, 5)) {
      pushChatter({
        id: `quake-${q.id}`,
        kind: "earthquake",
        title: `M${q.mag} Seismic Event`,
        subtitle: q.place,
        lat: q.lat,
        lng: q.lng,
        time: q.time,
      });
    }
    for (const n of naturalEvents.slice(0, 4)) {
      pushChatter({
        id: `nasa-${n.id}`,
        kind: n.category === "volcanoes" ? "volcano" : "natural",
        title: n.title,
        subtitle: `NASA EONET • ${n.categoryLabel}`,
        lat: n.lat,
        lng: n.lng,
        time: Date.now() - 120000,
      });
    }
  }

  return {
    earthquakes,
    naturalEvents,
    iss,
    astronauts,
    launches,
    radios,
    cables: getSubmarineCables(),
    chatter: getLiveChatter(),
    timestamp: Date.now(),
  };
};

const MUNDANE_PLACE_RE =
  /\b(station|railway|metro stop|bus stop|high school|elementary school|middle school|university|college|hospital|post office|city hall|prefecture|municipality|constituency|district court|interchange|expressway)\b|^(list of |tourism in |outline of |history of )/i;

const fetchWikipediaLandmarks = async (lat, lng, fallbackQuery) => {
  const mapPages = (pagesObj, originLat, originLng, isPopularSearch = false) => {
    if (!pagesObj) return [];
    return Object.values(pagesObj)
      .filter((p) => p && p.title && !MUNDANE_PLACE_RE.test(p.title))
      .map((p) => {
        const pLat = p.coordinates?.[0]?.lat ?? null;
        const pLng = p.coordinates?.[0]?.lon ?? null;
        const distKm =
          pLat !== null && pLng !== null
            ? Math.round(haversineKm(originLat, originLng, pLat, pLng) * 10) / 10
            : null;
        return {
          id: String(p.pageid),
          title: p.title,
          description: (p.extract || "").trim(),
          thumbnail: p.thumbnail?.source || null,
          lat: pLat,
          lng: pLng,
          distKm,
          popular: isPopularSearch,
          url:
            p.fullurl ||
            `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`,
        };
      })
      .filter((item) =>
        isPopularSearch ? item.distKm !== null && item.distKm <= 75 : item.distKm === null || item.distKm <= 75
      );
  };

  try {
    const geoUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}|${lng}&ggsradius=10000&ggslimit=14&prop=pageimages|extracts|coordinates|info&pithumbsize=640&exintro=1&explaintext=1&exchars=220&inprop=url&format=json`;
    const searchPromise = fallbackQuery
      ? fetchJson(
          `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
            `${fallbackQuery} famous landmarks attractions monuments`
          )}&gsrlimit=8&prop=pageimages|extracts|coordinates|info&pithumbsize=640&exintro=1&explaintext=1&exchars=220&inprop=url&format=json`,
          3200
        ).catch(() => null)
      : Promise.resolve(null);

    const [geoData, searchData] = await Promise.all([
      fetchJson(geoUrl, 3200).catch(() => null),
      searchPromise,
    ]);

    const popularResults = mapPages(searchData?.query?.pages, lat, lng, true);
    const nearbyResults = mapPages(geoData?.query?.pages, lat, lng, false);

    const merged = [];
    const seen = new Set();

    for (const item of [...popularResults, ...nearbyResults]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }

    merged.sort((a, b) => {
      if (Boolean(b.thumbnail) !== Boolean(a.thumbnail)) {
        return b.thumbnail ? 1 : -1;
      }
      if (a.popular !== b.popular) {
        return a.popular ? -1 : 1;
      }
      return (a.distKm ?? 50) - (b.distKm ?? 50);
    });

    return merged.slice(0, 10).map(({ popular: _p, index: _i, ...clean }) => clean);
  } catch (err) {
    console.warn("[Telemetry] Wikipedia landmarks warning:", err.message);
    return [];
  }
};

let countriesMapPromise = null;

const getCountriesMap = async () => {
  if (!countriesMapPromise) {
    countriesMapPromise = fetchJson(
      "https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json",
      9000
    )
      .then((arr) => {
        const map = new Map();
        for (const c of arr || []) {
          if (c.cca2) map.set(c.cca2.toUpperCase(), c);
        }
        return map;
      })
      .catch(() => {
        countriesMapPromise = null;
        return new Map();
      });
  }
  return countriesMapPromise;
};

const fetchCountryProfile = async (countryCode) => {
  if (!countryCode || countryCode.length < 2) return null;
  const code = countryCode.toUpperCase();
  const key = `country:${code}`;
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const map = await getCountriesMap();
    const c = map.get(code);
    if (!c) return null;

    const currencies = Object.values(c.currencies || {})
      .map((cur) => `${cur.name}${cur.symbol ? ` (${cur.symbol})` : ""}`)
      .slice(0, 2);
    const languages = Object.values(c.languages || {}).slice(0, 4);

    let population = 0;
    try {
      const wb = await fetchJson(
        `https://api.worldbank.org/v2/country/${code}/indicator/SP.POP.TOTL?format=json&per_page=6`,
        1800
      );
      population = wb?.[1]?.find((entry) => entry?.value)?.value || 0;
    } catch {
      population = 0;
    }

    const profile = {
      officialName: c.name?.official || c.name?.common || "",
      commonName: c.name?.common || "",
      flagSvg: `https://flagcdn.com/${code.toLowerCase()}.svg`,
      capital: c.capital?.[0] || "",
      population,
      region: c.subregion || c.region || "",
      areaKm2: c.area || 0,
      currencies,
      languages,
    };
    return setCached(key, profile, 24 * 60 * 60 * 1000);
  } catch {
    return null;
  }
};

const fetchNearbyAircraft = async (lat, lng) => {
  try {
    const data = await fetchJson(
      `https://opendata.adsb.fi/api/v2/lat/${lat.toFixed(3)}/lon/${lng.toFixed(3)}/dist/140`,
      2800
    );
    const list = data?.aircraft || data?.ac || [];
    if (list.length > 0) {
      return list
        .filter((a) => typeof a.lat === "number" && typeof a.lon === "number")
        .map((a) => ({
          id: a.hex || `${a.lat}-${a.lon}`,
          callsign: (a.flight || a.r || "FLIGHT").trim(),
          model: a.desc || a.t || "Commercial Aircraft",
          altitudeFt: typeof a.alt_baro === "number" ? a.alt_baro : 0,
          speedKts: Math.round(Number(a.gs || 0)),
          heading: Number(a.track || 0),
          lat: a.lat,
          lng: a.lon,
          distKm: Math.round(haversineKm(lat, lng, a.lat, a.lon)),
        }))
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, 28);
    }
  } catch {
    // Fallback to OpenSky regional bounding box
  }

  try {
    const d = 1.8;
    const os = await fetchJson(
      `https://opensky-network.org/api/states/all?lamin=${(lat - d).toFixed(2)}&lomin=${(
        lng - d
      ).toFixed(2)}&lamax=${(lat + d).toFixed(2)}&lomax=${(lng + d).toFixed(2)}`,
      2500
    );
    return (os?.states || [])
      .filter((s) => typeof s[6] === "number" && typeof s[5] === "number")
      .map((s) => ({
        id: s[0],
        callsign: (s[1] || "FLIGHT").trim(),
        model: s[2] ? `${s[2]} Carrier` : "Commercial Aircraft",
        altitudeFt: Math.round(Number(s[7] || 0) * 3.28084),
        speedKts: Math.round(Number(s[9] || 0) * 1.94384),
        heading: Math.round(Number(s[10] || 0)),
        lat: s[6],
        lng: s[5],
        distKm: Math.round(haversineKm(lat, lng, s[6], s[5])),
      }))
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 28);
  } catch {
    return [];
  }
};

const fetchLocalRadios = async (lat, lng, countryCode) => {
  const globalRadios = await getWorldRadios();
  const nearbyFromGlobal = globalRadios
    .map((r) => ({ ...r, distKm: Math.round(haversineKm(lat, lng, r.lat, r.lng)) }))
    .filter((r) => r.distKm < 1400)
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 5);

  if (!countryCode) return nearbyFromGlobal;

  try {
    const byCountry = await fetchRadioBrowser(
      `/json/stations/search?countrycode=${encodeURIComponent(
        countryCode.toUpperCase()
      )}&is_https=true&hidebroken=true&order=clickcount&reverse=true&limit=8`,
      1700
    );
    const seen = new Set(nearbyFromGlobal.map((s) => s.streamUrl));
    const merged = [...nearbyFromGlobal];

    for (const s of byCountry || []) {
      if (!s.url_resolved || !s.url_resolved.startsWith("https://") || seen.has(s.url_resolved)) {
        continue;
      }
      seen.add(s.url_resolved);
      const sLat = Number(s.geo_lat);
      const sLng = Number(s.geo_long);
      const hasCoords = !Number.isNaN(sLat) && !Number.isNaN(sLng) && (sLat !== 0 || sLng !== 0);
      merged.push({
        id: s.stationuuid,
        name: (s.name || "Local Radio").trim().slice(0, 60),
        country: s.country || "",
        countryCode: s.countrycode || countryCode,
        state: s.state || "",
        lat: hasCoords ? sLat : lat,
        lng: hasCoords ? sLng : lng,
        distKm: hasCoords ? Math.round(haversineKm(lat, lng, sLat, sLng)) : null,
        streamUrl: s.url_resolved,
        tags: (s.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 3),
        bitrate: s.bitrate || 128,
        favicon: s.favicon && s.favicon.startsWith("https://") ? s.favicon : null,
      });
      if (merged.length >= 10) break;
    }

    return merged;
  } catch {
    return nearbyFromGlobal;
  }
};

const getPlaceIntelligence = async (rawLat, rawLng, beacons = []) => {
  const lat = Math.max(-89.9, Math.min(89.9, Number(rawLat)));
  const lng = ((((Number(rawLng) + 180) % 360) + 360) % 360) - 180;
  const gridKey = `place:${lat.toFixed(2)}:${lng.toFixed(2)}`;
  const cached = getCached(gridKey);
  if (cached) {
    return {
      ...cached,
      nearbyBeacons: beacons
        .map((b) => ({ ...b, distKm: Math.round(haversineKm(lat, lng, b.lat, b.lng)) }))
        .filter((b) => b.distKm <= 2000)
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, 6),
    };
  }

  let geo = null;
  try {
    geo = await fetchJson(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      5500
    );
  } catch {
    geo = null;
  }

  const city =
    geo?.city ||
    geo?.locality ||
    geo?.principalSubdivision ||
    geo?.localityInfo?.informative?.[0]?.name ||
    "Coordinates";
  const subdivision = geo?.principalSubdivision || "";
  const countryName = geo?.countryName || "";
  const countryCode = geo?.countryCode || "";
  const continent = geo?.continent || "";
  const oceanOrRegion =
    !countryName && geo?.localityInfo?.informative?.length
      ? geo.localityInfo.informative[geo.localityInfo.informative.length - 1]?.name
      : "";

  const fallbackPlaceQuery = [city !== "Coordinates" ? city : "", subdivision, countryName]
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  const [
    weatherRes,
    aqiRes,
    countryRes,
    landmarksRes,
    aircraftRes,
    radiosRes,
    quakes,
    naturalEvents,
    launches,
  ] = await Promise.all([
    fetchJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index&timezone=auto`,
      6000
    ).catch(() => null),
    fetchJson(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5,pm10`,
      5500
    ).catch(() => null),
    fetchCountryProfile(countryCode),
    fetchWikipediaLandmarks(lat, lng, fallbackPlaceQuery),
    fetchNearbyAircraft(lat, lng),
    fetchLocalRadios(lat, lng, countryCode),
    getEarthquakes(),
    getNaturalEvents(),
    getUpcomingLaunches(),
  ]);

  const nearbyQuakes = quakes
    .map((q) => ({ ...q, distKm: Math.round(haversineKm(lat, lng, q.lat, q.lng)) }))
    .filter((q) => q.distKm <= 2200)
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 6);

  const nearbyNatural = naturalEvents
    .map((e) => ({ ...e, distKm: Math.round(haversineKm(lat, lng, e.lat, e.lng)) }))
    .filter((e) => e.distKm <= 2500)
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 6);

  const nearbyLaunches = launches
    .map((l) => ({ ...l, distKm: Math.round(haversineKm(lat, lng, l.lat, l.lng)) }))
    .filter((l) => l.distKm <= 3500)
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 4);

  const currentW = weatherRes?.current;
  const currentAqi = aqiRes?.current;

  const basePayload = {
    coordinates: {
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
    },
    location: {
      name: city !== "Coordinates" ? city : oceanOrRegion || "Open Horizon",
      subdivision,
      countryName: countryName || oceanOrRegion || "International Waters",
      countryCode,
      continent,
      isOcean: !countryCode,
      timezone: weatherRes?.timezone || "UTC",
      utcOffsetSeconds: weatherRes?.utc_offset_seconds ?? 0,
    },
    country: countryRes,
    weather: currentW
      ? {
          tempC: Math.round(currentW.temperature_2m * 10) / 10,
          feelsLikeC: Math.round(currentW.apparent_temperature * 10) / 10,
          humidity: currentW.relative_humidity_2m,
          isDay: Boolean(currentW.is_day),
          precipitationMm: currentW.precipitation,
          weatherCode: currentW.weather_code,
          windKmh: Math.round(currentW.wind_speed_10m),
          windDeg: currentW.wind_direction_10m,
          uvIndex:
            typeof currentW.uv_index === "number"
              ? Math.round(currentW.uv_index * 10) / 10
              : null,
          usAqi: currentAqi?.us_aqi ?? null,
          pm25: currentAqi?.pm2_5 ?? null,
        }
      : null,
    landmarks: landmarksRes,
    aircraft: aircraftRes,
    radios: radiosRes,
    nearbyEvents: {
      earthquakes: nearbyQuakes,
      naturalEvents: nearbyNatural,
      launches: nearbyLaunches,
    },
  };

  setCached(gridKey, basePayload, 8 * 60 * 1000);

  return {
    ...basePayload,
    nearbyBeacons: beacons
      .map((b) => ({ ...b, distKm: Math.round(haversineKm(lat, lng, b.lat, b.lng)) }))
      .filter((b) => b.distKm <= 2000)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 6),
  };
};

const searchWorld = async (rawQuery) => {
  const q = (rawQuery || "").trim();
  if (q.length < 2) return [];

  const [geoRes, quakes, naturalEvents, launches] = await Promise.all([
    fetchJson(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        q
      )}&count=8&language=en&format=json`,
      5000
    ).catch(() => ({ results: [] })),
    getEarthquakes(),
    getNaturalEvents(),
    getUpcomingLaunches(),
  ]);

  const lower = q.toLowerCase();
  const matches = [];

  for (const r of geoRes?.results || []) {
    matches.push({
      id: `city-${r.id}`,
      type: "place",
      title: r.name,
      subtitle: [r.admin1, r.country].filter(Boolean).join(", "),
      countryCode: r.country_code || "",
      lat: r.latitude,
      lng: r.longitude,
      population: r.population || 0,
    });
  }

  for (const l of launches) {
    if (
      l.name.toLowerCase().includes(lower) ||
      l.location.toLowerCase().includes(lower) ||
      l.provider.toLowerCase().includes(lower)
    ) {
      matches.push({
        id: `launch-${l.id}`,
        type: "launch",
        title: l.name,
        subtitle: `${l.provider} • ${l.location}`,
        lat: l.lat,
        lng: l.lng,
      });
    }
  }

  for (const ev of naturalEvents) {
    if (ev.title.toLowerCase().includes(lower) || ev.categoryLabel.toLowerCase().includes(lower)) {
      matches.push({
        id: `event-${ev.id}`,
        type: "natural",
        title: ev.title,
        subtitle: `NASA Live • ${ev.categoryLabel}`,
        lat: ev.lat,
        lng: ev.lng,
      });
    }
  }

  for (const eq of quakes.slice(0, 40)) {
    if (eq.place.toLowerCase().includes(lower)) {
      matches.push({
        id: `quake-${eq.id}`,
        type: "earthquake",
        title: `M${eq.mag} • ${eq.place}`,
        subtitle: `Depth ${eq.depth} km`,
        lat: eq.lat,
        lng: eq.lng,
      });
    }
  }

  return matches.slice(0, 12);
};

let wikiRunning = false;
let issInterval = null;
let globalRefreshInterval = null;

const connectWikimediaStream = async (io, hasClients) => {
  if (wikiRunning) return;
  wikiRunning = true;

  let lastEmit = 0;

  while (wikiRunning) {
    if (!hasClients()) {
      await new Promise((r) => setTimeout(r, 4000));
      continue;
    }

    try {
      const res = await fetch("https://stream.wikimedia.org/v2/stream/recentchange", {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/event-stream",
        },
      });

      if (!res.ok || !res.body) {
        throw new Error(`Wikimedia SSE status ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (wikiRunning && hasClients()) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const now = Date.now();
          if (now - lastEmit < 900) continue;

          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.type !== "edit" || payload.namespace !== 0 || payload.bot) continue;
            const hubs = WIKI_HUBS[payload.wiki];
            if (!hubs || !payload.title) continue;

            const hub = hubs[Math.floor(Math.random() * hubs.length)];
            const jitterLat = (Math.random() - 0.5) * 1.8;
            const jitterLng = (Math.random() - 0.5) * 1.8;
            const deltaBytes = (payload.length?.new || 0) - (payload.length?.old || 0);

            const spark = {
              id: `wiki-${now}-${Math.random().toString(36).slice(2, 7)}`,
              kind: "wiki",
              wiki: payload.wiki.replace("wiki", "").toUpperCase(),
              title: payload.title,
              user: payload.user || "Contributor",
              deltaBytes,
              hubCity: hub.city,
              lat: Math.round((hub.lat + jitterLat) * 1000) / 1000,
              lng: Math.round((hub.lng + jitterLng) * 1000) / 1000,
              url: payload.meta?.uri || `https://${payload.server_name || "en.wikipedia.org"}/wiki/${encodeURIComponent(payload.title)}`,
              time: now,
            };

            lastEmit = now;
            pushChatter({
              id: spark.id,
              kind: "wiki",
              title: spark.title,
              subtitle: `Edited on ${spark.wiki} Wikipedia • ${hub.city}`,
              lat: spark.lat,
              lng: spark.lng,
              url: spark.url,
              time: now,
            });
            io.emit("wiki:spark", spark);
          } catch {
            // Ignore malformed SSE chunks
          }
        }
      }

      try {
        await reader.cancel();
      } catch {
        // Ignore cancel errors
      }
    } catch {
      await new Promise((r) => setTimeout(r, 6000));
    }
  }
};

const startRealtimeLoops = (io, getClientCount) => {
  const hasClients = () => getClientCount() > 0;

  getGlobalSnapshot().catch(() => {});
  getCountriesMap().catch(() => {});

  if (!issInterval) {
    issInterval = setInterval(async () => {
      if (!hasClients()) return;
      const iss = await getIssTelemetry();
      io.emit("iss:update", iss);
    }, 4500);
  }

  if (!globalRefreshInterval) {
    globalRefreshInterval = setInterval(async () => {
      if (!hasClients()) return;
      const [earthquakes, naturalEvents] = await Promise.all([
        getEarthquakes(),
        getNaturalEvents(),
      ]);
      io.emit("earth:refresh", { earthquakes, naturalEvents, timestamp: Date.now() });
    }, 65 * 1000);
  }

  connectWikimediaStream(io, hasClients);
};

module.exports = {
  getGlobalSnapshot,
  getPlaceIntelligence,
  searchWorld,
  startRealtimeLoops,
  pushChatter,
  getLiveChatter,
};
