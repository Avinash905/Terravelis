import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Bookmark, Pause, Play, X } from "lucide-react";
import Hint from "./Hint";
import {
  describeAqi,
  describeWeatherCode,
  formatCompactNumber,
  formatCoords,
  formatCountdown,
  formatLocalClock,
  formatRelativeTime,
} from "../utils/formatters";

const TABS = [
  { id: "places", label: "Places" },
  { id: "snapshot", label: "Overview" },
  { id: "radar", label: "Radar" },
  { id: "radio", label: "Radio" },
];

export default function PlaceDrawer({
  isOpen,
  loading,
  intel,
  focusedPoint,
  activeStation,
  isRadioPlaying,
  isSaved,
  onClose,
  onToggleSave,
  onOpenDropPin,
  onStartCompare,
  onCopyShareLink,
  onExportCard,
  onFlyTo,
  onPlayRadio,
  onPulseBeacon,
}) {
  const [activeTab, setActiveTab] = useState("places");
  const [clockText, setClockText] = useState("");
  const [, setTick] = useState(0);

  useEffect(() => {
    if (focusedPoint?.kind === "radio") {
      setActiveTab("radio");
    } else if (
      focusedPoint?.kind === "earthquake" ||
      focusedPoint?.kind === "natural" ||
      focusedPoint?.kind === "launch" ||
      focusedPoint?.kind === "aircraft" ||
      focusedPoint?.kind === "iss"
    ) {
      setActiveTab("radar");
    } else {
      setActiveTab("places");
    }
  }, [focusedPoint, intel?.coordinates?.lat, intel?.coordinates?.lng]);

  useEffect(() => {
    if (!isOpen || !intel) return undefined;
    const update = () => {
      setClockText(
        formatLocalClock(intel.location?.timezone, intel.location?.utcOffsetSeconds || 0)
      );
      setTick((t) => t + 1);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isOpen, intel]);

  const weatherMeta = intel?.weather
    ? describeWeatherCode(intel.weather.weatherCode, intel.weather.isDay)
    : null;
  const aqiMeta = describeAqi(intel?.weather?.usAqi);

  const radarCount =
    (intel?.aircraft?.length || 0) +
    (intel?.nearbyEvents?.earthquakes?.length || 0) +
    (intel?.nearbyEvents?.naturalEvents?.length || 0) +
    (intel?.nearbyEvents?.launches?.length || 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-2 bottom-14 h-[58vh] sm:inset-x-auto sm:top-16 sm:right-3 sm:bottom-16 sm:h-auto sm:w-[400px] z-30 surface-panel rounded-xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-0 border-b border-white/[0.08]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {loading && !intel ? (
                  <div className="space-y-2 py-0.5">
                    <div className="h-5 w-44 bg-zinc-800/80 rounded animate-pulse" />
                    <div className="h-3.5 w-28 bg-zinc-900 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      {intel?.country?.flagSvg && (
                        <img
                          src={intel.country.flagSvg}
                          alt=""
                          className="w-4 h-3 object-cover rounded-[2px] opacity-90 shrink-0"
                        />
                      )}
                      <span className="text-[11px] text-zinc-400 truncate">
                        {[intel?.location?.subdivision, intel?.location?.countryName]
                          .filter(Boolean)
                          .filter((v, i, a) => a.indexOf(v) === i)
                          .join(", ")}
                      </span>
                    </div>
                    <h2 className="text-[18px] font-semibold tracking-tight text-white truncate mt-0.5">
                      {intel?.location?.name || "Inspecting Point"}
                    </h2>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {intel && (
                  <>
                    <Hint
                      title={isSaved ? "Saved in Watchlist" : "Save Location"}
                      description="Bookmark this place to revisit quickly from your Saved menu."
                      side="bottom"
                    >
                      <button
                        onClick={() => onToggleSave(intel)}
                        className={`h-7 px-2 rounded-md border text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                          isSaved
                            ? "bg-zinc-100 border-white text-zinc-950"
                            : "bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.08]"
                        }`}
                      >
                        <Bookmark className="w-3 h-3" />
                        <span>{isSaved ? "Saved" : "Save"}</span>
                      </button>
                    </Hint>
                    <Hint
                      title="Drop Pin Here"
                      description="Leave a public note anchored at these exact coordinates."
                      side="bottom"
                    >
                      <button
                        onClick={() =>
                          onOpenDropPin({
                            city: intel.location?.name || "",
                            country: intel.location?.countryName || "",
                            countryCode: intel.location?.countryCode || "",
                            lat: intel.coordinates?.lat,
                            lng: intel.coordinates?.lng,
                          })
                        }
                        className="h-7 px-2.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-medium text-zinc-300 hover:text-white transition cursor-pointer"
                      >
                        Pin
                      </button>
                    </Hint>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Monospace Coordinate & Time Strip */}
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono-tech text-zinc-500">
              <span>
                {intel ? formatCoords(intel.coordinates.lat, intel.coordinates.lng) : "..."}
              </span>
              {clockText && <span className="text-zinc-400">{clockText}</span>}
            </div>

            {/* Utility Action Row: Compare / Copy Link / Save Card */}
            {intel && (
              <div className="mt-2.5 flex items-center gap-1.5">
                <Hint
                  title="Compare Two Places"
                  description="Click any second place on Earth to measure distance, flight time, time-zone difference, and weather."
                  side="bottom"
                >
                  <button
                    onClick={() => onStartCompare(intel)}
                    className="h-6 px-2 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] text-zinc-300 hover:text-white transition cursor-pointer"
                  >
                    Compare
                  </button>
                </Hint>
                <Hint
                  title="Copy Shareable Link"
                  description="Copy a URL that opens the 3D globe directly at this spot."
                  side="bottom"
                >
                  <button
                    onClick={() => onCopyShareLink(intel)}
                    className="h-6 px-2 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] text-zinc-300 hover:text-white transition cursor-pointer"
                  >
                    Copy Link
                  </button>
                </Hint>
                <Hint
                  title="Download Snapshot Image"
                  description="Export a 1280×720 PNG card of this globe view stamped with live weather & coordinates."
                  side="bottom"
                >
                  <button
                    onClick={() => onExportCard(intel)}
                    className="h-6 px-2 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] text-zinc-300 hover:text-white transition cursor-pointer"
                  >
                    Save Card
                  </button>
                </Hint>
              </div>
            )}

            {/* Selected Marker Callout */}
            {focusedPoint && (
              <div className="mt-3 p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-start gap-2.5">
                <span
                  className="w-2 h-2 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: focusedPoint.color || "#fafafa" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-zinc-100 truncate">
                    {focusedPoint.title}
                  </div>
                  <div className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                    {focusedPoint.subtitle}
                  </div>
                </div>
              </div>
            )}

            {/* Clean Hairline Underline Tabs */}
            <div className="mt-3 flex items-center gap-5">
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                const count =
                  tab.id === "places"
                    ? intel?.landmarks?.length
                    : tab.id === "radar"
                    ? radarCount
                    : tab.id === "radio"
                    ? intel?.radios?.length
                    : null;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative pb-2.5 text-[12px] font-medium flex items-center gap-1.5 transition cursor-pointer ${
                      active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span className="text-[10.5px] font-mono-tech text-zinc-500">
                        {count}
                      </span>
                    )}
                    {active && (
                      <motion.div
                        layoutId="inspector-tab-line"
                        transition={{ duration: 0.18 }}
                        className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-white"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-pulse"
                  >
                    <div className="h-28 bg-zinc-900" />
                    <div className="p-3 space-y-2">
                      <div className="h-3.5 w-1/2 bg-zinc-800 rounded" />
                      <div className="h-3 w-full bg-zinc-900 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !intel ? null : activeTab === "places" ? (
              /* PLACES TO VISIT */
              <div className="space-y-3">
                {intel.landmarks?.length > 0 ? (
                  intel.landmarks.map((place) => (
                    <div
                      key={place.id}
                      className="group rounded-lg border border-white/[0.08] bg-white/[0.02] hover:border-white/[0.18] transition overflow-hidden"
                    >
                      {place.thumbnail && (
                        <div className="relative h-36 w-full overflow-hidden bg-zinc-950">
                          <img
                            src={place.thumbnail}
                            alt={place.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                          {place.distKm !== null && (
                            <span className="absolute top-2.5 right-2.5 text-[10.5px] font-mono-tech px-2 py-0.5 rounded bg-black/75 text-zinc-200 border border-white/10">
                              {place.distKm} km
                            </span>
                          )}
                          <h3 className="absolute bottom-2.5 left-3 right-3 text-[13px] font-semibold text-white">
                            {place.title}
                          </h3>
                        </div>
                      )}

                      <div className="p-3 space-y-2">
                        {!place.thumbnail && (
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="text-[13px] font-semibold text-white">
                              {place.title}
                            </h3>
                            {place.distKm !== null && (
                              <span className="text-[10.5px] font-mono-tech text-zinc-500">
                                {place.distKm} km
                              </span>
                            )}
                          </div>
                        )}
                        {place.description && (
                          <p className="text-[12px] text-zinc-400 leading-relaxed line-clamp-3">
                            {place.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          {place.lat !== null && place.lng !== null ? (
                            <button
                              onClick={() => onFlyTo(place.lat, place.lng, 0.58)}
                              className="font-medium text-zinc-200 hover:text-white cursor-pointer"
                            >
                              Focus on globe
                            </button>
                          ) : (
                            <span />
                          )}
                          <a
                            href={place.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-zinc-500 hover:text-zinc-200 flex items-center gap-0.5"
                          >
                            Wikipedia
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 px-4 text-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
                    <p className="text-[13px] font-medium text-zinc-200">
                      {intel.location?.isOcean ? "International Waters" : "Remote Coordinates"}
                    </p>
                    <p className="text-[12px] text-zinc-500 mt-1">
                      {intel.location?.isOcean
                        ? "Open ocean coordinates. Switch to Overview for live marine conditions or Radar for regional activity."
                        : "No major cataloged landmarks within 75 km. Switch to Overview or Radar for local telemetry."}
                    </p>
                  </div>
                )}
              </div>
            ) : activeTab === "snapshot" ? (
              /* OVERVIEW: WEATHER, AQI & COUNTRY */
              <div className="space-y-3">
                {intel.weather && (
                  <div className="p-4 rounded-lg bg-white/[0.025] border border-white/[0.08]">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10.5px] font-mono-tech uppercase tracking-wider text-zinc-500">
                          Current Conditions
                        </span>
                        <div className="mt-1 flex items-baseline gap-2.5">
                          <span className="text-3xl font-semibold text-white font-mono-tech">
                            {intel.weather.tempC}°C
                          </span>
                          <span className="text-[12px] text-zinc-500">
                            Feels {intel.weather.feelsLikeC}°C
                          </span>
                        </div>
                        <p className="text-[12px] text-zinc-300 mt-1">{weatherMeta?.label}</p>
                      </div>

                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono-tech text-zinc-300">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: aqiMeta.dot }}
                        />
                        <span>{aqiMeta.label}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[0.07]">
                      <div>
                        <span className="text-[10px] font-mono-tech uppercase text-zinc-500 block">
                          Wind
                        </span>
                        <span className="text-[12px] font-mono-tech text-zinc-100 mt-0.5 block">
                          {intel.weather.windKmh} km/h
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono-tech uppercase text-zinc-500 block">
                          Humidity
                        </span>
                        <span className="text-[12px] font-mono-tech text-zinc-100 mt-0.5 block">
                          {intel.weather.humidity}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono-tech uppercase text-zinc-500 block">
                          UV Index
                        </span>
                        <span className="text-[12px] font-mono-tech text-zinc-100 mt-0.5 block">
                          {intel.weather.uvIndex ?? "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {intel.country && (
                  <div className="p-4 rounded-lg bg-white/[0.025] border border-white/[0.08] space-y-3">
                    <div>
                      <span className="text-[10.5px] font-mono-tech uppercase tracking-wider text-zinc-500 block">
                        Country Profile
                      </span>
                      <span className="text-[13px] font-semibold text-white mt-0.5 block">
                        {intel.country.officialName || intel.country.commonName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2 border-t border-white/[0.07] text-[12px]">
                      <div>
                        <span className="text-[10.5px] text-zinc-500 block">Capital</span>
                        <span className="text-zinc-200 font-medium">
                          {intel.country.capital || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10.5px] text-zinc-500 block">Population</span>
                        <span className="text-zinc-200 font-mono-tech">
                          {formatCompactNumber(intel.country.population)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10.5px] text-zinc-500 block">Currency</span>
                        <span className="text-zinc-200">
                          {intel.country.currencies?.join(", ") || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10.5px] text-zinc-500 block">Region</span>
                        <span className="text-zinc-200">
                          {intel.country.region || intel.location?.continent || "N/A"}
                        </span>
                      </div>
                    </div>

                    {intel.country.languages?.length > 0 && (
                      <div className="pt-2 border-t border-white/[0.07]">
                        <span className="text-[10.5px] text-zinc-500 block mb-1.5">
                          Languages
                        </span>
                        <div className="text-[12px] text-zinc-300">
                          {intel.country.languages.join(", ")}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeTab === "radar" ? (
              /* RADAR: FLIGHTS, LAUNCHES, NATURAL EVENTS, QUAKES, PINS */
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono-tech uppercase tracking-wider text-zinc-400">
                      Airspace Within 250 km
                    </span>
                    <span className="text-[11px] font-mono-tech text-zinc-500">
                      {intel.aircraft?.length || 0} aircraft
                    </span>
                  </div>
                  {intel.aircraft?.length > 0 ? (
                    <div className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                      {intel.aircraft.slice(0, 8).map((ac) => (
                        <button
                          key={ac.id}
                          onClick={() => onFlyTo(ac.lat, ac.lng, 0.62)}
                          className="w-full text-left px-3 py-2.5 hover:bg-white/[0.04] transition flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-[12px] font-mono-tech text-white flex items-center gap-2">
                              <span className="font-medium">{ac.callsign}</span>
                              <span className="text-[11px] font-sans text-zinc-500 truncate">
                                {ac.model}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono-tech text-zinc-500 mt-0.5">
                              {ac.altitudeFt.toLocaleString()} ft · {ac.speedKts} kts
                            </div>
                          </div>
                          <span className="text-[11px] font-mono-tech text-zinc-400 shrink-0">
                            {ac.distKm} km
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-zinc-500 py-3 px-3 rounded-lg border border-white/[0.06] bg-white/[0.015]">
                      No ADS-B transponders currently reporting in this sector.
                    </p>
                  )}
                </div>

                {intel.nearbyEvents?.launches?.length > 0 && (
                  <div>
                    <span className="text-[11px] font-mono-tech uppercase tracking-wider text-zinc-400 block mb-2">
                      Spaceports & Launches
                    </span>
                    <div className="space-y-1.5">
                      {intel.nearbyEvents.launches.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => onFlyTo(l.lat, l.lng, 0.85)}
                          className="w-full text-left p-3 rounded-lg bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.08] transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-medium text-white truncate">
                              {l.name}
                            </span>
                            <span className="text-[10.5px] font-mono-tech text-zinc-300 shrink-0">
                              {formatCountdown(l.net)}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                            {l.location} · {l.distKm} km
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {intel.nearbyEvents?.naturalEvents?.length > 0 && (
                  <div>
                    <span className="text-[11px] font-mono-tech uppercase tracking-wider text-zinc-400 block mb-2">
                      Active NASA EONET Events
                    </span>
                    <div className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                      {intel.nearbyEvents.naturalEvents.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => onFlyTo(ev.lat, ev.lng, 0.85)}
                          className="w-full text-left px-3 py-2.5 hover:bg-white/[0.04] transition flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-[12px] font-medium text-zinc-100 truncate">
                              {ev.title}
                            </div>
                            <div className="text-[11px] text-zinc-500">{ev.categoryLabel}</div>
                          </div>
                          <span className="text-[11px] font-mono-tech text-zinc-400 shrink-0">
                            {ev.distKm} km
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {intel.nearbyEvents?.earthquakes?.length > 0 && (
                  <div>
                    <span className="text-[11px] font-mono-tech uppercase tracking-wider text-zinc-400 block mb-2">
                      Recent Seismic Activity
                    </span>
                    <div className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                      {intel.nearbyEvents.earthquakes.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => onFlyTo(q.lat, q.lng, 0.85)}
                          className="w-full text-left px-3 py-2.5 hover:bg-white/[0.04] transition flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-[12px] text-zinc-100 truncate">
                              <span className="font-mono-tech text-red-400 mr-1.5">
                                M{q.mag}
                              </span>
                              {q.place}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono-tech mt-0.5">
                              {q.depth} km depth · {formatRelativeTime(q.time)}
                            </div>
                          </div>
                          <span className="text-[11px] font-mono-tech text-zinc-400 shrink-0">
                            {q.distKm} km
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {intel.nearbyBeacons?.length > 0 && (
                  <div>
                    <span className="text-[11px] font-mono-tech uppercase tracking-wider text-zinc-400 block mb-2">
                      Visitor Pins Nearby
                    </span>
                    <div className="space-y-2">
                      {intel.nearbyBeacons.map((b) => (
                        <div
                          key={b.id}
                          className="p-3 rounded-lg bg-white/[0.025] border border-white/[0.08]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-medium text-white">
                              {b.authorName}{" "}
                              <span className="text-zinc-500 font-normal">· {b.city}</span>
                            </span>
                            <button
                              onClick={() => onPulseBeacon(b.id)}
                              className="text-[11px] font-mono-tech px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08] transition cursor-pointer"
                            >
                              +1 ({b.likes || 1})
                            </button>
                          </div>
                          <p className="text-[12px] text-zinc-400 mt-1">{b.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* RADIO */
              <div className="space-y-2">
                {intel.radios?.length > 0 ? (
                  <div className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                    {intel.radios.map((station) => {
                      const isCurrent =
                        activeStation?.id === station.id && isRadioPlaying;
                      return (
                        <button
                          key={station.id}
                          onClick={() => onPlayRadio(station)}
                          className={`w-full text-left px-3 py-2.5 transition flex items-center justify-between gap-3 cursor-pointer ${
                            isCurrent ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                                isCurrent
                                  ? "bg-zinc-100 text-zinc-950"
                                  : "bg-white/[0.06] text-zinc-200"
                              }`}
                            >
                              {isCurrent ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5 ml-0.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[12px] font-medium text-white truncate">
                                {station.name}
                              </div>
                              <div className="text-[11px] text-zinc-500 truncate">
                                {[station.state, station.country].filter(Boolean).join(", ")}
                                {station.tags?.length > 0 && ` · ${station.tags.join(", ")}`}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10.5px] font-mono-tech text-zinc-500 shrink-0">
                            {station.bitrate || 128}k
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] text-zinc-500 py-8 px-4 text-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
                    No direct HTTPS radio streams listed for this sector. Click any green dot on the
                    globe to tune into worldwide stations.
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
