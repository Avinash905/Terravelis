# Terravelis

Interactive 3D Earth built with React, Three.js, Node.js, and Socket.io. Pulls live public feeds onto a single globe so you can inspect earthquakes, wildfires, volcanoes, live flights, world radio stations, the ISS orbit, and nearby landmarks for any point on Earth.

Live demo: [terravelis.vercel.app](https://terravelis.vercel.app)

## Features

- **Live Global Layers:** Toggle real-time USGS earthquakes, NASA EONET wildfires/volcanoes/storms, upcoming orbital rocket launches (Launch Library 2), live Wikipedia edits, subsea internet cables, world radio towers, and visitor pins.
- **ISS Orbital Lock:** Track the International Space Station's live position and 90-minute ground track in 3D.
- **Click-Anywhere Location Inspector:** Click any city, coastline, or ocean to view nearby landmarks with Wikipedia photos, surface weather & US AQI (Open-Meteo), country details, local radio streams, and commercial aircraft within 250 km.
- **Two-City Route Comparison:** Measure great-circle distance, estimated flight duration, timezone difference, and weather between any two locations.
- **World Tour & Sunlight Scrubber:** Hands-free camera tour across active events, Night vs. Daylight satellite textures, 24h UTC solar slider, `?lat=&lng=` shareable links, and PNG snapshot export.

## Stack

- **Frontend:** React 19, Vite 8, Three.js (`react-globe.gl`), Tailwind CSS v4, Framer Motion, Socket.io Client, Web Audio API
- **Backend:** Node.js, Express 5, Socket.io, MongoDB / Mongoose 9, JWT + bcryptjs

## Running Locally

```bash
# Backend (port 5050)
npm install
npm run dev

# Frontend (port 5173)
cd client
npm install
npm run dev
```

No API keys are required for the live Earth feeds. If `MONGO_URI` is not set locally, the server automatically uses an in-memory store for accounts and pins.
