# ChatterBox — Tune Into the Planet's Live Chatter

An interactive **3D Night Earth** telemetry & location-intelligence platform that visualizes real-time activity happening across the planet right now — seismic waves, active wildfires & volcanoes, the International Space Station's live orbit, upcoming rocket launches, commercial aircraft overhead, live world radio streams, human knowledge edits, and iconic local landmarks.

---

## Live Capabilities

### 8 Toggleable Global Layers
- **Seismic Waves (USGS):** Real-time earthquakes & tremors worldwide sized by magnitude and depth.
- **Wildfires, Volcanoes & Cyclones (NASA EONET):** Active natural events tracked by NASA satellites.
- **International Space Station (ISS):** Live orbital coordinates updated every few seconds, ground-track trajectory, and a **Ride ISS** orbital camera lock.
- **Rocket Launches (Launch Library 2):** Upcoming missions from ISRO Sriharikota, SpaceX Starbase, Cape Canaveral, Kourou, Mahia, and Tanegashima with live T-minus countdowns.
- **World Radio Towers (Radio-Browser):** Geo-tagged HTTPS live radio broadcasts across every continent — click any tower to stream live audio.
- **Live Human Knowledge (Wikimedia EventStreams):** Real-time Wikipedia edits sparking across countries every second.
- **Subsea Internet Cables:** Transoceanic fiber-optic backbone routes with capacity and landing points.
- **Visitor Pins (MongoDB + Socket.io):** Drop a live beacon and message from your city onto the globe.

### Click Anywhere on Earth — Location X-Ray Drawer
Clicking any city, monument, coastline, or ocean opens a frosted-glass intelligence drawer with four views:
1. **Places to Visit:** Iconic landmarks and attractions nearby with high-resolution Wikipedia photography, summaries, and one-click zoom.
2. **Snapshot:** Live surface weather, wind, humidity, UV index, US Air Quality Index (Open-Meteo), live local clock, and country profile (flag, capital, population, currency, spoken languages).
3. **Live Radar:** Real commercial aircraft currently flying within 250 km (ADS-B / OpenSky), nearby earthquakes, active NASA alerts, rocket launchpads, and regional visitor pins.
4. **Radio:** Tune into live local radio stations broadcasting from that country or region.

### Controls & Extras
- **`Cmd+K` / `Ctrl+K` Global Command Palette:** Instantly search and fly to any city, volcano, spaceport, or landmark.
- **Planet Ambient Synth:** Procedural Web Audio synthesizer that translates live planetary activity into spatial pentatonic chimes.
- **Zero-Wall Guest Mode + Optional Account:** Explore everything immediately without signing up; optionally sign in to sync your saved **Orbital Watchlist** across devices.

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

*(No `.env` or API keys are required to run locally — all planetary feeds are keyless public streams, and user/beacon storage automatically falls back to an in-memory store if `MONGO_URI` is not set.)*

---

## Zero-Cold-Start Free Deployment (Vercel + Render)

1. **Frontend on Vercel (instant global CDN, never sleeps):**
   - Import `Avinash905/ChatterBox` on Vercel and set **Root Directory** to `client`.
   - Add environment variable `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`.
2. **Backend on Render Free Tier:**
   - Connect `Avinash905/ChatterBox` on Render (`npm install` / `npm start`), set `MONGO_URI`, `JWT_SECRET`, and `ORIGIN=https://<your-vercel-app>.vercel.app`.
   - Optional: add a free 12-minute ping on `cron-job.org` pointing to `https://<your-render-service>.onrender.com/api/health` to keep the single free Render instance warm 24/7 within Render's 750 free hours/month.
