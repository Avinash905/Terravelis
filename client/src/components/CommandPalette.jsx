import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { searchWorldQuery } from "../services/earthClient";

const FEATURED_DESTINATIONS = [
  { id: "feat-hyd", title: "Hyderabad", subtitle: "Telangana, India", lat: 17.385, lng: 78.4867 },
  { id: "feat-tok", title: "Tokyo", subtitle: "Kanto, Japan", lat: 35.6762, lng: 139.6503 },
  { id: "feat-rey", title: "Reykjavik", subtitle: "Reykjanes Rift, Iceland", lat: 64.1466, lng: -21.9426 },
  { id: "feat-isro", title: "Sriharikota", subtitle: "Satish Dhawan Space Centre, India", lat: 13.7199, lng: 80.2304 },
  { id: "feat-par", title: "Paris", subtitle: "Ile-de-France, France", lat: 48.8566, lng: 2.3522 },
  { id: "feat-nyc", title: "New York", subtitle: "United States", lat: 40.7128, lng: -74.006 },
  { id: "feat-giz", title: "Cairo & Giza", subtitle: "Nile Delta, Egypt", lat: 30.0444, lng: 31.2357 },
  { id: "feat-rio", title: "Rio de Janeiro", subtitle: "Brazil", lat: -22.9068, lng: -43.1729 },
];

export default function CommandPalette({ isOpen, onClose, onSelectDestination }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchWorldQuery(trimmed);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const displayed = query.trim().length >= 2 ? results : FEATURED_DESTINATIONS;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-start justify-center pt-20 sm:pt-28 px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg surface-panel rounded-xl overflow-hidden"
          >
            <div className="px-3.5 py-3 border-b border-white/[0.08] flex items-center gap-2.5">
              <Search className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to city, landmark, volcano, spaceport..."
                className="w-full bg-transparent text-[13px] text-white placeholder:text-zinc-500 focus:outline-none"
              />
              {searching && (
                <span className="text-[11px] font-mono-tech text-zinc-500">Searching...</span>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-2 max-h-88 overflow-y-auto custom-scroll">
              <div className="px-2.5 py-1 text-[10.5px] font-mono-tech uppercase tracking-wider text-zinc-500">
                {query.trim().length >= 2 ? "Results" : "Suggested Coordinates"}
              </div>

              {displayed.length > 0 ? (
                <div className="mt-0.5 space-y-0.5">
                  {displayed.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectDestination(item.lat, item.lng);
                        onClose();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/[0.06] transition flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-zinc-100 truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">{item.subtitle}</div>
                      </div>
                      <span className="text-[11px] font-mono-tech text-zinc-500 shrink-0">
                        {item.lat.toFixed(2)}°, {item.lng.toFixed(2)}°
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                !searching && (
                  <p className="text-center text-[12px] text-zinc-500 py-8">
                    No matching coordinates for &ldquo;{query}&rdquo;.
                  </p>
                )
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
