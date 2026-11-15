import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react";

export default function RadioMiniPlayer({
  station,
  isPlaying,
  isMuted,
  error,
  onTogglePlay,
  onToggleMute,
  onClose,
  onFlyToStation,
}) {
  return (
    <AnimatePresence>
      {station && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-16 left-3 z-30 w-72 surface-panel rounded-lg p-2.5 flex items-center gap-2.5"
        >
          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 flex items-center justify-center shrink-0 transition cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <div
            onClick={() =>
              station.lat && station.lng && onFlyToStation(station.lat, station.lng, 1.2)
            }
            className="min-w-0 flex-1 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono-tech uppercase tracking-wider text-zinc-400">
                {error ? "Stream unavailable" : isPlaying ? "Live Radio" : "Paused"}
              </span>
              {isPlaying && !error && (
                <div className="flex items-end gap-0.5 h-2 ml-0.5">
                  <span className="w-0.5 h-full bg-emerald-400 eq-bar-1" />
                  <span className="w-0.5 h-full bg-emerald-400 eq-bar-2" />
                  <span className="w-0.5 h-full bg-emerald-400 eq-bar-3" />
                </div>
              )}
            </div>
            <div className="text-[12px] font-medium text-white truncate">{station.name}</div>
            <div className="text-[11px] text-zinc-500 truncate">
              {[station.state, station.country].filter(Boolean).join(", ")}
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded text-zinc-400 hover:text-white transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
