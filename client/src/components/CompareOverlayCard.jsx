import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, X } from "lucide-react";
import {
  describeAqi,
  estimateFlightDuration,
  haversineDistanceKm,
} from "../utils/formatters";

export default function CompareOverlayCard({
  awaitingSecondPoint,
  originIntel,
  targetIntel,
  onSwap,
  onClear,
}) {
  if (!originIntel) return null;

  const distKm =
    targetIntel && originIntel
      ? haversineDistanceKm(
          originIntel.coordinates.lat,
          originIntel.coordinates.lng,
          targetIntel.coordinates.lat,
          targetIntel.coordinates.lng
        )
      : null;

  const distMiles = distKm !== null ? Math.round(distKm * 0.621371) : null;
  const flightTime = distKm !== null ? estimateFlightDuration(distKm) : null;

  const tzDiffHours =
    targetIntel && originIntel
      ? Math.round(
          (((targetIntel.location?.utcOffsetSeconds || 0) -
            (originIntel.location?.utcOffsetSeconds || 0)) /
            3600) *
            10
        ) / 10
      : null;

  return (
    <AnimatePresence>
      {(awaitingSecondPoint || targetIntel) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.16 }}
          className="fixed top-14 sm:top-16 inset-x-2.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 sm:w-full max-w-md surface-panel rounded-xl p-3 sm:p-3.5"
        >
          {awaitingSecondPoint && !targetIntel ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10.5px] font-mono-tech uppercase tracking-wider text-amber-400">
                  Compare Mode
                </div>
                <div className="text-[12px] sm:text-[12.5px] text-zinc-200 mt-0.5 line-clamp-2">
                  Click any second place on Earth to compare with{" "}
                  <strong className="text-white font-semibold">
                    {originIntel.location?.name}
                  </strong>
                </div>
              </div>
              <button
                onClick={onClear}
                className="h-7 px-2.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-[11.5px] text-zinc-300 shrink-0 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : targetIntel ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[13px] font-semibold text-white truncate">
                    {originIntel.location?.name}
                  </span>
                  <button
                    onClick={onSwap}
                    title="Swap cities"
                    className="p-1 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-white shrink-0 cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[13px] font-semibold text-white truncate">
                    {targetIntel.location?.name}
                  </span>
                </div>
                <button
                  onClick={onClear}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-200 shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Distance, Flight Duration, Timezone Delta */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-lg bg-white/[0.03] border border-white/[0.07]">
                <div>
                  <span className="text-[10px] font-mono-tech uppercase text-zinc-500 block">
                    Distance
                  </span>
                  <span className="text-[12.5px] font-mono-tech font-medium text-white">
                    {distKm?.toLocaleString()} km
                  </span>
                  <span className="text-[10px] font-mono-tech text-zinc-500 block">
                    {distMiles?.toLocaleString()} mi
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono-tech uppercase text-zinc-500 block">
                    Est. Flight
                  </span>
                  <span className="text-[12.5px] font-mono-tech font-medium text-white">
                    {flightTime}
                  </span>
                  <span className="text-[10px] font-mono-tech text-zinc-500 block">
                    Great-circle
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono-tech uppercase text-zinc-500 block">
                    Time Delta
                  </span>
                  <span className="text-[12.5px] font-mono-tech font-medium text-white">
                    {tzDiffHours === 0
                      ? "Same TZ"
                      : `${tzDiffHours > 0 ? "+" : ""}${tzDiffHours}h`}
                  </span>
                  <span className="text-[10px] font-mono-tech text-zinc-500 block">
                    Local offset
                  </span>
                </div>
              </div>

              {/* Side-by-Side Weather & AQI */}
              <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                {[originIntel, targetIntel].map((city, i) => {
                  const aqi = describeAqi(city.weather?.usAqi);
                  return (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                    >
                      <div className="text-[11px] font-medium text-zinc-300 truncate">
                        {city.location?.name}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between font-mono-tech">
                        <span className="text-[14px] font-semibold text-white">
                          {city.weather ? `${city.weather.tempC}°C` : "—"}
                        </span>
                        <span className="text-[10.5px] text-zinc-400">
                          {city.weather ? `${city.weather.windKmh} km/h` : ""}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-mono-tech text-zinc-400">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: aqi.dot }}
                        />
                        <span>{aqi.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
