"use client";

import type { WorkshopConfig } from "@/engine/types";
import { Overline, Panel } from "../shared/ui";
import { VersusCard } from "./Screens";

/* Persona stellt sich vor (B1): Motive bleiben verdeckt */

export function PersonaIntroScreen({ config, round }: { config: WorkshopConfig; round: number }) {
  const r = config.rounds[round];
  const competitor = config.brands.find((b) => b.id === r.competitorBrandId);
  const cupra = config.brands.find((b) => b.isCupra);
  return (
    <div className="flex flex-col gap-5 pt-6">
      <Panel className="animate-fade-up">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Overline className="text-teal">Meet your customer</Overline>
            <h2 className="mt-2 text-[30px] font-light leading-none">{r.persona.name}</h2>
            {r.persona.tagline && <p className="mt-1.5 text-[13px] text-white/60">{r.persona.tagline}</p>}
          </div>
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-copper-gradient text-[22px] font-medium">{r.persona.name[0]}</div>
        </div>
        <p className="text-[15px] leading-[1.45] text-white/85">“{r.persona.intro}”</p>
      </Panel>

      <section className="flex flex-col gap-2 rounded-[8px] border border-teal/30 bg-teal/10 p-4 animate-fade-up [animation-delay:0.1s]">
        <Overline className="text-teal">Your task</Overline>
        <p className="text-[15px] leading-[1.4]">
          {r.persona.name} has <span className="font-medium">{r.persona.motives.length} emotional motives</span> for buying a car. None of them are on the table yet. In the interview you have{" "}
          <span className="font-medium">{config.interviewQuestions} open questions</span> to uncover them.
        </p>
        <div className="flex gap-1.5 pt-1">
          {r.persona.motives.map((m) => (
            <span key={m.motiveId} className="flex h-8 flex-1 items-center justify-center rounded-[6px] border border-dashed border-white/25 text-[11px] uppercase tracking-[1px] text-white/40">
              hidden
            </span>
          ))}
        </div>
      </section>

      <VersusCard cupra={cupra?.name} competitor={competitor?.name} />
      <p className="text-center text-[12px] text-white/40">The trainer opens the interview.</p>
    </div>
  );
}
