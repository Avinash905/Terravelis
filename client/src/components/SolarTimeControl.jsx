import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { formatUtcMinutes } from "../utils/formatters";
import Hint from "./Hint";

export default function SolarTimeControl({
  drawerOpen,
  tourActive,
  surfaceMode,
  solarMinutesUtc,
  isLiveTime,
  onChangeSurfaceMode,
  onChangeSolarMinutes,
  onResetLiveTime,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`fixed bottom-14 sm:bottom-16 z-20 flex flex-col items-end gap-2 transition-all duration-200 ${
        drawerOpen
          ? "hidden lg:flex lg:right-[418px]"
          : tourActive
          ? "hidden md:flex md:right-3"
          : "right-2.5 sm:right-3"
      }`}
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-68 surface-panel rounded-xl p-3.5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono-tech uppercase tracking-wider text-zinc-400">
                Surface & Sunlight
              </span>
              {!isLiveTime && (
                <button
                  onClick={onResetLiveTime}
                  className="text-[11px] font-mono-tech text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  Reset Live
                </button>
              )}
            </div>

            {/* Night / Day Segmented Switch */}
            <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-zinc-950 border border-white/[0.08]">
              {[
                { id: "night", label: "Night Lights" },
                { id: "day", label: "Day Satellite" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onChangeSurfaceMode(opt.id)}
                  className={`py-1.5 rounded-md text-[11.5px] font-medium transition cursor-pointer ${
                    surfaceMode === opt.id
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 24h UTC Sunlight Scrubber */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono-tech mb-1.5">
                <span className="text-zinc-500">Solar Position</span>
                <span className="text-zinc-200">{formatUtcMinutes(solarMinutesUtc)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1439}
                step={5}
                value={solarMinutesUtc}
                onChange={(e) => onChangeSolarMinutes(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-100"
              />
              <div className="flex justify-between text-[10px] font-mono-tech text-zinc-600 mt-1">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:59</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="surface-bar rounded-lg p-1 flex items-center gap-1">
        <Hint
          title="Switch Earth Imagery"
          description="Toggle between glowing Night City Lights and NASA Daylight Satellite view."
          side="top"
        >
          <button
            onClick={() => onChangeSurfaceMode(surfaceMode === "night" ? "day" : "night")}
            className="h-7 px-2.5 rounded-md text-[11.5px] font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          >
            {surfaceMode === "night" ? "Night" : "Daylight"}
          </button>
        </Hint>
        <div className="w-px h-3.5 bg-white/[0.08]" />
        <Hint
          title="24h Sunlight Slider"
          description="Drag time across 24 hours to watch sunrise and sunset move across Earth."
          side="top"
        >
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`h-7 px-2 rounded-md text-[11.5px] font-mono-tech flex items-center gap-1.5 transition cursor-pointer ${
              expanded || !isLiveTime
                ? "bg-zinc-100 text-zinc-950"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>{isLiveTime ? "Sun" : formatUtcMinutes(solarMinutesUtc).slice(0, 5)}</span>
          </button>
        </Hint>
      </div>
    </div>
  );
}
