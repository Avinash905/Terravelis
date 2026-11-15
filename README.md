# Terravelis — Live 3D Earth Telemetry & Location Intelligence

**Terravelis** is an interactive **3D Earth** telemetry and location-intelligence platform that visualizes real-time activity across the planet — seismic waves, active wildfires & volcanoes, the International Space Station's live orbit, upcoming rocket launches, commercial aircraft overhead, live world radio streams, human knowledge edits, two-city flight route comparisons, and iconic local landmarks.

---

## Live Capabilities

### 8 Toggleable Global Layers
- **Seismic Waves (USGS):** Real-time earthquakes & tremors worldwide sized by magnitude and depth.
- **Natural Events (NASA EONET):** Active wildfires, erupting volcanoes, and severe storms tracked by NASA satellites.
- **International Space Station (ISS):** Live orbital coordinates updated every few seconds, 90-minute ground-track trajectory, and an **ISS View** orbital camera lock.
- **Rocket Launches (Launch Library 2):** Upcoming missions from ISRO Sriharikota, SpaceX Starbase, Cape Canaveral, Kourou, Mahia, and Tanegashima with live T-minus countdowns.
- **World Radio Towers (Radio-Browser):** Geo-tagged HTTPS live radio broadcasts across every continent — click any tower to stream live audio.
- **Wikipedia Live (Wikimedia EventStreams):** Real-time human edits sparking across countries every second.
- **Subsea Internet Cables:** Transoceanic fiber-optic backbone routes with capacity and landing points.
- **Visitor Pins (MongoDB + Socket.io):** Drop a public pin and short note from your city onto the globe.

### Click Anywhere on Earth — Location Inspector
Clicking any city, monument, coastline, or ocean opens an inspector drawer with four tabs:
1. **Places:** Iconic landmarks and tourist attractions nearby with high-resolution Wikipedia photography, summaries, and one-click focus.
2. **Overview:** Live surface weather, wind, humidity, UV index, US Air Quality Index (Open-Meteo), live local clock, and country profile (flag, capital, population, currency, spoken languages).
3. **Radar:** Real commercial aircraft currently flying within 250 km (ADS-B / OpenSky), nearby earthquakes, active NASA alerts, rocket launchpads, and regional visitor pins.
4. **Radio:** Tune into live local radio stations broadcasting from that country or region.

### Interactive Tools
- **Live World Tour (`Tour`):** Auto-pilot camera mode flying every 8 seconds across Earth's top active events.
- **Two-City Compare (`Compare`):** Draws a spherical great-circle flight route between any two places with distance (`km` / `mi`), flight duration, time-zone offset, and side-by-side weather & AQI.
- **Night / Daylight Earth + 24h Solar Slider:** Toggle Night City Lights vs. NASA Daylight Satellite view and scrub sunlight across 24 hours UTC.
- **Shareable Deep-Links & Snapshot Cards:** Copy direct `?lat=&lng=` coordinate links or export `1280×720` telemetry PNG cards.

---

## Tech Stack

- **Frontend:** React 19, Vite 8, Three.js (`react-globe.gl`), Tailwind CSS v4, Framer Motion, Lucide Icons, Socket.io Client, Web Audio API
- **Backend:** Node.js (>=22), Express 5, Socket.io 4.8, MongoDB & Mongoose 9 (with automatic in-memory fallback for zero-config local runs), JWT + bcryptjs

---

## Local Development

```bash
# 1. Install backend dependencies & start API + Socket.io server (port 5050)
npm install
npm run dev

# 2. In a second terminal, install & start Vite frontend (port 5173)
cd client
npm install
npm run dev
```

---

## Deployment (Vercel + Render)

1. **Frontend on Vercel (`https://terravelis.vercel.app`):**
   - Import `Avinash905/Terravelis` on Vercel with Project Name `terravelis` (keep default root directory `.` — root `vercel.json` builds `client/dist`).
   - Add environment variable `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`.
2. **Backend on Render:**
   - Connect `Avinash905/Terravelis` on Render (`npm run render-build` / `npm start`), set `MONGO_URI`, `JWT_SECRET`, and `ORIGIN=https://terravelis.vercel.app`.
