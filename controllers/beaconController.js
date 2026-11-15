const Beacon = require("../models/beaconModel");
const { isDbConnected } = require("../db/conn");
const { pushChatter } = require("../services/telemetryService");

const SEED_BEACONS = [
  {
    id: "seed-hyderabad",
    authorName: "Avinash",
    avatarColor: "#38bdf8",
    city: "Hyderabad",
    country: "India",
    countryCode: "IN",
    lat: 17.385,
    lng: 78.4867,
    message: "Watching the planet's live chatter from HITEC City. Drop a pin from your city!",
    category: "tech",
    likes: 18,
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: "seed-tokyo",
    authorName: "Kenji M.",
    avatarColor: "#22d3ee",
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    lat: 35.6762,
    lng: 139.6503,
    message: "Late night rain in Shibuya, tuned into J-Wave FM while tracking Pacific tremors.",
    category: "music",
    likes: 11,
    createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
  {
    id: "seed-reykjavik",
    authorName: "Freyja",
    avatarColor: "#34d399",
    city: "Reykjavik",
    country: "Iceland",
    countryCode: "IS",
    lat: 64.1466,
    lng: -21.9426,
    message: "Clear sub-arctic skies tonight and faint green aurora ribbons over the bay.",
    category: "travel",
    likes: 14,
    createdAt: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
  },
  {
    id: "seed-sf",
    authorName: "Maya Lin",
    avatarColor: "#818cf8",
    city: "San Francisco",
    country: "United States",
    countryCode: "US",
    lat: 37.7749,
    lng: -122.4194,
    message: "Golden Gate fog rolling in while watching ISS cross the Pacific horizon.",
    category: "signal",
    likes: 9,
    createdAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
  },
  {
    id: "seed-london",
    authorName: "Oliver",
    avatarColor: "#f472b6",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    lat: 51.5074,
    lng: -0.1278,
    message: "Tracking transatlantic flight corridors over Heathrow with morning espresso.",
    category: "vibe",
    likes: 7,
    createdAt: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
  },
  {
    id: "seed-nairobi",
    authorName: "Amina K.",
    avatarColor: "#fb923c",
    city: "Nairobi",
    country: "Kenya",
    countryCode: "KE",
    lat: -1.2921,
    lng: 36.8219,
    message: "Warm Rift Valley breeze today, checking out undersea cable landings along East Africa.",
    category: "tech",
    likes: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 350).toISOString(),
  },
  {
    id: "seed-saopaulo",
    authorName: "Lucas R.",
    avatarColor: "#a78bfa",
    city: "Sao Paulo",
    country: "Brazil",
    countryCode: "BR",
    lat: -23.5505,
    lng: -46.6333,
    message: "Bossa nova radio playing from Paulista Avenue. Greetings to whoever clicks here!",
    category: "music",
    likes: 10,
    createdAt: new Date(Date.now() - 1000 * 60 * 430).toISOString(),
  },
  {
    id: "seed-sydney",
    authorName: "Chloe",
    avatarColor: "#2dd4bf",
    city: "Sydney",
    country: "Australia",
    countryCode: "AU",
    lat: -33.8688,
    lng: 151.2093,
    message: "Harbour lights glowing bright across the southern hemisphere.",
    category: "vibe",
    likes: 6,
    createdAt: new Date(Date.now() - 1000 * 60 * 520).toISOString(),
  },
];

let memoryBeacons = [...SEED_BEACONS];
let dbSeededChecked = false;

const formatBeacon = (b) => ({
  id: String(b._id || b.id),
  userId: b.userId || null,
  authorName: b.authorName,
  avatarColor: b.avatarColor || "#22d3ee",
  city: b.city,
  country: b.country || "",
  countryCode: b.countryCode || "",
  lat: b.lat,
  lng: b.lng,
  message: b.message,
  category: b.category || "signal",
  likes: b.likes || 0,
  createdAt: b.createdAt,
});

const listBeaconsData = async () => {
  if (isDbConnected()) {
    if (!dbSeededChecked) {
      dbSeededChecked = true;
      const count = await Beacon.countDocuments();
      if (count === 0) {
        await Beacon.insertMany(SEED_BEACONS.map(({ id: _id, ...rest }) => rest));
      }
    }
    const docs = await Beacon.find().sort({ createdAt: -1 }).limit(80).lean();
    return docs.map(formatBeacon);
  }
  return memoryBeacons;
};

const getBeacons = async (_req, res, next) => {
  try {
    const beacons = await listBeaconsData();
    return res.json(beacons);
  } catch (err) {
    return next(err);
  }
};

const createBeacon = async (req, res, next) => {
  try {
    const authorName = (req.body?.authorName || req.user?.name || "Explorer").trim().slice(0, 40);
    const city = (req.body?.city || "").trim().slice(0, 80);
    const country = (req.body?.country || "").trim().slice(0, 80);
    const countryCode = (req.body?.countryCode || "").trim().slice(0, 6);
    const message = (req.body?.message || "").trim().slice(0, 180);
    const category = ["signal", "travel", "tech", "music", "vibe"].includes(req.body?.category)
      ? req.body.category
      : "signal";
    const avatarColor = req.body?.avatarColor || "#22d3ee";
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);

    if (!city || !message || Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "City, message, and coordinates are required" });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: "Coordinates out of bounds" });
    }

    let formatted;
    if (isDbConnected()) {
      const created = await Beacon.create({
        userId: req.user?.id || null,
        authorName,
        avatarColor,
        city,
        country,
        countryCode,
        lat,
        lng,
        message,
        category,
        likes: 1,
      });
      formatted = formatBeacon(created);
    } else {
      formatted = {
        id: `beacon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: req.user?.id || null,
        authorName,
        avatarColor,
        city,
        country,
        countryCode,
        lat,
        lng,
        message,
        category,
        likes: 1,
        createdAt: new Date().toISOString(),
      };
      memoryBeacons = [formatted, ...memoryBeacons].slice(0, 80);
    }

    pushChatter({
      id: `chatter-${formatted.id}`,
      kind: "beacon",
      title: `${formatted.authorName} pinned ${formatted.city}`,
      subtitle: formatted.message,
      lat: formatted.lat,
      lng: formatted.lng,
      time: Date.now(),
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("beacon:new", formatted);
    }

    return res.status(201).json(formatted);
  } catch (err) {
    return next(err);
  }
};

const pulseBeacon = async (req, res, next) => {
  try {
    const { id } = req.params;
    let updated = null;

    if (isDbConnected()) {
      const doc = await Beacon.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
      if (doc) updated = formatBeacon(doc);
    } else {
      memoryBeacons = memoryBeacons.map((b) => {
        if (b.id === id) {
          updated = { ...b, likes: (b.likes || 0) + 1 };
          return updated;
        }
        return b;
      });
    }

    if (!updated) {
      return res.status(404).json({ message: "Beacon not found" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("beacon:pulse", { id: updated.id, likes: updated.likes });
    }
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
};

const deleteBeacon = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isDbConnected()) {
      const doc = await Beacon.findById(id);
      if (!doc) return res.status(404).json({ message: "Beacon not found" });
      if (doc.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the creator can remove this beacon" });
      }
      await doc.deleteOne();
    } else {
      const found = memoryBeacons.find((b) => b.id === id);
      if (!found) return res.status(404).json({ message: "Beacon not found" });
      if (found.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the creator can remove this beacon" });
      }
      memoryBeacons = memoryBeacons.filter((b) => b.id !== id);
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("beacon:deleted", { id });
    }
    return res.json({ success: true, id });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listBeaconsData,
  getBeacons,
  createBeacon,
  pulseBeacon,
  deleteBeacon,
};
