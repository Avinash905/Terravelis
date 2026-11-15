import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const STEPS = [
  {
    num: "01",
    title: "Click anywhere on Earth",
    desc: "Inspect any city, coastline, or ocean for famous nearby places with photos, live weather, AQI, and overhead flights.",
  },
  {
    num: "02",
    title: "Hover any button for instant help",
    desc: "Pause your cursor on any top button or bottom layer to see a plain-English explanation of what it shows.",
  },
  {
    num: "03",
    title: "Listen to world radio & ride the ISS",
    desc: "Click any green dot on the map to stream live local radio, or click ISS View to follow the Space Station in orbit.",
  },
  {
    num: "04",
    title: "Compare, tour, or share a snapshot",
    desc: "Use Tour for an autopilot highlight reel, Compare inside any place panel to measure flight distance, or Save Card to export an image.",
  },
];

const CONTROLS_LEGEND = [
  { name: "⌘K Search", desc: "Jump immediately to any city, landmark, volcano, or spaceport." },
  { name: "Near me", desc: "Zoom to your location and open local weather, landmarks, and airspace." },
  { name: "Tour", desc: "Auto-flies every 8s across the biggest quake, volcano, launchpad, and ISS." },
  { name: "ISS View", desc: "Locks camera onto the International Space Station (drag globe to exit)." },
  { name: "Audio", desc: "Ambient synth that plays soft notes as live planet events arrive." },
  { name: "Night / Sun", desc: "Switch Night vs. Daylight Earth and scrub 24h sunlight across continents." },
  { name: "Compare", desc: "Measure distance, flight time, TZ offset, and weather between two places." },
  { name: "Drop Pin", desc: "Leave a public marker and short message on your city." },
];

export default function QuickGuideModal({
  isOpen,
  onClose,
  onTrySampleCity,
  onStartTour,
  onTryIss,
}) {
  const [tab, setTab] = useState("start");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md surface-panel rounded-xl p-5"
          >
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/[0.08]">
              <div>
                <h2 className="text-[16px] font-semibold text-white">
                  Welcome to Terravelis
                </h2>
                <p className="text-[12px] text-zinc-400 mt-0.5">
                  Real-time planetary activity, world radio, and local discovery.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-zinc-950 border border-white/[0.08]">
              {[
                { id: "start", label: "Quick Start" },
                { id: "controls", label: "All Controls" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`py-1.5 rounded-md text-[12px] font-medium transition cursor-pointer ${
                    tab === t.id
                      ? "bg-white/[0.1] text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "start" ? (
              <div className="py-3.5 space-y-3">
                {STEPS.map((step) => (
                  <div key={step.num} className="flex items-start gap-3">
                    <span className="text-[11px] font-mono-tech text-zinc-500 pt-0.5 shrink-0">
                      {step.num}
                    </span>
                    <div>
                      <div className="text-[12.5px] font-medium text-zinc-100">
                        {step.title}
                      </div>
                      <p className="text-[11.5px] text-zinc-500 leading-relaxed mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3 max-h-68 overflow-y-auto custom-scroll divide-y divide-white/[0.06]">
                {CONTROLS_LEGEND.map((item) => (
                  <div key={item.name} className="py-2 flex items-baseline justify-between gap-3">
                    <span className="text-[12px] font-medium text-zinc-100 shrink-0 w-24">
                      {item.name}
                    </span>
                    <span className="text-[11.5px] text-zinc-400 text-right leading-snug">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    onClose();
                    onStartTour();
                  }}
                  className="h-8 px-2.5 rounded-md bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-[11.5px] text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  Start Live Tour
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onTrySampleCity();
                  }}
                  className="h-8 px-2.5 rounded-md bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-[11.5px] text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  Try Tokyo
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onTryIss();
                  }}
                  className="h-8 px-2.5 rounded-md bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-[11.5px] text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  Track ISS
                </button>
              </div>

              <button
                onClick={onClose}
                className="h-8 px-4 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-[12px] transition cursor-pointer"
              >
                Explore
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
