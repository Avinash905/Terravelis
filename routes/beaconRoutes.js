const express = require("express");
const beaconController = require("../controllers/beaconController");
const { optionalAuth, requireAuth } = require("../middleware/auth");

const beaconRouter = express.Router();

beaconRouter.get("/", beaconController.getBeacons);
beaconRouter.post("/", optionalAuth, beaconController.createBeacon);
beaconRouter.post("/:id/pulse", beaconController.pulseBeacon);
beaconRouter.delete("/:id", requireAuth, beaconController.deleteBeacon);

module.exports = beaconRouter;
