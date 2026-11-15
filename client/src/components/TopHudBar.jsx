import React, { useEffect, useState } from "react";
import { HelpCircle, Search, Volume2, VolumeX, X } from "lucide-react";
import { formatCoords } from "../utils/formatters";
import Hint from "./Hint";

export default function TopHudBar({
  viewerCount,
  iss,
  followIss,
  tourActive,
  soundEnabled,
  user,
  watchlistCount,
  onOpenSearch,
  onLocateMe,
  onToggleTour,
  onToggleFollowIss,
  onToggleSound,
  onOpenDropPin,
  onOpenAuthWatchlist,
  onOpenGuide,
  onResetView,
}) {
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setUtcTime(new Date().toISOString().slice(11, 19) + " UTC");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <header className="fixed top-2.5 sm:top-3 inset-x-2 sm:inset-x-3 z-20 pointer-events-none flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left: Minimal Wordmark + Telemetry */}
        <div className="pointer-events-auto surface-bar rounded-lg h-9 sm:h-10 px-2.5 sm:px-3 flex items-center gap-2.5 shrink-0">
          <Hint
            title="Reset Globe View"
            description="Return camera to the default global view and close active panels."
            side="bottom"
          >
            <button
              onClick={onResetView}
              className="flex items-center gap-2 text-left whitespace-nowrap cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-[12.5px] sm:text-[13px] font-semibold tracking-tight text-white">
                Terravelis
              </span>
              <span className="hidden lg:inline text-[12px] text-zinc-500">/ Earth</span>
            </button>
          </Hint>

          <div className="hidden xl:flex items-center gap-3 pl-3 border-l border-white/[0.08] text-[11px] font-mono-tech text-zinc-400 whitespace-nowrap">
            <span>{Math.max(1, viewerCount)} active</span>
            <span className="text-zinc-600">·</span>
            <span>{utcTime}</span>
          </div>
        </div>

        {/* Center: Clean Architectural Search Input (Desktop/Tablet) */}
        <div className="pointer-events-auto hidden md:flex items-center min-w-0 flex-1 max-w-sm lg:max-w-md justify-center">
          <Hint
            title="Global Search"
            shortcut="⌘K"
            description="Instantly fly to any city, landmark, active volcano, earthquake, or rocket launchpad."
            side="bottom"
          >
            <button
              onClick={onOpenSearch}
              className="surface-bar rounded-lg h-10 w-72 lg:w-92 px-3 flex items-center justify-between gap-2 text-[12px] text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">Search city, landmark, volcano, launchpad...</span>
              </span>
              <kbd className="text-[10px] font-mono-tech px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-white/10 shrink-0">
                ⌘K
              </kbd>
            </button>
          </Hint>
        </div>

        {/* Right: Responsive Monochrome Controls (never wraps or overflows on 360px mobile) */}
        <div className="pointer-events-auto surface-bar rounded-lg h-9 sm:h-10 px-1 sm:px-1.5 flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={onOpenSearch}
            className="md:hidden h-7 w-7 rounded-md text-zinc-300 hover:text-white hover:bg-white/[0.06] transition flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <Hint
            title="Near Me"
            description="Zoom to your current city and see nearby landmarks, weather, and live flights overhead."
            side="bottom"
          >
            <button
              onClick={onLocateMe}
              className="hidden sm:inline-flex h-7 px-2.5 rounded-md text-[12px] font-medium whitespace-nowrap shrink-0 text-zinc-300 hover:text-white hover:bg-white/[0.06] transition items-center cursor-pointer"
            >
              Near me
            </button>
          </Hint>

          <Hint
            title="Auto-Pilot World Tour"
            description="Hands-free camera tour that flies every 8 seconds across today's biggest quake, volcano, rocket launch, and ISS."
            side="bottom"
          >
            <button
              onClick={onToggleTour}
              className={`h-7 px-2 sm:px-2.5 rounded-md text-[11.5px] sm:text-[12px] font-medium whitespace-nowrap shrink-0 transition cursor-pointer flex items-center ${
                tourActive
                  ? "bg-zinc-100 text-zinc-950"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <span>{tourActive ? "Stop" : "Tour"}</span>
            </button>
          </Hint>

          <Hint
            title="Follow Space Station"
            description="Lock the 3D camera onto the real International Space Station orbiting Earth at ~27,600 km/h."
            side="bottom"
          >
            <button
              onClick={onToggleFollowIss}
              className={`h-7 px-2 sm:px-2.5 rounded-md text-[11.5px] sm:text-[12px] font-medium whitespace-nowrap shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                followIss
                  ? "bg-zinc-100 text-zinc-950"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  followIss ? "bg-blue-600" : "bg-blue-400"
                }`}
              />
              <span className="sm:hidden">ISS</span>
              <span className="hidden sm:inline">ISS View</span>
            </button>
          </Hint>

          <Hint
            title="Ambient Planet Synth"
            description="Plays gentle spatial musical chimes whenever live Wikipedia edits or visitor pins arrive."
            side="bottom"
          >
            <button
              onClick={onToggleSound}
              className={`hidden sm:inline-flex h-7 px-2 rounded-md text-[12px] font-medium whitespace-nowrap shrink-0 transition cursor-pointer items-center gap-1.5 ${
                soundEnabled
                  ? "bg-zinc-100 text-zinc-950"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span className="hidden lg:inline">Audio</span>
            </button>
          </Hint>

          <div className="hidden sm:block w-px h-4 bg-white/[0.08] mx-0.5 shrink-0" />

          <Hint
            title="Saved Locations"
            description="View places you bookmarked. Optional sign-in syncs your saved list across devices."
            side="bottom"
          >
            <button
              onClick={onOpenAuthWatchlist}
              className="h-7 px-2 sm:px-2.5 rounded-md text-[11.5px] sm:text-[12px] font-medium whitespace-nowrap shrink-0 text-zinc-300 hover:text-white hover:bg-white/[0.06] transition flex items-center gap-1 cursor-pointer"
            >
              <span>{user ? user.name.split(" ")[0] : "Saved"}</span>
              {watchlistCount > 0 && (
                <span className="text-[10.5px] font-mono-tech text-zinc-400">
                  {watchlistCount}
                </span>
              )}
            </button>
          </Hint>

          <Hint
            title="Drop a Public Pin"
            description="Place a pin and short note on your city for everyone exploring the globe to see."
            side="bottom"
          >
            <button
              onClick={() => onOpenDropPin(null)}
              className="h-7 px-2.5 sm:px-3 rounded-md text-[11.5px] sm:text-[12px] font-medium whitespace-nowrap shrink-0 bg-zinc-100 hover:bg-white text-zinc-950 transition cursor-pointer"
            >
              <span className="sm:hidden">Pin</span>
              <span className="hidden sm:inline">Drop Pin</span>
            </button>
          </Hint>

          <Hint
            title="Guide & Controls"
            description="Quick overview of every feature, layer color, and control."
            side="bottom"
          >
            <button
              onClick={onOpenGuide}
              className="h-7 w-7 xl:w-auto xl:px-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition flex items-center justify-center gap-1 text-[12px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">Guide</span>
            </button>
          </Hint>
        </div>
      </header>

      {/* SpaceX-Style ISS Orbital Telemetry Strip when ISS View is Active */}
      {followIss && iss && (
        <div className="fixed top-14 sm:top-16 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-20 surface-bar rounded-lg px-3 py-2 flex items-center justify-between sm:justify-start gap-3 sm:gap-4 text-[11px] font-mono-tech max-w-full">
          <div className="flex items-center gap-2 text-zinc-100 font-sans font-semibold text-[12px] whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            <span>ISS Lock</span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-4 text-zinc-300 whitespace-nowrap overflow-hidden">
            <span className="hidden md:inline">{formatCoords(iss.lat, iss.lng)}</span>
            <span className="hidden md:inline text-zinc-600">|</span>
            <span>{iss.altitudeKm} KM</span>
            <span className="text-zinc-600">|</span>
            <span>{iss.velocityKmh?.toLocaleString()} KM/H</span>
          </div>
          <button
            onClick={onToggleFollowIss}
            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 text-zinc-200 font-sans text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>Exit</span>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </>
  );
}
