"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_POINTS_PER_FEATURE, WS_CONFIG } from "@/engine/config";
import { maxPointsPerRound } from "@/engine/scoring";
import type { ScoredFeature, WorkshopConfig } from "@/engine/types";
import type { Participant } from "@/lib/participant";
import { Bar, Glyph, PointsBadge, TypingDots } from "../shared/bits";
import { Criterion, FeedbackBubble } from "../shared/Feedback";
import { Overline, Panel, SecondaryButton } from "../shared/ui";

/* Feature-Eingabe (US-4): Feature plus Motiv, Feedback pro Feature */

interface FeaturesProps {
  config: WorkshopConfig;
  round: number;
  me: Participant;
  onSubmit: (text: string, motiveId: string) => Promise<unknown>;
  onFinish: () => Promise<unknown>;
}

export function FeaturesScreen({ config, round, me, onSubmit, onFinish }: FeaturesProps) {
  const r = config.rounds[round];
  const motives = r.persona.motives.map((pm) => config.motives.find((m) => m.id === pm.motiveId)!).filter(Boolean);
  const feats = me.features.filter((f) => f.round === round).sort((a, b) => a.idx - b.idx);
  const finished = me.roundFinished[round];
  const summary = me.roundSummaries.find((s) => s.round === round);
  const [text, setText] = useState("");
  const [motiveId, setMotiveId] = useState<string>(motives[0]?.id ?? "");
  const [busy, setBusy] = useState<"score" | "finish" | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const full = feats.length >= WS_CONFIG.FEATURES_PER_ROUND;
  const trimmed = text.trim();
  const valid = trimmed.length >= WS_CONFIG.FEATURE_MIN_CHARS && trimmed.length <= WS_CONFIG.FEATURE_MAX_CHARS && Boolean(motiveId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feats.length, busy, finished]);

  const finish = async () => {
    setBusy("finish");
    try {
      await onFinish();
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    if (!valid || busy || full || finished) return;
    const willBeFull = feats.length + 1 >= WS_CONFIG.FEATURES_PER_ROUND;
    setBusy("score");
    setText("");
    try {
      await onSubmit(trimmed, motiveId);
    } finally {
      setBusy(null);
    }
    if (willBeFull) await finish();
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 pt-5">
        <div className="flex flex-col gap-2">
          <p className="text-[14px] leading-[1.35] text-white/70">
            Your top {WS_CONFIG.FEATURES_PER_ROUND} CUPRA features for <span className="font-medium text-white">{r.persona.name}</span>. Name the feature, pick the motive it serves.
          </p>
          <div className="flex items-center gap-3">
            <Bar value={feats.length / WS_CONFIG.FEATURES_PER_ROUND} tone="teal" className="flex-1" />
            <span className="text-[11px] font-medium uppercase tracking-[1px] text-white/60">
              {Math.min(feats.length, WS_CONFIG.FEATURES_PER_ROUND)} of {WS_CONFIG.FEATURES_PER_ROUND}
            </span>
          </div>
        </div>

        <ol className="flex flex-col gap-4">
          {feats.map((f) => (
            <FeatureItem key={f.idx} feature={f} config={config} />
          ))}
          {busy === "score" && (
            <li className="flex flex-col gap-2 animate-fade-up">
              <div className="max-w-[85%] self-end rounded-[12px] rounded-br-[4px] bg-copper-gradient px-4 py-3 text-[15px] opacity-60">…</div>
              <FeedbackBubble>
                <TypingDots />
              </FeedbackBubble>
            </li>
          )}
        </ol>

        {(finished || busy === "finish") && (
          <Panel className="animate-slide-up">
            <div className="flex items-center justify-between">
              <Overline className="text-teal">Round {round + 1} complete</Overline>
              {summary && <PointsBadge points={summary.points} max={maxPointsPerRound(config, round)} />}
            </div>
            {summary ? (
              <p className="text-[15px] leading-[1.45]">{summary.text}</p>
            ) : (
              <div className="flex items-center gap-2 text-[14px] text-white/60">
                <TypingDots /> Summarising your round
              </div>
            )}
            {summary && <p className="text-[12px] text-white/40">The trainer moves everyone on when the room is ready.</p>}
          </Panel>
        )}
        <div ref={endRef} className="h-2" />
      </div>

      {!finished && full && busy !== "finish" && (
        <div className="sticky bottom-0 z-20 -mx-5 mt-auto bg-gradient-to-b from-transparent via-night/90 to-night px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-8">
          <SecondaryButton onClick={() => void finish()}>Show round feedback</SecondaryButton>
        </div>
      )}

      {!finished && !full && (
        <div className="sticky bottom-0 z-20 -mx-5 mt-auto bg-gradient-to-b from-transparent via-night/90 to-night px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-8">
          <div className="flex flex-col gap-2">
            {/* Motiv-Auswahl, mit eigenem Grund, damit sie den Chat darunter nicht überlagert */}
            <div className="flex flex-wrap gap-1.5 rounded-[8px] bg-night/90 p-2 backdrop-blur-[10px]">
              {motives.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMotiveId(m.id)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.8px] transition ${motiveId === m.id ? "border-teal bg-teal-tint shadow-glow" : "border-white/20 bg-white/5 text-white/70"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2 rounded-[8px] border border-white/25 bg-night/80 p-2 pl-4 backdrop-blur-[10px] focus-within:border-white/60">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                maxLength={WS_CONFIG.FEATURE_MAX_CHARS}
                disabled={Boolean(busy)}
                placeholder={`Feature ${feats.length + 1}: what did you see or touch?`}
                className="max-h-32 min-h-[40px] min-w-0 flex-1 resize-none bg-transparent py-2 text-[15px] leading-[1.35] text-white outline-none placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!valid || Boolean(busy)}
                aria-label="Send feature"
                className="flex size-10 shrink-0 items-center justify-center rounded-[6px] bg-copper-gradient text-white transition active:scale-95 disabled:opacity-30"
              >
                <Glyph name="arrow-right" className="size-5" />
              </button>
            </div>
            {feats.length > 0 && (
              <SecondaryButton onClick={() => void finish()} className="!min-h-10 !py-2 text-[12px]">
                Finish round with {feats.length} feature{feats.length > 1 ? "s" : ""}
              </SecondaryButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureItem({ feature, config }: { feature: ScoredFeature; config: WorkshopConfig }) {
  const motive = config.motives.find((m) => m.id === feature.evaluation.motiveId);
  return (
    <li className="flex flex-col gap-2 animate-fade-up">
      <div className="flex max-w-[85%] flex-col gap-1.5 self-end rounded-[12px] rounded-br-[4px] bg-copper-gradient px-4 py-3 text-[15px] leading-[1.35]">
        <span>{feature.text}</span>
        <span className="self-start rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.8px]">→ {motive?.label}</span>
      </div>
      <FeedbackBubble points={feature.points} max={MAX_POINTS_PER_FEATURE}>
        <p className="text-[14px] leading-[1.4]">{feature.feedback}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Criterion ok={Boolean(feature.evaluation.featureId)} label="CUPRA feature" />
          <Criterion ok={feature.evaluation.pairValid} label="Fits the motive" />
        </div>
      </FeedbackBubble>
    </li>
  );
}
