"use client";

import { MAX_POINTS_PER_FEATURE } from "@/engine/config";
import { maxPointsPerRound } from "@/engine/scoring";
import type { WorkshopConfig } from "@/engine/types";
import { discoveredMotives, featureScore, interviewScore, type Participant } from "@/lib/participant";
import { Chip, Glyph, PointsBadge, TypingDots } from "../shared/bits";
import { Criterion, FeedbackBubble } from "../shared/Feedback";
import { Overline, Panel } from "../shared/ui";

/**
 * Feedback nach der Feature-Eingabe (self-paced Ersatz für die Trainer-Auswertung):
 * aufgedeckte Motive, jedes genannte Feature mit Bewertung des Scorers und Coaching-Satz,
 * Rundenfazit aus `summarizeRound` und Punkte der Runde.
 */
export function FeedbackScreen({ config, round, me }: { config: WorkshopConfig; round: number; me: Participant }) {
  const r = config.rounds[round];
  const discovered = discoveredMotives(me, round);
  const feats = me.features.filter((f) => f.round === round).sort((a, b) => a.idx - b.idx);
  const summary = me.roundSummaries.find((s) => s.round === round);
  const max = maxPointsPerRound(config, round);
  const points = summary?.points ?? interviewScore(me, round) + featureScore(me, round);
  const motiveMax = Math.min(r.persona.motives.length, config.interviewQuestions);
  const featureMax = feats.length * MAX_POINTS_PER_FEATURE;

  return (
    <div className="flex flex-col gap-5 pt-5 animate-reveal">
      <Panel>
        <div className="flex items-center justify-between gap-3">
          <Overline className="text-teal">Your exploration with {r.persona.name}</Overline>
          <PointsBadge points={points} max={max} />
        </div>
        {summary ? (
          <p className="text-[15px] leading-[1.45]">{summary.text}</p>
        ) : (
          <div className="flex items-center gap-2 text-[14px] text-white/60">
            <TypingDots /> Summarising your exploration
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <ScoreTile label="Interview" value={interviewScore(me, round)} max={motiveMax} />
          <ScoreTile label="Features" value={featureScore(me, round)} max={featureMax} />
        </div>
      </Panel>

      <section className="flex flex-col gap-2">
        <Overline className="text-white/60">Motives you uncovered</Overline>
        <ul className="flex flex-col gap-1.5">
          {r.persona.motives.map((pm) => {
            const m = config.motives.find((x) => x.id === pm.motiveId);
            const found = discovered.includes(pm.motiveId);
            return (
              <li key={pm.motiveId} className={`flex items-center justify-between gap-3 rounded-[8px] border px-4 py-3 ${found ? "border-copper/60 bg-copper/10" : "border-white/15 bg-white/5"}`}>
                <span className="flex min-w-0 items-center gap-2 text-[15px] font-medium leading-[1.3]">
                  <Glyph name={found ? "check" : "x"} className={`size-4 ${found ? "text-copper-light" : "text-white/40"}`} />
                  <span className="min-w-0">{m?.label}</span>
                </span>
                <Chip tone={found ? "copper" : "glass"}>{found ? "uncovered" : "missed"}</Chip>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <Overline className="text-white/60">Your features, one by one</Overline>
        {feats.length === 0 && <p className="text-[14px] text-white/50">You did not name a feature this time.</p>}
        <ol className="flex flex-col gap-3">
          {feats.map((f) => {
            const motive = config.motives.find((m) => m.id === f.evaluation.motiveId);
            const featureDef = f.evaluation.featureId ? config.features.find((x) => x.id === f.evaluation.featureId) : null;
            return (
              <li key={f.idx} className="flex flex-col gap-2 rounded-[10px] border border-white/10 bg-black/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-[15px] leading-[1.35]">{f.text}</span>
                    <span className="text-[11px] uppercase tracking-[0.8px] text-white/50">→ {motive?.label}</span>
                  </div>
                  <PointsBadge points={f.points} max={MAX_POINTS_PER_FEATURE} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Criterion ok={Boolean(f.evaluation.featureId)} label={featureDef ? featureDef.text : "CUPRA feature"} />
                  <Criterion ok={f.evaluation.pairValid} label={f.evaluation.pairValid ? "Valid pair" : "Not a valid pair"} />
                </div>
                <FeedbackBubble>
                  <p className="text-[13px] leading-[1.4] text-white/85">{f.feedback}</p>
                </FeedbackBubble>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function ScoreTile({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-[6px] border border-white/5 bg-white/5 p-2">
      <span className="text-[8px] font-medium uppercase leading-none tracking-[1px] text-white/60">{label}</span>
      <span className="text-[16px] font-medium leading-none tabular-nums">
        {value} <span className="text-[11px] text-white/50">/ {max}</span>
      </span>
    </div>
  );
}
