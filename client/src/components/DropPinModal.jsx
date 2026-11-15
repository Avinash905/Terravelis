import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Search, X } from "lucide-react";
import { resolveUserCoordinates, searchWorldQuery } from "../services/earthClient";

const CATEGORIES = [
  { id: "signal", label: "General" },
  { id: "tech", label: "Engineering" },
  { id: "travel", label: "Travel" },
  { id: "music", label: "Music" },
  { id: "vibe", label: "Late Night" },
];

export default function DropPinModal({ isOpen, presetLocation, user, onClose, onSubmitPin }) {
  const [authorName, setAuthorName] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("signal");
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setAuthorName(user?.name || "");
    setError("");
    setMessage("");
    if (presetLocation?.lat !== undefined && presetLocation?.lng !== undefined) {
      setSelectedPlace(presetLocation);
      setCityQuery(
        [presetLocation.city, presetLocation.country].filter(Boolean).join(", ")
      );
    } else {
      setSelectedPlace(null);
      setCityQuery("");
    }
  }, [isOpen, presetLocation, user]);

  useEffect(() => {
    if (!isOpen || selectedPlace) return undefined;
    const trimmed = cityQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchWorldQuery(trimmed);
        setSuggestions(res.filter((r) => r.type === "place").slice(0, 5));
      } catch {
        setSuggestions([]);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [cityQuery, isOpen, selectedPlace]);

  const handleUseCurrentLocation = async () => {
    setError("");
    setLocating(true);
    try {
      const coords = await resolveUserCoordinates();
      let city = coords.city;
      let country = coords.country;
      let countryCode = coords.countryCode;

      if (!city) {
        const geo = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lng}&localityLanguage=en`
        )
          .then((r) => r.json())
          .catch(() => ({}));
        city = geo.city || geo.locality || geo.principalSubdivision || "Current Location";
        country = geo.countryName || "";
        countryCode = geo.countryCode || "";
      }

      const place = {
        city,
        country,
        countryCode,
        lat: coords.lat,
        lng: coords.lng,
      };
      setSelectedPlace(place);
      setCityQuery([place.city, place.country].filter(Boolean).join(", "));
      setSuggestions([]);
    } catch {
      setError("Could not detect location automatically. Type your city above.");
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedPlace) {
      setError("Select a city from the list or click Use current location.");
      return;
    }
    if (!message.trim()) {
      setError("Enter a short message for your pin.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitPin({
        authorName: authorName.trim() || user?.name || "Visitor",
        avatarColor: "#38bdf8",
        city: selectedPlace.city,
        country: selectedPlace.country || "",
        countryCode: selectedPlace.countryCode || "",
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
        message: message.trim(),
        category,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Unable to publish pin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.16 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[86vh] overflow-y-auto custom-scroll surface-panel rounded-xl p-4 sm:p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-white">Drop a Pin on Earth</h3>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  Add a public note to your city on the live globe.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Name</label>
                <input
                  type="text"
                  maxLength={40}
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-9 px-3 rounded-lg bg-zinc-900/90 border border-white/[0.09] text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-zinc-400">Location</label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="text-[11px] text-zinc-300 hover:text-white cursor-pointer"
                  >
                    {locating ? "Detecting..." : "Use current location"}
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={cityQuery}
                    onChange={(e) => {
                      setCityQuery(e.target.value);
                      setSelectedPlace(null);
                    }}
                    placeholder="Search city..."
                    className="w-full h-9 pl-8 pr-8 rounded-lg bg-zinc-900/90 border border-white/[0.09] text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                  />
                  {selectedPlace && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                {suggestions.length > 0 && !selectedPlace && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg bg-zinc-950 border border-white/15 shadow-2xl overflow-hidden divide-y divide-white/[0.06]">
                    {suggestions.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
                          setSelectedPlace({
                            city: s.title,
                            country: s.subtitle,
                            countryCode: s.countryCode || "",
                            lat: s.lat,
                            lng: s.lng,
                          });
                          setCityQuery(`${s.title}${s.subtitle ? `, ${s.subtitle}` : ""}`);
                          setSuggestions([]);
                        }}
                        className="w-full text-left px-3 py-2 text-[12px] text-zinc-300 hover:bg-white/[0.06] flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">
                          <strong className="text-white font-medium">{s.title}</strong>
                          {s.subtitle ? ` · ${s.subtitle}` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Topic</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium border transition cursor-pointer ${
                        category === c.id
                          ? "bg-zinc-100 border-white text-zinc-950"
                          : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-zinc-400">Note</label>
                  <span className="text-[10.5px] font-mono-tech text-zinc-600">
                    {message.length}/160
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={160}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share what's happening in your city..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900/90 border border-white/[0.09] text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 resize-none"
                />
              </div>

              {error && (
                <p className="text-[12px] text-red-300 bg-red-500/10 border border-red-500/25 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-3 rounded-md text-[12px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-8 px-4 rounded-md bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 font-medium text-[12px] transition cursor-pointer"
                >
                  {submitting ? "Publishing..." : "Publish Pin"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
