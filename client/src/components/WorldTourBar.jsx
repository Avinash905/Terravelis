import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";

export default function WorldTourBar({
  active,
  paused,
  stops,
  currentIndex,
  onPrev,
  onNext,
  onTogglePause,
  onExit,
}) {
  const stop = stops?.[currentIndex] || null;

  return (
    <AnimatePresence>
      {active && stop && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 w-[calc(100vw-1.5rem)] max-w-md surface-panel rounded-xl overflow-hidden"
        >
          <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[10.5px] font-mono-tech uppercase tracking-wider text-zinc-400">
                <span>
                  Tour {currentIndex + 1}/{stops.length}
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-300 truncate">{stop.tag}</span>
              </div>
              <div className="text-[13px] font-semibold text-white truncate mt-0.5">
                {stop.title}
              </div>
              <div className="text-[11px] text-zinc-400 truncate">{stop.subtitle}</div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onPrev}
                className="h-7 w-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 flex items-center justify-center cursor-pointer"
                title="Previous stop"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onTogglePause}
                className="h-7 w-7 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 flex items-center justify-center cursor-pointer"
                title={paused ? "Resume tour" : "Pause tour"}
              >
                {paused ? (
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                ) : (
                  <Pause className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={onNext}
                className="h-7 w-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 flex items-center justify-center cursor-pointer"
                title="Next stop"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onExit}
                className="h-7 w-7 rounded-md text-zinc-500 hover:text-zinc-200 flex items-center justify-center cursor-pointer ml-0.5"
                title="Exit tour"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Animated Step Progress Line */}
          {!paused && (
            <motion.div
              key={`${currentIndex}-${paused}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 8, ease: "linear" }}
              style={{ transformOrigin: "left" }}
              className="h-[2px] bg-zinc-100"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
