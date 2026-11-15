import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCountdown, formatRelativeTime } from "../utils/formatters";

const KIND_DOT = {
  wiki: "#d4d4d8",
  earthquake: "#ef4444",
  volcano: "#f97316",
  natural: "#f59e0b",
  beacon: "#38bdf8",
  radio: "#22c55e",
};

export default function ChatterFeedPanel({ chatter, nextLaunch, onSelectEvent }) {
  const [collapsed, setCollapsed] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden md:block fixed top-16 left-3 z-20">
      <AnimatePresence mode="wait">
        {collapsed ? (
          <motion.button
            key="collapsed-btn"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            onClick={() => setCollapsed(false)}
            className="surface-bar rounded-lg h-9 px-3 text-[12px] font-medium text-zinc-300 hover:text-white flex items-center gap-2 cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Activity Feed</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          </motion.button>
        ) : (
          <motion.div
            key="expanded-feed"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
            className="w-72 surface-panel rounded-xl overflow-hidden flex flex-col max-h-[calc(100vh-8.5rem)]"
          >
            <div className="px-3.5 py-2.5 border-b border-white/[0.07] flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Live Telemetry
              </span>
              <button
                onClick={() => setCollapsed(true)}
                title="Collapse panel"
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {nextLaunch && (
              <button
                onClick={() => onSelectEvent(nextLaunch.lat, nextLaunch.lng)}
                className="mx-2.5 mt-2.5 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-left transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-[10.5px] font-mono-tech">
                  <span className="text-zinc-400">NEXT LAUNCH</span>
                  <span className="text-zinc-100 font-medium">
                    {formatCountdown(nextLaunch.net)}
                  </span>
                </div>
                <div className="text-[12px] font-medium text-zinc-100 truncate mt-1">
                  {nextLaunch.name}
                </div>
                <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                  {nextLaunch.provider} · {nextLaunch.location}
                </div>
              </button>
            )}

            <div className="p-2 space-y-0.5 overflow-y-auto custom-scroll flex-1">
              {chatter.slice(0, 22).map((item) => {
                const dot = KIND_DOT[item.kind] || "#a1a1aa";
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectEvent(item.lat, item.lng)}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition flex items-start gap-2.5 cursor-pointer"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: dot }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[12px] font-medium text-zinc-200 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono-tech text-zinc-500 shrink-0">
                          {formatRelativeTime(item.time)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
