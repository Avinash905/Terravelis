import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TopHudBar from "./components/TopHudBar";
import LayerDock from "./components/LayerDock";
import ChatterFeedPanel from "./components/ChatterFeedPanel";
import PlaceDrawer from "./components/PlaceDrawer";
import RadioMiniPlayer from "./components/RadioMiniPlayer";
import CommandPalette from "./components/CommandPalette";
import DropPinModal from "./components/DropPinModal";
import AuthWatchlistModal from "./components/AuthWatchlistModal";
import QuickGuideModal from "./components/QuickGuideModal";
import SolarTimeControl from "./components/SolarTimeControl";
import WorldTourBar from "./components/WorldTourBar";
import CompareOverlayCard from "./components/CompareOverlayCard";
import {
  addWatchlistItem,
  connectRealtimeSocket,
  createBeacon,
  fetchMe,
  fetchPlaceIntel,
  fetchSnapshot,
  loginUser,
  pulseBeacon,
  registerUser,
  removeWatchlistItem,
  resolveUserCoordinates,
} from "./services/earthClient";
import { planetAudio } from "./utils/planetAudio";
import { exportTelemetryCardPng } from "./utils/snapshotExporter";
import { computeGreatCircleRoute, formatCountdown } from "./utils/formatters";

const GlobeCanvas = lazy(() => import("./components/GlobeCanvas"));

const GUEST_WATCHLIST_KEY = "terravelis_guest_watchlist_v1";
const AUTH_TOKEN_KEY = "terravelis_auth_token_v1";
const GUIDE_SEEN_KEY = "terravelis_guide_seen_v1";

const getNowUtcMinutes = () => {
  const now = new Date();
  return now.getUTCHours() * 60 + now.getUTCMinutes();
};

const readUrlCoords = () => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const lat = parseFloat(params.get("lat"));
  const lng = parseFloat(params.get("lng"));
  if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    return { lat, lng };
  }
  return null;
};

const readGuestWatchlist = () => {
  try {
    const raw = localStorage.getItem(GUEST_WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export default function App() {
  const globeRef = useRef(null);
  const audioRef = useRef(null);
  const placeReqIdRef = useRef(0);
  const initialDeepLink = useRef(readUrlCoords());

  const [bootLoading, setBootLoading] = useState(true);
  const [snapshot, setSnapshot] = useState({
    earthquakes: [],
    naturalEvents: [],
    iss: null,
    astronauts: null,
    launches: [],
    radios: [],
    cables: [],
    beacons: [],
  });
  const [chatter, setChatter] = useState([]);
  const [wikiSparks, setWikiSparks] = useState([]);
  const [flightArcs, setFlightArcs] = useState([]);
  const [viewerCount, setViewerCount] = useState(1);

  const [layers, setLayers] = useState({
    earthquakes: true,
    naturalEvents: true,
    iss: true,
    launches: true,
    radios: true,
    wiki: true,
    cables: false,
    beacons: true,
  });

  const [followIss, setFollowIss] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Surface Mode & 24h Solar Time Scrubber
  const [surfaceMode, setSurfaceMode] = useState("night");
  const [isLiveTime, setIsLiveTime] = useState(true);
  const [solarMinutesUtc, setSolarMinutesUtc] = useState(getNowUtcMinutes);

  // Live World Tour (Auto-Pilot)
  const [tourActive, setTourActive] = useState(false);
  const [tourPaused, setTourPaused] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  // Two-City Compare State
  const [awaitingCompareTarget, setAwaitingCompareTarget] = useState(false);
  const [compareOrigin, setCompareOrigin] = useState(null);
  const [compareTarget, setCompareTarget] = useState(null);

  // Drawer / Place Intelligence state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [focusedPoint, setFocusedPoint] = useState(null);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeIntel, setPlaceIntel] = useState(null);

  // Radio state
  const [activeStation, setActiveStation] = useState(null);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [isRadioMuted, setIsRadioMuted] = useState(false);
  const [radioError, setRadioError] = useState(false);

  // Modals & Toast
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropPinOpen, setDropPinOpen] = useState(false);
  const [dropPinPreset, setDropPinPreset] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(
    () => !initialDeepLink.current && !localStorage.getItem(GUIDE_SEEN_KEY)
  );
  const [toastMsg, setToastMsg] = useState(null);

  // Optional Auth + Watchlist
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [guestWatchlist, setGuestWatchlist] = useState(readGuestWatchlist);

  const notify = useCallback((text) => {
    setToastMsg(text);
  }, []);

  useEffect(() => {
    if (!toastMsg) return undefined;
    const id = setTimeout(() => setToastMsg(null), 2800);
    return () => clearTimeout(id);
  }, [toastMsg]);

  // Keep solar time synced to UTC when in live mode
  useEffect(() => {
    if (!isLiveTime) return undefined;
    setSolarMinutesUtc(getNowUtcMinutes());
    const id = setInterval(() => setSolarMinutesUtc(getNowUtcMinutes()), 30000);
    return () => clearInterval(id);
  }, [isLiveTime]);

  const syncUrlCoords = useCallback((coords) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (coords) {
      url.searchParams.set("lat", coords.lat.toFixed(4));
      url.searchParams.set("lng", coords.lng.toFixed(4));
    } else {
      url.searchParams.delete("lat");
      url.searchParams.delete("lng");
    }
    window.history.replaceState({}, "", url.pathname + url.search);
  }, []);

  const triggerArc = useCallback((startLat, startLng, endLat, endLng) => {
    const arcId = `arc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setFlightArcs((prev) => [
      ...prev.slice(-8),
      { id: arcId, startLat, startLng, endLat, endLng },
    ]);
    setTimeout(() => {
      setFlightArcs((prev) => prev.filter((a) => a.id !== arcId));
    }, 3400);
  }, []);

  // Load initial snapshot + realtime socket
  useEffect(() => {
    let mounted = true;

    fetchSnapshot()
      .then((data) => {
        if (!mounted) return;
        setSnapshot({
          earthquakes: data.earthquakes || [],
          naturalEvents: data.naturalEvents || [],
          iss: data.iss || null,
          astronauts: data.astronauts || null,
          launches: data.launches || [],
          radios: data.radios || [],
          cables: data.cables || [],
          beacons: data.beacons || [],
        });
        setChatter(data.chatter || []);
      })
      .finally(() => {
        if (mounted) setBootLoading(false);
      });

    const socket = connectRealtimeSocket({
      onIss: (iss) => {
        setSnapshot((prev) => ({ ...prev, iss }));
      },
      onWikiSpark: (spark) => {
        setWikiSparks((prev) => [...prev.slice(-12), spark]);
        setChatter((prev) => [
          {
            id: spark.id,
            kind: "wiki",
            title: spark.title,
            subtitle: `Edited on ${spark.wiki} Wikipedia · ${spark.hubCity}`,
            lat: spark.lat,
            lng: spark.lng,
            time: spark.time,
          },
          ...prev.slice(0, 44),
        ]);
        planetAudio.playKnowledgeChime(spark.lat, spark.lng);
        setTimeout(() => {
          setWikiSparks((prev) => prev.filter((s) => s.id !== spark.id));
        }, 8500);
      },
      onEarthRefresh: ({ earthquakes, naturalEvents }) => {
        setSnapshot((prev) => ({
          ...prev,
          earthquakes: earthquakes || prev.earthquakes,
          naturalEvents: naturalEvents || prev.naturalEvents,
        }));
      },
      onBeaconNew: (beacon) => {
        setSnapshot((prev) => {
          if (prev.beacons.some((b) => b.id === beacon.id)) return prev;
          return { ...prev, beacons: [beacon, ...prev.beacons] };
        });
        setChatter((prev) => [
          {
            id: `chatter-${beacon.id}`,
            kind: "beacon",
            title: `${beacon.authorName} pinned ${beacon.city}`,
            subtitle: beacon.message,
            lat: beacon.lat,
            lng: beacon.lng,
            time: Date.now(),
          },
          ...prev.slice(0, 44),
        ]);
        triggerArc(20.5, 76.0, beacon.lat, beacon.lng);
        planetAudio.playBeaconChord();
      },
      onBeaconPulse: ({ id, likes }) => {
        setSnapshot((prev) => ({
          ...prev,
          beacons: prev.beacons.map((b) => (b.id === id ? { ...b, likes } : b)),
        }));
        setPlaceIntel((prev) =>
          prev
            ? {
                ...prev,
                nearbyBeacons: (prev.nearbyBeacons || []).map((b) =>
                  b.id === id ? { ...b, likes } : b
                ),
              }
            : prev
        );
      },
      onPresence: ({ count }) => {
        if (typeof count === "number") setViewerCount(count);
      },
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [triggerArc]);

  // Restore optional user session if token exists
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    fetchMe(token)
      .then((res) => setUser(res.user))
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken("");
        setUser(null);
      });
  }, [token]);

  const handleSelectCoordinates = useCallback(
    async (lat, lng, markerPoint = null, options = {}) => {
      setFollowIss(false);
      if (!options.keepTour) {
        setTourActive(false);
      }

      // If awaiting second city in Compare Mode
      if (awaitingCompareTarget && compareOrigin) {
        setAwaitingCompareTarget(false);
        setSelectedCoords({ lat, lng });
        syncUrlCoords({ lat, lng });
        setFocusedPoint(markerPoint);
        const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
        setDrawerOpen(!isMobile);
        setPlaceLoading(true);

        const route = computeGreatCircleRoute(
          compareOrigin.coordinates.lat,
          compareOrigin.coordinates.lng,
          lat,
          lng
        );
        const frameAlt = Math.min(2.45, Math.max(1.38, 1.05 + route.distKm / 7200));
        globeRef.current?.flyTo(route.midpoint.lat, route.midpoint.lng, frameAlt, 1350);

        const reqId = ++placeReqIdRef.current;
        try {
          const data = await fetchPlaceIntel(lat, lng);
          if (reqId === placeReqIdRef.current) {
            setPlaceIntel(data);
            setCompareTarget(data);
          }
        } finally {
          if (reqId === placeReqIdRef.current) {
            setPlaceLoading(false);
          }
        }
        return;
      }

      const prevCoords = selectedCoords;
      setSelectedCoords({ lat, lng });
      syncUrlCoords({ lat, lng });
      setFocusedPoint(markerPoint);
      setDrawerOpen(true);
      setPlaceLoading(true);

      if (prevCoords) {
        triggerArc(prevCoords.lat, prevCoords.lng, lat, lng);
      }

      const reqId = ++placeReqIdRef.current;
      try {
        const data = await fetchPlaceIntel(lat, lng);
        if (reqId === placeReqIdRef.current) {
          setPlaceIntel(data);
        }
      } finally {
        if (reqId === placeReqIdRef.current) {
          setPlaceLoading(false);
        }
      }
    },
    [awaitingCompareTarget, compareOrigin, selectedCoords, syncUrlCoords, triggerArc]
  );

  const handleFlyAndInspect = useCallback(
    (lat, lng, altitude = 1.32, options = {}) => {
      globeRef.current?.flyTo(lat, lng, altitude, 1250);
      handleSelectCoordinates(lat, lng, null, options);
    },
    [handleSelectCoordinates]
  );

  // Deep-link URL boot (?lat=...&lng=...)
  useEffect(() => {
    if (!initialDeepLink.current || bootLoading) return;
    const { lat, lng } = initialDeepLink.current;
    initialDeepLink.current = null;
    const timer = setTimeout(() => {
      handleFlyAndInspect(lat, lng, 1.25);
    }, 350);
    return () => clearTimeout(timer);
  }, [bootLoading, handleFlyAndInspect]);

  // Curated dynamic Live World Tour stops
  const tourStops = useMemo(() => {
    const stops = [];

    const topQuake = [...(snapshot.earthquakes || [])].sort((a, b) => b.mag - a.mag)[0];
    if (topQuake) {
      stops.push({
        id: "tour-quake",
        tag: "Strongest Seismic Event",
        title: `M${topQuake.mag} Earthquake`,
        subtitle: topQuake.place,
        lat: topQuake.lat,
        lng: topQuake.lng,
        altitude: 1.25,
      });
    }

    const volcanoOrFire =
      (snapshot.naturalEvents || []).find((e) => e.category === "volcanoes") ||
      snapshot.naturalEvents?.[0];
    if (volcanoOrFire) {
      stops.push({
        id: "tour-nasa",
        tag: "NASA Satellite Alert",
        title: volcanoOrFire.title,
        subtitle: volcanoOrFire.categoryLabel,
        lat: volcanoOrFire.lat,
        lng: volcanoOrFire.lng,
        altitude: 1.22,
      });
    }

    const upcoming = (snapshot.launches || []).find(
      (l) => l.net && new Date(l.net).getTime() > Date.now()
    ) || snapshot.launches?.[0];
    if (upcoming) {
      stops.push({
        id: "tour-launch",
        tag: `Orbital Launch · ${formatCountdown(upcoming.net)}`,
        title: upcoming.name,
        subtitle: `${upcoming.provider} · ${upcoming.location}`,
        lat: upcoming.lat,
        lng: upcoming.lng,
        altitude: 1.2,
      });
    }

    if (snapshot.iss) {
      stops.push({
        id: "tour-iss",
        tag: "Low-Earth Orbit",
        title: "International Space Station",
        subtitle: `Traveling at ${snapshot.iss.velocityKmh?.toLocaleString()} km/h · ${snapshot.iss.altitudeKm} km altitude`,
        lat: snapshot.iss.lat,
        lng: snapshot.iss.lng,
        altitude: 1.24,
      });
    }

    stops.push(
      {
        id: "tour-tokyo",
        tag: "City X-Ray",
        title: "Tokyo Metropolis, Japan",
        subtitle: "Live airspace, local weather, landmarks & FM streams",
        lat: 35.6762,
        lng: 139.6503,
        altitude: 1.18,
      },
      {
        id: "tour-hyd",
        tag: "City X-Ray",
        title: "Hyderabad, India",
        subtitle: "Deccan landmarks, regional flights & live telemetry",
        lat: 17.385,
        lng: 78.4867,
        altitude: 1.18,
      }
    );

    return stops;
  }, [snapshot.earthquakes, snapshot.naturalEvents, snapshot.launches, snapshot.iss]);

  const jumpToTourStop = useCallback(
    (idx) => {
      if (!tourStops.length) return;
      const safeIdx = ((idx % tourStops.length) + tourStops.length) % tourStops.length;
      setTourIndex(safeIdx);
      const stop = tourStops[safeIdx];
      globeRef.current?.flyTo(stop.lat, stop.lng, stop.altitude || 1.25, 1350);
      setSelectedCoords({ lat: stop.lat, lng: stop.lng });
    },
    [tourStops]
  );

  useEffect(() => {
    if (!tourActive || tourPaused || !tourStops.length) return undefined;
    const id = setInterval(() => {
      jumpToTourStop(tourIndex + 1);
    }, 8000);
    return () => clearInterval(id);
  }, [tourActive, tourPaused, tourIndex, tourStops.length, jumpToTourStop]);

  const handleToggleTour = useCallback(() => {
    if (tourActive) {
      setTourActive(false);
      setTourPaused(false);
      return;
    }
    setFollowIss(false);
    setDrawerOpen(false);
    setTourPaused(false);
    setTourActive(true);
    jumpToTourStop(0);
  }, [tourActive, jumpToTourStop]);

  // Global keyboard shortcuts (Cmd+K / Escape)
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        if (guideOpen) {
          localStorage.setItem(GUIDE_SEEN_KEY, "1");
          setGuideOpen(false);
        } else if (searchOpen) setSearchOpen(false);
        else if (dropPinOpen) setDropPinOpen(false);
        else if (authModalOpen) setAuthModalOpen(false);
        else if (awaitingCompareTarget || compareTarget) {
          setAwaitingCompareTarget(false);
          setCompareOrigin(null);
          setCompareTarget(null);
        } else if (tourActive) {
          setTourActive(false);
        } else if (drawerOpen) {
          setDrawerOpen(false);
          setSelectedCoords(null);
          syncUrlCoords(null);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    guideOpen,
    searchOpen,
    dropPinOpen,
    authModalOpen,
    awaitingCompareTarget,
    compareTarget,
    tourActive,
    drawerOpen,
    syncUrlCoords,
  ]);

  const handleLocateMe = useCallback(async () => {
    notify("Locating...");
    try {
      const coords = await resolveUserCoordinates();
      handleFlyAndInspect(coords.lat, coords.lng, 1.18);
    } catch {
      notify("Could not detect location — press ⌘K to search your city.");
    }
  }, [handleFlyAndInspect, notify]);

  // Compare, Share Link & Export PNG Card
  const handleStartCompare = useCallback(
    (intel) => {
      if (!intel) return;
      setCompareOrigin(intel);
      setCompareTarget(null);
      setAwaitingCompareTarget(true);
      if (typeof window !== "undefined" && window.innerWidth < 640) {
        setDrawerOpen(false);
      }
      notify(`Select a second place on Earth to compare with ${intel.location?.name}`);
    },
    [notify]
  );

  const handleCopyShareLink = useCallback(
    async (intel) => {
      if (!intel?.coordinates) return;
      const url = new URL(window.location.href);
      url.searchParams.set("lat", intel.coordinates.lat.toFixed(4));
      url.searchParams.set("lng", intel.coordinates.lng.toFixed(4));
      try {
        await navigator.clipboard.writeText(url.toString());
        notify("Copied shareable coordinate link");
      } catch {
        notify(url.toString());
      }
    },
    [notify]
  );

  const handleExportCard = useCallback(
    async (intel) => {
      notify("Rendering telemetry card...");
      const canvasDataUrl = globeRef.current?.captureCanvasDataUrl?.() || null;
      await exportTelemetryCardPng({ canvasDataUrl, intel });
      notify("Saved telemetry snapshot PNG");
    },
    [notify]
  );

  const compareArc = useMemo(() => {
    if (!compareOrigin || !compareTarget) return null;
    const route = computeGreatCircleRoute(
      compareOrigin.coordinates.lat,
      compareOrigin.coordinates.lng,
      compareTarget.coordinates.lat,
      compareTarget.coordinates.lng
    );
    return {
      startLat: compareOrigin.coordinates.lat,
      startLng: compareOrigin.coordinates.lng,
      endLat: compareTarget.coordinates.lat,
      endLng: compareTarget.coordinates.lng,
      originName: compareOrigin.location?.name || "Origin",
      targetName: compareTarget.location?.name || "Destination",
      ...route,
    };
  }, [compareOrigin, compareTarget]);

  // Radio playback handlers
  const handlePlayRadio = useCallback(
    (station) => {
      if (!station?.streamUrl) return;
      const audio = audioRef.current;
      if (!audio) return;

      setRadioError(false);

      if (activeStation?.id === station.id) {
        if (audio.paused) {
          audio.play().catch(() => setRadioError(true));
          setIsRadioPlaying(true);
          planetAudio.setDucked(true);
        } else {
          audio.pause();
          setIsRadioPlaying(false);
          planetAudio.setDucked(false);
        }
        return;
      }

      setActiveStation(station);
      audio.src = station.streamUrl;
      audio
        .play()
        .then(() => {
          setIsRadioPlaying(true);
          planetAudio.setDucked(true);
        })
        .catch(() => {
          setIsRadioPlaying(false);
          setRadioError(true);
          planetAudio.setDucked(false);
        });
    },
    [activeStation]
  );

  const handleToggleRadioPlay = useCallback(() => {
    if (activeStation) handlePlayRadio(activeStation);
  }, [activeStation, handlePlayRadio]);

  const handleToggleRadioMute = useCallback(() => {
    if (!audioRef.current) return;
    const next = !isRadioMuted;
    audioRef.current.muted = next;
    setIsRadioMuted(next);
  }, [isRadioMuted]);

  const handleCloseRadio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
    }
    setActiveStation(null);
    setIsRadioPlaying(false);
    setRadioError(false);
    planetAudio.setDucked(false);
  }, []);

  const handleToggleSound = useCallback(() => {
    if (soundEnabled) {
      planetAudio.disable();
      setSoundEnabled(false);
      notify("Ambient synth muted");
    } else {
      const ok = planetAudio.enable();
      if (ok) {
        setSoundEnabled(true);
        notify("Ambient synth enabled");
      }
    }
  }, [soundEnabled, notify]);

  const handleToggleFollowIss = useCallback(() => {
    setTourActive(false);
    setFollowIss((prev) => {
      const next = !prev;
      if (next) {
        setLayers((l) => ({ ...l, iss: true }));
      }
      return next;
    });
  }, []);

  const watchlist = useMemo(
    () => (user ? user.watchlist || [] : guestWatchlist),
    [user, guestWatchlist]
  );

  const currentPlaceSaved = useMemo(() => {
    if (!placeIntel?.coordinates) return false;
    const key = `${placeIntel.coordinates.lat.toFixed(2)}:${placeIntel.coordinates.lng.toFixed(2)}`;
    return watchlist.some((w) => w.itemId === key);
  }, [placeIntel, watchlist]);

  const handleToggleSavePlace = useCallback(
    async (intel) => {
      if (!intel?.coordinates) return;
      const itemId = `${intel.coordinates.lat.toFixed(2)}:${intel.coordinates.lng.toFixed(2)}`;
      const exists = watchlist.some((w) => w.itemId === itemId);

      if (user && token) {
        try {
          if (exists) {
            const res = await removeWatchlistItem(itemId, token);
            setUser((u) => ({ ...u, watchlist: res.watchlist }));
            notify(`Removed ${intel.location?.name}`);
          } else {
            const res = await addWatchlistItem(
              {
                name: intel.location?.name || "Saved Coordinate",
                country: intel.location?.countryName || "",
                countryCode: intel.location?.countryCode || "",
                lat: intel.coordinates.lat,
                lng: intel.coordinates.lng,
              },
              token
            );
            setUser((u) => ({ ...u, watchlist: res.watchlist }));
            notify(`Saved ${intel.location?.name}`);
          }
        } catch (err) {
          notify(err.message || "Could not update saved locations");
        }
        return;
      }

      let updated;
      if (exists) {
        updated = guestWatchlist.filter((w) => w.itemId !== itemId);
        notify(`Removed ${intel.location?.name}`);
      } else {
        const entry = {
          itemId,
          name: intel.location?.name || "Saved Coordinate",
          country: intel.location?.countryName || "",
          countryCode: intel.location?.countryCode || "",
          lat: intel.coordinates.lat,
          lng: intel.coordinates.lng,
        };
        updated = [entry, ...guestWatchlist].slice(0, 25);
        notify(`Saved ${intel.location?.name}`);
      }
      setGuestWatchlist(updated);
      localStorage.setItem(GUEST_WATCHLIST_KEY, JSON.stringify(updated));
    },
    [watchlist, user, token, guestWatchlist, notify]
  );

  const handleRemoveSaved = useCallback(
    async (itemId) => {
      if (user && token) {
        const res = await removeWatchlistItem(itemId, token);
        setUser((u) => ({ ...u, watchlist: res.watchlist }));
        return;
      }
      const updated = guestWatchlist.filter((w) => w.itemId !== itemId);
      setGuestWatchlist(updated);
      localStorage.setItem(GUEST_WATCHLIST_KEY, JSON.stringify(updated));
    },
    [user, token, guestWatchlist]
  );

  const handleSubmitPin = useCallback(
    async (payload) => {
      const created = await createBeacon(payload, token);
      setSnapshot((prev) => ({
        ...prev,
        beacons: prev.beacons.some((b) => b.id === created.id)
          ? prev.beacons
          : [created, ...prev.beacons],
      }));
      setLayers((l) => ({ ...l, beacons: true }));
      globeRef.current?.flyTo(created.lat, created.lng, 1.25, 1300);
      notify(`Published pin in ${created.city}`);
    },
    [token, notify]
  );

  const handlePulseBeacon = useCallback(async (id) => {
    try {
      const updated = await pulseBeacon(id);
      setSnapshot((prev) => ({
        ...prev,
        beacons: prev.beacons.map((b) => (b.id === id ? { ...b, likes: updated.likes } : b)),
      }));
      setPlaceIntel((prev) =>
        prev
          ? {
              ...prev,
              nearbyBeacons: (prev.nearbyBeacons || []).map((b) =>
                b.id === id ? { ...b, likes: updated.likes } : b
              ),
            }
          : prev
      );
    } catch {
      // Ignore transient errors
    }
  }, []);

  const handleLogin = useCallback(
    async (creds) => {
      const res = await loginUser(creds);
      localStorage.setItem(AUTH_TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
      notify(`Signed in as ${res.user.name}`);
    },
    [notify]
  );

  const handleRegister = useCallback(
    async (payload) => {
      const res = await registerUser(payload);
      localStorage.setItem(AUTH_TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
      notify(`Welcome, ${res.user.name}`);
    },
    [notify]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken("");
    setUser(null);
    notify("Signed out");
  }, [notify]);

  const layerCounts = useMemo(
    () => ({
      earthquakes: snapshot.earthquakes?.length || 0,
      naturalEvents: snapshot.naturalEvents?.length || 0,
      launches: snapshot.launches?.length || 0,
      radios: snapshot.radios?.length || 0,
      cables: snapshot.cables?.length || 0,
      beacons: snapshot.beacons?.length || 0,
    }),
    [snapshot]
  );

  const nextLaunch = useMemo(() => {
    const upcoming = (snapshot.launches || []).filter(
      (l) => l.net && new Date(l.net).getTime() > Date.now()
    );
    upcoming.sort((a, b) => new Date(a.net).getTime() - new Date(b.net).getTime());
    return upcoming[0] || snapshot.launches?.[0] || null;
  }, [snapshot.launches]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#060608] select-none">
      {/* Subtle Ambient Vignette */}
      <div className="pointer-events-none fixed inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_62%,rgba(0,0,0,0.7)_100%)]" />

      {/* Hidden Audio Stream Element for World Radio */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onError={() => {
          setIsRadioPlaying(false);
          setRadioError(true);
          planetAudio.setDucked(false);
        }}
      />

      {/* 3D Earth Canvas */}
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-[#060608]">
            <div className="w-48 h-48 rounded-full bg-white/[0.03] border border-white/[0.06] animate-pulse" />
          </div>
        }
      >
        <GlobeCanvas
          ref={globeRef}
          snapshot={snapshot}
          wikiSparks={wikiSparks}
          flightArcs={flightArcs}
          compareArc={compareArc}
          layers={layers}
          selectedCoords={selectedCoords}
          localAircraft={drawerOpen ? placeIntel?.aircraft || [] : []}
          followIss={followIss}
          autoRotate={!drawerOpen && !followIss && !tourActive}
          surfaceMode={surfaceMode}
          solarMinutesUtc={solarMinutesUtc}
          onSelectCoordinates={handleSelectCoordinates}
          onPlayRadio={handlePlayRadio}
          onUserDragGlobe={() => {
            setFollowIss(false);
            setTourActive(false);
          }}
        />
      </Suspense>

      {/* Initial Telemetry Sync Indicator */}
      <AnimatePresence>
        {bootLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-30 surface-bar rounded-md px-3 py-1.5 text-[11.5px] font-mono-tech text-zinc-300"
          >
            Loading telemetry...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Pill */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-40 surface-panel rounded-md px-3.5 py-1.5 text-[12px] font-medium text-zinc-100"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top HUD Bar */}
      <TopHudBar
        viewerCount={viewerCount}
        iss={snapshot.iss}
        followIss={followIss}
        tourActive={tourActive}
        soundEnabled={soundEnabled}
        user={user}
        watchlistCount={watchlist.length}
        onOpenSearch={() => setSearchOpen(true)}
        onLocateMe={handleLocateMe}
        onToggleTour={handleToggleTour}
        onToggleFollowIss={handleToggleFollowIss}
        onToggleSound={handleToggleSound}
        onOpenDropPin={(preset) => {
          setDropPinPreset(preset);
          setDropPinOpen(true);
        }}
        onOpenAuthWatchlist={() => setAuthModalOpen(true)}
        onOpenGuide={() => setGuideOpen(true)}
        onResetView={() => {
          setFollowIss(false);
          setTourActive(false);
          setDrawerOpen(false);
          setSelectedCoords(null);
          syncUrlCoords(null);
          globeRef.current?.resetView();
        }}
      />

      {/* Two-City Comparison Overlay */}
      <CompareOverlayCard
        awaitingSecondPoint={awaitingCompareTarget}
        originIntel={compareOrigin}
        targetIntel={compareTarget}
        onSwap={() => {
          setCompareOrigin(compareTarget);
          setCompareTarget(compareOrigin);
        }}
        onClear={() => {
          setAwaitingCompareTarget(false);
          setCompareOrigin(null);
          setCompareTarget(null);
        }}
      />

      {/* Left Live Global Chatter Stream */}
      <ChatterFeedPanel
        chatter={chatter}
        nextLaunch={nextLaunch}
        onSelectEvent={(lat, lng) => handleFlyAndInspect(lat, lng, 1.28)}
      />

      {/* Right Slide-Over Location Intelligence & Places Drawer */}
      <PlaceDrawer
        isOpen={drawerOpen}
        loading={placeLoading}
        intel={placeIntel}
        focusedPoint={focusedPoint}
        activeStation={activeStation}
        isRadioPlaying={isRadioPlaying}
        isSaved={currentPlaceSaved}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedCoords(null);
          syncUrlCoords(null);
        }}
        onToggleSave={handleToggleSavePlace}
        onOpenDropPin={(preset) => {
          setDropPinPreset(preset);
          setDropPinOpen(true);
        }}
        onStartCompare={handleStartCompare}
        onCopyShareLink={handleCopyShareLink}
        onExportCard={handleExportCard}
        onFlyTo={(lat, lng, alt = 0.68) => globeRef.current?.flyTo(lat, lng, alt, 1100)}
        onPlayRadio={handlePlayRadio}
        onPulseBeacon={handlePulseBeacon}
      />

      {/* Floating Live Radio Player */}
      <RadioMiniPlayer
        station={activeStation}
        isPlaying={isRadioPlaying}
        isMuted={isRadioMuted}
        error={radioError}
        onTogglePlay={handleToggleRadioPlay}
        onToggleMute={handleToggleRadioMute}
        onClose={handleCloseRadio}
        onFlyToStation={(lat, lng, alt) => handleFlyAndInspect(lat, lng, alt)}
      />

      {/* Daylight / Night Earth + 24h Sunlight Scrubber */}
      <SolarTimeControl
        drawerOpen={drawerOpen}
        tourActive={tourActive}
        surfaceMode={surfaceMode}
        solarMinutesUtc={solarMinutesUtc}
        isLiveTime={isLiveTime}
        onChangeSurfaceMode={setSurfaceMode}
        onChangeSolarMinutes={(mins) => {
          setIsLiveTime(false);
          setSolarMinutesUtc(mins);
        }}
        onResetLiveTime={() => {
          setIsLiveTime(true);
          setSolarMinutesUtc(getNowUtcMinutes());
        }}
      />

      {/* Live World Tour HUD Strip */}
      <WorldTourBar
        active={tourActive}
        paused={tourPaused}
        stops={tourStops}
        currentIndex={tourIndex}
        onPrev={() => jumpToTourStop(tourIndex - 1)}
        onNext={() => jumpToTourStop(tourIndex + 1)}
        onTogglePause={() => setTourPaused((p) => !p)}
        onExit={() => {
          setTourActive(false);
          setTourPaused(false);
        }}
      />

      {/* Bottom Layer Switcher Dock */}
      <LayerDock
        layers={layers}
        counts={layerCounts}
        onToggleLayer={(key) =>
          setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
        }
      />

      {/* Cmd+K Global Search Palette */}
      <CommandPalette
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectDestination={(lat, lng) => handleFlyAndInspect(lat, lng, 1.25)}
      />

      {/* Drop Your Pin Modal */}
      <DropPinModal
        isOpen={dropPinOpen}
        presetLocation={dropPinPreset}
        user={user}
        onClose={() => setDropPinOpen(false)}
        onSubmitPin={handleSubmitPin}
      />

      {/* Optional Login / Signup + Watchlist Modal */}
      <AuthWatchlistModal
        isOpen={authModalOpen}
        user={user}
        watchlist={watchlist}
        onClose={() => setAuthModalOpen(false)}
        onFlyToSaved={(lat, lng) => handleFlyAndInspect(lat, lng, 1.25)}
        onRemoveSaved={handleRemoveSaved}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
      />

      {/* First-Visit Quick Guide (re-openable anytime via ? button) */}
      <QuickGuideModal
        isOpen={guideOpen}
        onClose={() => {
          localStorage.setItem(GUIDE_SEEN_KEY, "1");
          setGuideOpen(false);
        }}
        onStartTour={handleToggleTour}
        onTrySampleCity={() => handleFlyAndInspect(35.6762, 139.6503, 1.22)}
        onTryIss={handleToggleFollowIss}
      />
    </main>
  );
}
