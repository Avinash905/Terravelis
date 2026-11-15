const {
  getGlobalSnapshot,
  getPlaceIntelligence,
  searchWorld,
} = require("../services/telemetryService");
const { listBeaconsData } = require("./beaconController");

const getSnapshot = async (_req, res, next) => {
  try {
    const [snapshot, beacons] = await Promise.all([
      getGlobalSnapshot(),
      listBeaconsData(),
    ]);
    return res.json({ ...snapshot, beacons });
  } catch (err) {
    return next(err);
  }
};

const getPlace = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "Valid lat and lng query parameters are required" });
    }
    const beacons = await listBeaconsData();
    const intel = await getPlaceIntelligence(lat, lng, beacons);
    return res.json(intel);
  } catch (err) {
    return next(err);
  }
};

const search = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const results = await searchWorld(q);
    return res.json({ results });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getSnapshot, getPlace, search };
