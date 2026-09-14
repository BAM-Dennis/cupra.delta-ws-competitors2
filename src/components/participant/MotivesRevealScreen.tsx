"use client";

import type { WorkshopConfig } from "@/engine/types";
import { discoveredMotives, type Participant } from "@/lib/participant";
import { Chip, PointsBadge } from "../shared/bits";
import { Overline, Panel } from "../shared/ui";

/* Motiv-Reveal (B6): entdeckt vs. nicht entdeckt, jetzt benannt */

export function MotivesRevealScreen({ config, round, me }: { config: WorkshopConfig; round: number; me: Participant }) {
  const r = config.rounds[round];
  const discovered = discoveredMotives(me, round);
  const points = me.interviews.filter((t) => t.round === round).reduce((s, t) => s + t.points, 0);
  return (
    <div className="flex flex-col gap-5 pt-5 animate-reveal">
      <Panel>
        <div className="flex items-center justify-between">
          <Overline className="text-teal">What drives {r.persona.name}</Overline>
          <PointsBadge points={points} max={Math.min(r.persona.motives.length, config.interviewQuestions)} />
        </div>
        <p className="text-[15px] leading-[1.4]">
          You uncovered <span className="font-medium">{discovered.length} of {r.persona.motives.length}</span> motives. These are the feelings the CUPRA has to serve in the next step.
        </p>
      </Panel>
      <ul className="flex flex-col gap-2">
        {r.persona.motives.map((pm) => {
          const m = config.motives.find((x) => x.id === pm.motiveId);
          const found = discovered.includes(pm.motiveId);
          return (
            <li key={pm.motiveId} className={`flex flex-col gap-1.5 rounded-[8px] border p-4 ${found ? "border-copper/60 bg-copper/10" : "border-white/15 bg-white/5"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[16px] font-medium">{m?.label}</span>
                <Chip tone={found ? "copper" : "glass"}>{found ? "uncovered" : "missed"}</Chip>
              </div>
              <p className="text-[13px] leading-[1.4] text-white/70">{m?.description}</p>
              <p className="text-[13px] italic leading-[1.4] text-white/85">“{pm.revealLine}”</p>
            </li>
          );
        })}
      </ul>
      <p className="text-center text-[12px] text-white/40">Next: find the CUPRA features that serve these motives.</p>
    </div>
  );
}
