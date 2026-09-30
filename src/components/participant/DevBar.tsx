"use client";

import { useEffect } from "react";
import { PHASE_LABEL } from "@/engine/session";
import type { Phase, SessionEvent } from "@/engine/types";
import { useClientValue } from "@/lib/useClientValue";
import { Glyph } from "../shared/bits";

/**
 * Nur Prototyp: springt durch die Teilnehmer-Phasen, ohne Eingaben zu machen.
 * Sichtbar mit `?dev=1`. Der normale Weg sind die Weiter-Buttons der Screens.
 */
export function DevBar({ phase, step, onLeave }: { phase: Phase; step: (e: SessionEvent) => void; onLeave?: () => void }) {
  const visible = useClientValue(() => new URLSearchParams(window.location.search).get("dev") === "1", false);
  // Platz für die Leiste schaffen, damit sie die Kopfzeile nicht überdeckt
  useEffect(() => {
    if (!visible) return;
    document.documentElement.classList.add("dev-bar");
    return () => document.documentElement.classList.remove("dev-bar");
  }, [visible]);
  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-1">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-warn/50 bg-night/90 px-2 py-1 text-[11px] shadow-card backdrop-blur">
        <span className="px-1 font-medium uppercase tracking-[1px] text-warn">dev</span>
        <button type="button" onClick={() => step({ type: "BACK" })} className="rounded-full p-1 hover:bg-white/10" aria-label="Previous phase">
          <Glyph name="chevron-left" className="size-3.5" />
        </button>
        <span className="min-w-[90px] text-center">{PHASE_LABEL[phase]}</span>
        <button type="button" onClick={() => step({ type: "NEXT" })} className="rounded-full p-1 hover:bg-white/10" aria-label="Next phase">
          <Glyph name="chevron-right" className="size-3.5" />
        </button>
        <button type="button" onClick={() => onLeave?.()} className="rounded-full p-1 hover:bg-white/10" aria-label="Leave session and start over">
          <Glyph name="refresh" className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
