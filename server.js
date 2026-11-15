const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
require("dotenv").config();

const { connectDB, isDbConnected } = require("./db/conn");
const userRouter = require("./routes/userRoutes");
const telemetryRouter = require("./routes/telemetryRoutes");
const beaconRouter = require("./routes/beaconRoutes");
const { startRealtimeLoops } = require("./services/telemetryService");

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT) || 5050;

const allowedOrigins = process.env.ORIGIN
  ? process.env.ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
  : true;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "512kb" }));

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Terravelis Global Telemetry",
    uptimeSeconds: Math.round(process.uptime()),
    dbConnected: isDbConnected(),
    viewers: io.engine.clientsCount,
  });
});

app.use("/api/user", userRouter);
app.use("/api/telemetry", telemetryRouter);
app.use("/api/beacons", beaconRouter);

const distDir = path.join(__dirname, "client", "dist");

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    return res.sendFile(path.join(distDir, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || "Unexpected server error";
  if (process.env.NODE_ENV !== "production") {
    console.error("[Server Error]", err);
  }
  return res.status(status).json({
    success: false,
    message,
  });
});

io.on("connection", (socket) => {
  io.emit("presence:count", { count: io.engine.clientsCount });

  socket.on("disconnect", () => {
    io.emit("presence:count", { count: io.engine.clientsCount });
  });
});

const bootstrap = async () => {
  await connectDB();
  server.listen(port, () => {
    console.log(`[Terravelis] Server listening on http://localhost:${port}`);
    startRealtimeLoops(io, () => io.engine.clientsCount);
  });
};

bootstrap();
