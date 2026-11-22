import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { formatCountdown } from "../utils/formatters";

const NATURAL_COLORS = {
  volcanoes: "#ef4444",
  wildfires: "#f97316",
  severeStorms: "#60a5fa",
  seaLakeIce: "#cbd5e1",
  default: "#eab308",
};

const RENDERER_CONFIG = {
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
};

const buildIssObject = () => {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe4e4e7,
    emissiveIntensity: 0.45,
    metalness: 0.8,
    roughness: 0.2,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.4, 12), bodyMat);
  body.rotation.z = Math.PI / 2;
  group.add(body);

  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    emissive: 0x60a5fa,
    emissiveIntensity: 0.55,
    side: THREE.DoubleSide,
  });
  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(1.15, 4.1, 0.08), panelMat);
  leftWing.position.set(-1.4, 0, 0);
  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(1.15, 4.1, 0.08), panelMat);
  rightWing.position.set(1.4, 0, 0);
  group.add(leftWing, rightWing);

  const ringGeo = new THREE.RingGeometry(2.1, 2.35, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });
  const beaconRing = new THREE.Mesh(ringGeo, ringMat);
  group.add(beaconRing);

  return group;
};

const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const updateSunlightPosition = (light, minutesUtc, surfaceMode) => {
  if (!light) return;
  const utcHours = (minutesUtc ?? new Date().getUTCHours() * 60 + new Date().getUTCMinutes()) / 60;
  // In three-globe coordinate space: lat=0,lng=0 faces +Z, lng=+90E faces +X
  const subsolarLngDeg = (12 - utcHours) * 15;
  const phi = (subsolarLngDeg * Math.PI) / 180;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getUTCFullYear(), 0, 0).getTime()) / 86400000
  );
  const declinationRad =
    ((-23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10))) * Math.PI) / 180;

  const r = 320;
  const x = r * Math.cos(declinationRad) * Math.sin(phi);
  const y = r * Math.sin(declinationRad);
  const z = r * Math.cos(declinationRad) * Math.cos(phi);

  light.position.set(x, y, z);
  light.intensity = surfaceMode === "day" ? 2.15 : 0.95;
};

const GlobeCanvas = forwardRef(function GlobeCanvas(
  {
    snapshot,
    wikiSparks,
    flightArcs,
    compareArc,
    layers,
    selectedCoords,
    localAircraft,
    followIss,
    autoRotate,
    surfaceMode = "night",
    solarMinutesUtc,
    onSelectCoordinates,
    onPlayRadio,
    onUserDragGlobe,
  },
  ref
) {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const issMeshRef = useRef(null);
  const sunLightRef = useRef(null);
  const followIssRef = useRef(followIss);
  followIssRef.current = followIss;

  const [dimensions, setDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1440,
    height: typeof window !== "undefined" ? window.innerHeight : 900,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width: Math.round(width), height: Math.round(height) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const flyTo = useCallback((lat, lng, altitude = 1.45, duration = 1200) => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView({ lat, lng, altitude }, duration);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      flyTo,
      resetView: () => {
        globeRef.current?.pointOfView({ lat: 20, lng: 25, altitude: 2.18 }, 1300);
      },
      captureCanvasDataUrl: () => {
        try {
          const canvas = globeRef.current?.renderer()?.domElement;
          return canvas ? canvas.toDataURL("image/png") : null;
        } catch {
          return null;
        }
      },
    }),
    [flyTo]
  );

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;

    globe.pointOfView({ lat: 20.5, lng: 76.0, altitude: 2.15 }, 0);

    const controls = globe.controls();
    if (controls) {
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.rotateSpeed = 0.6;
      controls.zoomSpeed = 0.85;
      controls.minDistance = 126;
      controls.maxDistance = 460;
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.25;

      if (!controls._terravelisBound) {
        controls._terravelisBound = true;
        controls.addEventListener("start", () => {
          if (onUserDragGlobe) {
            onUserDragGlobe();
          }
        });
      }
    }

    const scene = globe.scene();
    if (scene && !scene.userData.terravelisLit) {
      scene.userData.terravelisLit = true;
      scene.children.forEach((child) => {
        if (child.isAmbientLight) {
          child.intensity = surfaceMode === "day" ? 0.38 : 1.6;
        }
        if (child.isDirectionalLight) {
          child.intensity = 0.2;
        }
      });

      const sunLight = new THREE.DirectionalLight(0xfff4e6, 0.95);
      updateSunlightPosition(sunLight, solarMinutesUtc, surfaceMode);
      scene.add(sunLight);
      sunLightRef.current = sunLight;
    }
  }, [autoRotate, onUserDragGlobe, solarMinutesUtc, surfaceMode]);

  useEffect(() => {
    updateSunlightPosition(sunLightRef.current, solarMinutesUtc, surfaceMode);
    const scene = globeRef.current?.scene();
    if (scene) {
      scene.children.forEach((child) => {
        if (child.isAmbientLight) {
          child.intensity = surfaceMode === "day" ? 0.38 : 1.6;
        }
      });
    }
  }, [solarMinutesUtc, surfaceMode]);

  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate = autoRotate && !followIss && !selectedCoords;
    controls.autoRotateSpeed = 0.25;
  }, [autoRotate, followIss, selectedCoords]);

  const didInitialIssZoomRef = useRef(false);
  useEffect(() => {
    if (!followIss) {
      didInitialIssZoomRef.current = false;
      return;
    }
    if (!snapshot?.iss || !globeRef.current) return;

    if (!didInitialIssZoomRef.current) {
      didInitialIssZoomRef.current = true;
      globeRef.current.pointOfView(
        { lat: snapshot.iss.lat, lng: snapshot.iss.lng, altitude: 1.22 },
        1100
      );
    } else {
      const currentAlt = globeRef.current.pointOfView()?.altitude || 1.22;
      globeRef.current.pointOfView(
        { lat: snapshot.iss.lat, lng: snapshot.iss.lng, altitude: currentAlt },
        900
      );
    }
  }, [followIss, snapshot?.iss]);

  // Flat surface-flush circular dots (altitude = 0 => flat disc, zero cylinder spikes!)
  const pointsData = useMemo(() => {
    const pts = [];

    if (layers.earthquakes) {
      for (const q of (snapshot.earthquakes || []).slice(0, 95)) {
        const isMajor = q.mag >= 5.0;
        pts.push({
          id: `eq-${q.id}`,
          kind: "earthquake",
          lat: q.lat,
          lng: q.lng,
          radius: Math.min(0.55, Math.max(0.2, q.mag * 0.085)),
          color: isMajor ? "#ef4444" : "#f59e0b",
          title: `M${q.mag} Seismic Event`,
          subtitle: q.place,
          meta: `Depth ${q.depth} km`,
          raw: q,
        });
      }
    }

    if (layers.naturalEvents) {
      for (const ev of snapshot.naturalEvents || []) {
        const color = NATURAL_COLORS[ev.category] || NATURAL_COLORS.default;
        pts.push({
          id: `nat-${ev.id}`,
          kind: "natural",
          lat: ev.lat,
          lng: ev.lng,
          radius: ev.category === "volcanoes" ? 0.42 : 0.3,
          color,
          title: ev.title,
          subtitle: `NASA EONET · ${ev.categoryLabel}`,
          meta: "Click to inspect region",
          raw: ev,
        });
      }
    }

    if (layers.launches) {
      for (const l of snapshot.launches || []) {
        pts.push({
          id: `launch-${l.id}`,
          kind: "launch",
          lat: l.lat,
          lng: l.lng,
          radius: 0.44,
          color: "#fafafa",
          title: l.name,
          subtitle: `${l.provider} · ${l.location}`,
          meta: formatCountdown(l.net),
          raw: l,
        });
      }
    }

    if (layers.radios) {
      for (const r of snapshot.radios || []) {
        pts.push({
          id: `radio-${r.id}`,
          kind: "radio",
          lat: r.lat,
          lng: r.lng,
          radius: 0.27,
          color: "#22c55e",
          title: r.name,
          subtitle: `${r.country} · Live Broadcast`,
          meta: "Click to play live audio",
          raw: r,
        });
      }
    }

    if (layers.beacons) {
      for (const b of snapshot.beacons || []) {
        pts.push({
          id: `beacon-${b.id}`,
          kind: "beacon",
          lat: b.lat,
          lng: b.lng,
          radius: 0.34,
          color: "#38bdf8",
          title: `${b.authorName} · ${b.city}`,
          subtitle: b.message,
          meta: `${b.likes || 1} signals`,
          raw: b,
        });
      }
    }

    if (localAircraft && localAircraft.length > 0) {
      for (const ac of localAircraft.slice(0, 24)) {
        pts.push({
          id: `ac-${ac.id}`,
          kind: "aircraft",
          lat: ac.lat,
          lng: ac.lng,
          radius: 0.22,
          color: "#facc15",
          title: `${ac.callsign} · ${ac.model}`,
          subtitle: `${ac.altitudeFt.toLocaleString()} ft · ${ac.speedKts} kts`,
          meta: `${ac.distKm} km away`,
          raw: ac,
        });
      }
    }

    return pts;
  }, [layers, snapshot, localAircraft]);

  const ringsData = useMemo(() => {
    const rings = [];

    if (layers.earthquakes) {
      for (const q of (snapshot.earthquakes || []).slice(0, 22)) {
        if (q.mag < 3.8) continue;
        rings.push({
          lat: q.lat,
          lng: q.lng,
          maxR: Math.min(5.0, q.mag * 0.8),
          propagationSpeed: 1.4,
          repeatPeriod: q.mag >= 5.2 ? 1050 : 1800,
          color: (t) =>
            q.mag >= 5.2
              ? `rgba(239, 68, 68, ${Math.max(0, 0.85 - t)})`
              : `rgba(245, 158, 11, ${Math.max(0, 0.65 - t)})`,
        });
      }
    }

    if (layers.wiki) {
      for (const s of wikiSparks) {
        rings.push({
          lat: s.lat,
          lng: s.lng,
          maxR: 3.0,
          propagationSpeed: 2.1,
          repeatPeriod: 1150,
          color: (t) => `rgba(228, 228, 231, ${Math.max(0, 0.75 - t)})`,
        });
      }
    }

    if (selectedCoords) {
      rings.push({
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        maxR: 3.2,
        propagationSpeed: 1.7,
        repeatPeriod: 950,
        color: (t) => `rgba(255, 255, 255, ${Math.max(0, 0.9 - t)})`,
      });
    }

    if (compareArc) {
      rings.push(
        {
          lat: compareArc.startLat,
          lng: compareArc.startLng,
          maxR: 2.6,
          propagationSpeed: 1.4,
          repeatPeriod: 1200,
          color: (t) => `rgba(255, 255, 255, ${Math.max(0, 0.85 - t)})`,
        },
        {
          lat: compareArc.endLat,
          lng: compareArc.endLng,
          maxR: 2.6,
          propagationSpeed: 1.4,
          repeatPeriod: 1200,
          color: (t) => `rgba(255, 255, 255, ${Math.max(0, 0.85 - t)})`,
        }
      );
    }

    if (layers.iss && snapshot.iss) {
      rings.push({
        lat: snapshot.iss.lat,
        lng: snapshot.iss.lng,
        maxR: 4.2,
        propagationSpeed: 1.9,
        repeatPeriod: 1200,
        color: (t) => `rgba(96, 165, 250, ${Math.max(0, 0.85 - t)})`,
      });
    }

    return rings;
  }, [
    layers.earthquakes,
    layers.wiki,
    layers.iss,
    snapshot.earthquakes,
    snapshot.iss,
    wikiSparks,
    selectedCoords,
    compareArc,
  ]);

  const pathsData = useMemo(() => {
    const paths = [];

    if (layers.cables) {
      for (const c of snapshot.cables || []) {
        paths.push({
          id: `cable-${c.id}`,
          kind: "cable",
          coords: c.waypoints,
          color: "rgba(148, 163, 184, 0.65)",
          stroke: 1.3,
          dashLength: 0.35,
          dashGap: 0.14,
          dashAnimateTime: 4600,
          alt: 0.005,
          label: `${c.name} · ${c.capacity} (${c.lengthKm.toLocaleString()} km)`,
        });
      }
    }

    if (layers.iss && snapshot.iss?.orbitSegments) {
      snapshot.iss.orbitSegments.forEach((seg, idx) => {
        paths.push({
          id: `iss-orbit-${idx}`,
          kind: "orbit",
          coords: seg,
          color: "rgba(255, 255, 255, 0.5)",
          stroke: 1.4,
          dashLength: 0.2,
          dashGap: 0.1,
          dashAnimateTime: 2800,
          alt: 0.008,
          label: `ISS Ground Track · ${snapshot.iss.velocityKmh.toLocaleString()} km/h`,
        });
      });
    }

    if (compareArc?.segments) {
      compareArc.segments.forEach((seg, idx) => {
        // Continuous subtle base geodesic line
        paths.push({
          id: `compare-base-${idx}`,
          kind: "compare",
          coords: seg,
          color: "rgba(255, 255, 255, 0.28)",
          stroke: 1.4,
          dashLength: 1,
          dashGap: 0,
          dashAnimateTime: 0,
          alt: 0.012,
          label: `${compareArc.originName} ↔ ${compareArc.targetName} · ${compareArc.distKm?.toLocaleString()} km`,
        });
        // Fine animated directional pulse along the geodesic curve
        paths.push({
          id: `compare-flow-${idx}`,
          kind: "compare",
          coords: seg,
          color: "rgba(255, 255, 255, 0.92)",
          stroke: 1.8,
          dashLength: 0.07,
          dashGap: 0.05,
          dashAnimateTime: 3600,
          alt: 0.013,
          label: `${compareArc.originName} ↔ ${compareArc.targetName} · ${compareArc.distKm?.toLocaleString()} km (${compareArc.flightTime})`,
        });
      });
    }

    return paths;
  }, [layers.cables, layers.iss, snapshot.cables, snapshot.iss, compareArc]);

  const combinedArcs = useMemo(() => {
    return (flightArcs || []).map((a) => ({
      ...a,
      arcColor: ["rgba(255,255,255,0.65)", "rgba(148,163,184,0.18)"],
      dashLen: 0.4,
      dashGap: 0.25,
      animTime: 1400,
    }));
  }, [flightArcs]);

  const compareHtmlMarkers = useMemo(() => {
    if (!compareArc) return [];
    return [
      {
        id: "cmp-a",
        lat: compareArc.startLat,
        lng: compareArc.startLng,
        kind: "endpoint",
        badge: "A",
        text: compareArc.originName || "Origin",
      },
      {
        id: "cmp-b",
        lat: compareArc.endLat,
        lng: compareArc.endLng,
        kind: "endpoint",
        badge: "B",
        text: compareArc.targetName || "Destination",
      },
      {
        id: "cmp-mid",
        lat: compareArc.midpoint.lat,
        lng: compareArc.midpoint.lng,
        kind: "midpoint",
        text: `${compareArc.distKm?.toLocaleString()} km · ${compareArc.flightTime}`,
      },
    ];
  }, [compareArc]);

  const renderCompareHtmlElement = useCallback((d) => {
    const el = document.createElement("div");
    el.style.pointerEvents = "none";
    el.style.transform = "translate(-50%, -130%)";
    if (d.kind === "midpoint") {
      el.innerHTML = `
        <div style="background:rgba(10,10,13,0.92);border:1px solid rgba(255,255,255,0.18);padding:3px 8px;border-radius:999px;color:#fafafa;font-size:10.5px;font-family:'JetBrains Mono',monospace;white-space:nowrap;box-shadow:0 8px 20px rgba(0,0,0,0.65);">
          ${escapeHtml(d.text)}
        </div>
      `;
    } else {
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:5px;background:rgba(10,10,13,0.94);border:1px solid rgba(255,255,255,0.22);padding:3px 8px 3px 5px;border-radius:6px;color:#ffffff;font-size:11px;font-weight:600;font-family:'Inter',sans-serif;white-space:nowrap;box-shadow:0 8px 20px rgba(0,0,0,0.65);">
          <span style="background:#f4f4f5;color:#09090b;font-size:9.5px;font-weight:700;padding:1px 4.5px;border-radius:3px;font-family:'JetBrains Mono',monospace;">${escapeHtml(d.badge)}</span>
          <span>${escapeHtml(d.text)}</span>
        </div>
      `;
    }
    return el;
  }, []);

  const objectsData = useMemo(() => {
    if (!layers.iss || !snapshot.iss) return [];
    return [
      {
        id: "iss-station",
        lat: snapshot.iss.lat,
        lng: snapshot.iss.lng,
        altitude: 0.09,
        velocityKmh: snapshot.iss.velocityKmh,
        altitudeKm: snapshot.iss.altitudeKm,
      },
    ];
  }, [layers.iss, snapshot.iss]);

  const getCustomThreeObject = useCallback(() => {
    if (!issMeshRef.current) {
      issMeshRef.current = buildIssObject();
    }
    return issMeshRef.current;
  }, []);

  const updateCustomThreeObject = useCallback((obj, d) => {
    if (!globeRef.current) return;
    Object.assign(obj.position, globeRef.current.getCoords(d.lat, d.lng, d.altitude));
    obj.lookAt(0, 0, 0);
  }, []);

  const renderPointTooltip = useCallback((d) => {
    return `
      <div style="background:rgba(10,10,12,0.94);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.1);padding:9px 12px;border-radius:8px;box-shadow:0 16px 32px rgba(0,0,0,0.7);max-width:250px;font-family:'Inter',sans-serif;">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:2px;">
          <span style="width:6px;height:6px;border-radius:999px;background:${d.color};display:inline-block;"></span>
          <span style="font-weight:600;font-size:12px;color:#fafafa;line-height:1.25;">${escapeHtml(d.title)}</span>
        </div>
        <div style="font-size:11px;color:#a1a1aa;line-height:1.35;margin-bottom:3px;">${escapeHtml(d.subtitle)}</div>
        <div style="font-size:10.5px;color:#d4d4d8;font-family:'JetBrains Mono',monospace;">${escapeHtml(d.meta || "")}</div>
      </div>
    `;
  }, []);

  const handlePointClick = useCallback(
    (pt) => {
      if (!pt) return;
      if (pt.kind === "radio" && pt.raw?.streamUrl) {
        onPlayRadio(pt.raw);
      }
      flyTo(pt.lat, pt.lng, 1.32, 1150);
      onSelectCoordinates(pt.lat, pt.lng, pt);
    },
    [flyTo, onPlayRadio, onSelectCoordinates]
  );

  const handleGlobeClick = useCallback(
    ({ lat, lng }) => {
      if (typeof lat !== "number" || typeof lng !== "number") return;
      flyTo(lat, lng, 1.38, 1150);
      onSelectCoordinates(lat, lng, null);
    },
    [flyTo, onSelectCoordinates]
  );

  const globeTexture =
    surfaceMode === "day"
      ? "/textures/earth-blue-marble.jpg"
      : "/textures/earth-night.jpg";

  return (
    <div ref={containerRef} className="relative w-full h-full cursor-grab active:cursor-grabbing">
      <Globe
        ref={globeRef}
        rendererConfig={RENDERER_CONFIG}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl={globeTexture}
        bumpImageUrl="/textures/earth-topology.png"
        backgroundImageUrl="/textures/night-sky.png"
        showAtmosphere={true}
        atmosphereColor={surfaceMode === "day" ? "#60a5fa" : "#4b7bec"}
        atmosphereAltitude={0.135}
        onGlobeReady={handleGlobeReady}
        onGlobeClick={handleGlobeClick}
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={0}
        pointRadius="radius"
        pointColor="color"
        pointResolution={20}
        pointsTransitionDuration={0}
        pointsMerge={false}
        pointLabel={renderPointTooltip}
        onPointClick={handlePointClick}
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        ringColor="color"
        pathsData={pathsData}
        pathPoints="coords"
        pathPointLat={(p) => p[0]}
        pathPointLng={(p) => p[1]}
        pathPointAlt={(d) => d.alt ?? 0.006}
        pathColor="color"
        pathStroke="stroke"
        pathDashLength="dashLength"
        pathDashGap="dashGap"
        pathDashAnimateTime="dashAnimateTime"
        pathTransitionDuration={0}
        pathLabel={(p) =>
          `<div style="background:rgba(10,10,12,0.92);border:1px solid rgba(255,255,255,0.1);padding:6px 9px;border-radius:6px;color:#e4e4e7;font-size:11px;font-family:'Inter',sans-serif;">${escapeHtml(
            p.label
          )}</div>`
        }
        arcsData={combinedArcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="arcColor"
        arcDashLength="dashLen"
        arcDashGap="dashGap"
        arcDashAnimateTime="animTime"
        arcStroke={null}
        arcAltitudeAutoScale={0.32}
        htmlElementsData={compareHtmlMarkers}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.015}
        htmlElement={renderCompareHtmlElement}
        htmlTransitionDuration={0}
        objectsData={objectsData}
        objectLat="lat"
        objectLng="lng"
        objectAltitude="altitude"
        objectThreeObject={getCustomThreeObject}
        objectThreeObjectUpdate={updateCustomThreeObject}
        objectLabel={(d) =>
          `<div style="background:rgba(10,10,12,0.94);border:1px solid rgba(255,255,255,0.12);padding:9px 12px;border-radius:8px;color:#fafafa;font-family:'Inter',sans-serif;">
            <div style="font-weight:600;font-size:12px;">International Space Station</div>
            <div style="font-size:11px;color:#a1a1aa;margin-top:2px;font-family:'JetBrains Mono',monospace;">${d.altitudeKm} km · ${d.velocityKmh.toLocaleString()} km/h</div>
          </div>`
        }
        onObjectClick={(d) => {
          flyTo(d.lat, d.lng, 1.18, 1000);
          onSelectCoordinates(d.lat, d.lng, {
            kind: "iss",
            color: "#ffffff",
            title: "International Space Station (ISS)",
            subtitle: `Low-Earth Orbit · ${d.altitudeKm} km altitude · ${d.velocityKmh.toLocaleString()} km/h`,
          });
        }}
      />
    </div>
  );
});

export default GlobeCanvas;
