"use client";

import { useState } from "react";
import type { WorkshopConfig } from "@/engine/types";
import type { Participant } from "@/lib/participant";
import { Chip, Glyph } from "../shared/bits";
import { Overline } from "../shared/ui";

/* ------------------------------------------------------------------ */
/* Lobby                                                               */
/* ------------------------------------------------------------------ */

export function LobbyScreen({ me, participants }: { me: Participant; participants: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      <div className="relative flex size-28 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-teal/20 animate-pulse-soft" />
        <span className="absolute inset-4 rounded-full bg-teal/30 animate-pulse-soft [animation-delay:0.4s]" />
        <Glyph name="check" className="relative size-10 text-teal" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-[26px] font-light leading-tight">
          You&apos;re in{me.displayName ? `, ${me.displayName}` : ""}.
        </h2>
        <p className="text-[15px] leading-[1.35] text-white/70">One customer, one competitor, your CUPRA. Press start when you are ready.</p>
      </div>
      <Chip tone="glass">
        <Glyph name="users" className="size-3.5" />
        {participants} in the room
      </Chip>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Exploration (C1): App passiv, Motive der Persona als Leitplanken   */
/* ------------------------------------------------------------------ */

export function ExploreScreen({ config, round }: { config: WorkshopConfig; round: number }) {
  const r = config.rounds[round];
  const [open, setOpen] = useState<string | null>(r.categories[0]?.id ?? null);
  const competitor = config.brands.find((b) => b.id === r.competitorBrandId);
  const motives = r.persona.motives.map((pm) => config.motives.find((m) => m.id === pm.motiveId)?.label ?? pm.motiveId);
  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[24px] font-light leading-tight">Go to the cars.</h2>
        <p className="text-[14px] leading-[1.35] text-white/70">
          Compare the CUPRA with the {competitor?.name} along these categories, with {r.persona.name} in mind. Nothing to type here, just look, touch, ask.
        </p>
      </div>
      <div className="flex flex-col gap-2 rounded-[8px] border border-teal/30 bg-teal/10 p-3.5">
        <Overline className="text-teal">Look for what serves {r.persona.name}&apos;s motives</Overline>
        <div className="flex flex-wrap gap-1.5">
          {motives.map((g) => (
            <Chip key={g} tone="glass">
              {g}
            </Chip>
          ))}
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {r.categories.map((c, i) => {
          const isOpen = open === c.id;
          return (
            <li key={c.id} className={`overflow-hidden rounded-[8px] border transition ${isOpen ? "border-teal/50 bg-teal/10" : "border-white/10 bg-white/5"}`}>
              <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} className="flex w-full items-center gap-3 p-4 text-left">
                <span className={`flex size-7 shrink-0 items-center justify-center rounded-[4px] text-[12px] font-medium ${isOpen ? "bg-teal text-night" : "bg-white/10"}`}>{i + 1}</span>
                <span className="flex-1 text-[16px] font-medium leading-none">{c.title}</span>
                <Glyph name="chevron-right" className={`size-4 text-white/50 transition ${isOpen ? "rotate-90" : ""}`} />
              </button>
              {isOpen && (
                <ol className="flex flex-col gap-2.5 px-4 pb-4 animate-fade-up">
                  {c.prompts.map((p, j) => (
                    <li key={j} className="flex gap-3 text-[14px] leading-[1.4] text-white/85">
                      <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-copper-light" />
                      {p}
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
