"use client";

import type { WorkshopConfig } from "@/engine/types";
import type { Participant } from "@/lib/participant";
import { Glyph, PointsBadge } from "../shared/bits";
import { Overline } from "../shared/ui";

/* Zusammenfassung läuft auf der Leinwand (E2) */

export function SummaryWaitScreen({ config, me }: { config: WorkshopConfig; me: Participant }) {
  const summaries = [...me.roundSummaries].sort((a, b) => a.round - b.round);
  return (
    <div className="flex flex-1 flex-col gap-5 pt-5">
      <div className="flex items-center gap-3 rounded-[8px] border border-teal/40 bg-teal/10 p-4">
        <Glyph name="spark" className="size-5 text-teal" />
        <div className="flex flex-col">
          <span className="text-[15px] font-medium leading-none">Look at the screen</span>
          <span className="mt-1 text-[12px] text-white/60">The trainer shows what the room found for each motive.</span>
        </div>
      </div>
      <Overline className="text-white/60">Your rounds</Overline>
      <ul className="flex flex-col gap-2">
        {config.rounds.map((r, i) => {
          const s = summaries.find((x) => x.round === i);
          return (
            <li key={r.id} className="glass flex flex-col gap-1.5 rounded-[6px] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium">
                  Round {i + 1} · {r.persona.name}
                </span>
                {s && <PointsBadge points={s.points} max={s.maxPoints} />}
              </div>
              {s ? <p className="text-[13px] leading-[1.4] text-white/75">{s.text}</p> : <p className="text-[13px] text-white/40">Not completed.</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
