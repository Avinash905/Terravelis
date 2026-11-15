import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, X } from "lucide-react";

export default function AuthWatchlistModal({
  isOpen,
  user,
  watchlist,
  onClose,
  onFlyToSaved,
  onRemoveSaved,
  onLogin,
  onRegister,
  onLogout,
}) {
  const [mode, setMode] = useState("watchlist");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await onLogin({ email, password });
      } else {
        await onRegister({ name, email, password });
      }
      setMode("watchlist");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setBusy(false);
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
                <h3 className="text-[15px] font-semibold text-white">
                  {user ? `${user.name}'s Saved Locations` : "Saved Locations"}
                </h3>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  {user
                    ? user.email
                    : "Bookmark places locally, or sign in to sync across devices."}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!user && (
              <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-zinc-950 border border-white/[0.08] mb-4">
                {[
                  { id: "watchlist", label: "Saved" },
                  { id: "login", label: "Sign In" },
                  { id: "register", label: "Create Account" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setMode(t.id);
                      setError("");
                    }}
                    className={`py-1.5 rounded-md text-[12px] font-medium transition cursor-pointer ${
                      mode === t.id
                        ? "bg-white/[0.1] text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {mode === "watchlist" || user ? (
              <div className="space-y-3">
                <div className="max-h-72 overflow-y-auto custom-scroll divide-y divide-white/[0.06] rounded-lg border border-white/[0.08] bg-white/[0.02]">
                  {watchlist.length > 0 ? (
                    watchlist.map((item) => (
                      <div
                        key={item.itemId}
                        className="px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.03]"
                      >
                        <button
                          onClick={() => {
                            onFlyToSaved(item.lat, item.lng);
                            onClose();
                          }}
                          className="text-left min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="text-[12.5px] font-medium text-white truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">
                            {item.country || `${item.lat.toFixed(2)}°, ${item.lng.toFixed(2)}°`}
                          </div>
                        </button>
                        <button
                          onClick={() => onRemoveSaved(item.itemId)}
                          className="p-1.5 rounded text-zinc-500 hover:text-red-400 transition cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 px-4">
                      <p className="text-[12.5px] text-zinc-300 font-medium">
                        No saved locations yet
                      </p>
                      <p className="text-[11.5px] text-zinc-500 mt-1">
                        Click anywhere on the globe and press Save in the inspector panel.
                      </p>
                    </div>
                  )}
                </div>

                {user ? (
                  <div className="pt-2 flex items-center justify-between text-[12px]">
                    <span className="text-zinc-500">Synced to account</span>
                    <button
                      onClick={onLogout}
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setMode("login")}
                    className="w-full h-8 rounded-md bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-[12px] text-zinc-300 font-medium transition cursor-pointer"
                  >
                    Sign in to sync across devices
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {mode === "register" && (
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-white/[0.09] text-[13px] text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-white/[0.09] text-[13px] text-white focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-white/[0.09] text-[13px] text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                {error && (
                  <p className="text-[12px] text-red-300 bg-red-500/10 border border-red-500/25 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-9 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-[12.5px] cursor-pointer disabled:opacity-50"
                >
                  {busy
                    ? "Please wait..."
                    : mode === "login"
                    ? "Sign In"
                    : "Create Account"}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
