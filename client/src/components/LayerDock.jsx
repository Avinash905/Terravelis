import React from "react";
import Hint from "./Hint";

const LAYER_CONFIG = [
  {
    key: "earthquakes",
    label: "Seismic",
    dot: "#ef4444",
    countKey: "earthquakes",
    desc: "Live USGS earthquakes from the last 24 hours. Red dots mark M5.0+ quakes.",
  },
  {
    key: "naturalEvents",
    label: "Natural Events",
    dot: "#f97316",
    countKey: "naturalEvents",
    desc: "Active wildfires, erupting volcanoes, and severe storms tracked by NASA satellites.",
  },
  {
    key: "iss",
    label: "ISS Orbit",
    dot: "#60a5fa",
    desc: "Shows the 3D International Space Station and its live 90-minute orbital path.",
  },
  {
    key: "launches",
    label: "Launches",
    dot: "#e4e4e7",
    countKey: "launches",
    desc: "Global spaceports with upcoming orbital rocket launches and T-minus countdowns.",
  },
  {
    key: "radios",
    label: "Radio",
    dot: "#22c55e",
    countKey: "radios",
    desc: "Live internet & FM radio towers worldwide. Click any green dot to listen live.",
  },
  {
    key: "wiki",
    label: "Wikipedia Live",
    dot: "#d4d4d8",
    desc: "Expanding white ripples wherever humans edit Wikipedia articles in real time.",
  },
  {
    key: "cables",
    label: "Subsea Cables",
    dot: "#94a3b8",
    countKey: "cables",
    desc: "Major undersea fiber-optic cables carrying intercontinental internet traffic.",
  },
  {
    key: "beacons",
    label: "Visitor Pins",
    dot: "#38bdf8",
    countKey: "beacons",
    desc: "Public notes and signals dropped on the map by visitors from around the world.",
  },
];

export default function LayerDock({ layers, counts, onToggleLayer }) {
  return (
    <div className="fixed bottom-2.5 sm:bottom-3 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-20 sm:max-w-[calc(100vw-1.5rem)] flex justify-center pointer-events-none">
      <div className="pointer-events-auto surface-bar rounded-lg p-1 flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
        {LAYER_CONFIG.map((item) => {
          const active = Boolean(layers[item.key]);
          const count = item.countKey ? counts[item.countKey] || 0 : null;

          return (
            <Hint
              key={item.key}
              title={`${item.label} (${active ? "Shown" : "Hidden"})`}
              description={item.desc}
              side="top"
            >
              <button
                onClick={() => onToggleLayer(item.key)}
                className={`h-8 px-2.5 rounded-md text-[11.5px] sm:text-[12px] font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 transition cursor-pointer ${
                  active
                    ? "bg-white/[0.1] text-white"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 transition"
                  style={{
                    backgroundColor: active ? item.dot : "#3f3f46",
                  }}
                />
                <span className="whitespace-nowrap">{item.label}</span>
                {count !== null && count > 0 && (
                  <span
                    className={`text-[10.5px] font-mono-tech whitespace-nowrap ${
                      active ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            </Hint>
          );
        })}
      </div>
    </div>
  );
}
