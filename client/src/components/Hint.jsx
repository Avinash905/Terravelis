import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Hint({
  title,
  description,
  shortcut,
  side = "bottom",
  children,
}) {
  const triggerRef = useRef(null);
  const timerRef = useRef(null);
  const [coords, setCoords] = useState(null);

  const computePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 232;
    const pad = 10;

    let left = rect.left + rect.width / 2;
    left = Math.max(
      tooltipWidth / 2 + pad,
      Math.min(window.innerWidth - tooltipWidth / 2 - pad, left)
    );

    const top = side === "top" ? rect.top - 8 : rect.bottom + 8;
    setCoords({ top, left, side });
  }, [side]);

  const handleEnter = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(computePosition, 130);
  };

  const handleLeave = () => {
    clearTimeout(timerRef.current);
    setCoords(null);
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <span
      ref={triggerRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseDown={handleLeave}
      className="inline-flex shrink-0"
    >
      {children}
      {coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: `${coords.left}px`,
              top: `${coords.top}px`,
              transform:
                coords.side === "top"
                  ? "translate(-50%, -100%)"
                  : "translate(-50%, 0)",
              width: "max-content",
              maxWidth: "232px",
              zIndex: 9999,
              pointerEvents: "none",
            }}
            className="rounded-lg bg-[#0c0c0f]/96 border border-white/12 px-2.5 py-2 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-semibold text-zinc-100 leading-tight">
                {title}
              </span>
              {shortcut && (
                <kbd className="text-[10px] font-mono-tech px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-white/10 shrink-0">
                  {shortcut}
                </kbd>
              )}
            </div>
            {description && (
              <p className="text-[11px] text-zinc-400 leading-snug mt-1">
                {description}
              </p>
            )}
          </div>,
          document.body
        )}
    </span>
  );
}
