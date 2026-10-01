/* eslint-disable @next/next/no-img-element */
import type { Persona } from "@/engine/types";

/**
 * Rundes Persona-Bild. Mit `persona.image` das Foto, sonst Initiale auf Kupfer
 * (Fallback für Personas ohne Bild, z. B. Sara).
 */
export function PersonaAvatar({ persona, className = "size-14 text-[22px]" }: { persona: Pick<Persona, "name" | "image">; className?: string }) {
  if (persona.image) {
    return <img alt={persona.name} src={persona.image} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return <span className={`flex shrink-0 items-center justify-center rounded-full bg-copper-gradient font-medium ${className}`}>{persona.name[0]}</span>;
}
