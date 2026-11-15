const express = require("express");
const telemetryController = require("../controllers/telemetryController");

const telemetryRouter = express.Router();

telemetryRouter.get("/snapshot", telemetryController.getSnapshot);
telemetryRouter.get("/place", telemetryController.getPlace);
telemetryRouter.get("/search", telemetryController.search);

module.exports = telemetryRouter;
