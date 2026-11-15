export const formatCoords = (lat, lng) => {
  if (typeof lat !== "number" || typeof lng !== "number") return "0.00°, 0.00°";
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)}° ${latDir}, ${Math.abs(lng).toFixed(3)}° ${lngDir}`;
};

export const formatRelativeTime = (ts) => {
  if (!ts) return "just now";
  const timeMs = typeof ts === "number" ? ts : new Date(ts).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - timeMs) / 1000));
  if (diffSec < 8) return "live";
  if (diffSec < 60) return `${diffSec}s ago`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const formatCountdown = (isoDate) => {
  if (!isoDate) return "TBD";
  const diffMs = new Date(isoDate).getTime() - Date.now();
  if (Number.isNaN(diffMs)) return "TBD";
  if (diffMs <= 0) return "IN FLIGHT / LAUNCHED";

  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hrs = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");

  if (days > 0) {
    return `T-${days}d ${pad(hrs)}h ${pad(mins)}m`;
  }
  return `T-${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
};

export const formatLocalClock = (timezone, utcOffsetSeconds = 0) => {
  try {
    if (timezone && timezone !== "UTC") {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date());
    }
  } catch {
    // Fallback to manual UTC offset
  }
  const shifted = new Date(Date.now() + utcOffsetSeconds * 1000);
  return shifted.toISOString().slice(11, 19) + " LOCAL";
};

export const describeWeatherCode = (code, isDay = true) => {
  const map = {
    0: { label: isDay ? "Clear Sunshine" : "Clear Starry Sky", tone: "sky" },
    1: { label: "Mostly Clear", tone: "sky" },
    2: { label: "Partly Cloudy", tone: "slate" },
    3: { label: "Overcast Cloud Deck", tone: "slate" },
    45: { label: "Coastal / Valley Fog", tone: "slate" },
    48: { label: "Rime Fog", tone: "slate" },
    51: { label: "Light Mist Drizzle", tone: "cyan" },
    53: { label: "Moderate Drizzle", tone: "cyan" },
    55: { label: "Dense Drizzle", tone: "cyan" },
    61: { label: "Light Rain", tone: "blue" },
    63: { label: "Steady Rain", tone: "blue" },
    65: { label: "Heavy Downpour", tone: "indigo" },
    71: { label: "Light Snowfall", tone: "sky" },
    73: { label: "Moderate Snow", tone: "sky" },
    75: { label: "Heavy Blizzard Snow", tone: "indigo" },
    80: { label: "Passing Rain Showers", tone: "blue" },
    81: { label: "Squall Showers", tone: "blue" },
    82: { label: "Intense Rain Showers", tone: "indigo" },
    95: { label: "Thunderstorm Activity", tone: "amber" },
    96: { label: "Thunderstorm & Hail", tone: "rose" },
    99: { label: "Severe Hailstorm", tone: "rose" },
  };
  return map[code] || { label: "Atmospheric Conditions", tone: "slate" };
};

export const describeAqi = (aqi) => {
  if (aqi === null || aqi === undefined) {
    return { label: "AQI N/A", dot: "#52525b" };
  }
  if (aqi <= 50) {
    return { label: `AQI ${aqi} · Good`, dot: "#22c55e" };
  }
  if (aqi <= 100) {
    return { label: `AQI ${aqi} · Moderate`, dot: "#eab308" };
  }
  if (aqi <= 150) {
    return { label: `AQI ${aqi} · Elevated`, dot: "#f97316" };
  }
  return { label: `AQI ${aqi} · Poor`, dot: "#ef4444" };
};

export const formatCompactNumber = (num) => {
  if (!num || Number.isNaN(Number(num))) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    Number(num)
  );
};

export const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(a))));
};

export const estimateFlightDuration = (distKm) => {
  if (!distKm || distKm < 25) return "< 15m";
  const totalMinutes = Math.round((distKm / 850) * 60 + 30);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${String(mins).padStart(2, "0")}m`;
};

export const formatUtcMinutes = (totalMins) => {
  const normalized = ((Math.round(totalMins) % 1440) + 1440) % 1440;
  const h = String(Math.floor(normalized / 60)).padStart(2, "0");
  const m = String(normalized % 60).padStart(2, "0");
  return `${h}:${m} UTC`;
};

export const computeGreatCircleRoute = (lat1, lng1, lat2, lng2, steps = 72) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;

  const toVec = (lat, lng) => {
    const phi = toRad(lat);
    const lam = toRad(lng);
    return [
      Math.cos(phi) * Math.cos(lam),
      Math.cos(phi) * Math.sin(lam),
      Math.sin(phi),
    ];
  };

  const toLatLng = ([x, y, z]) => ({
    lat: toDeg(Math.asin(Math.max(-1, Math.min(1, z)))),
    lng: toDeg(Math.atan2(y, x)),
  });

  const v1 = toVec(lat1, lng1);
  const v2 = toVec(lat2, lng2);
  const dot = Math.max(-1, Math.min(1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]));
  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);

  const segments = [];
  let currentSeg = [];
  let midPoint = { lat: (lat1 + lat2) / 2, lng: (lng1 + lng2) / 2 };

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let ptVec;
    if (sinOmega < 1e-5) {
      ptVec = v1;
    } else {
      const a = Math.sin((1 - t) * omega) / sinOmega;
      const b = Math.sin(t * omega) / sinOmega;
      ptVec = [
        a * v1[0] + b * v2[0],
        a * v1[1] + b * v2[1],
        a * v1[2] + b * v2[2],
      ];
    }

    const { lat, lng } = toLatLng(ptVec);
    if (i === Math.floor(steps / 2)) {
      midPoint = { lat, lng };
    }

    if (currentSeg.length > 0) {
      const prev = currentSeg[currentSeg.length - 1];
      if (Math.abs(lng - prev[1]) > 150) {
        if (currentSeg.length > 1) segments.push(currentSeg);
        currentSeg = [];
      }
    }
    currentSeg.push([Math.round(lat * 1000) / 1000, Math.round(lng * 1000) / 1000]);
  }
  if (currentSeg.length > 1) segments.push(currentSeg);

  const distKm = haversineDistanceKm(lat1, lng1, lat2, lng2);
  return {
    distKm,
    flightTime: estimateFlightDuration(distKm),
    midpoint: midPoint,
    segments,
  };
};
