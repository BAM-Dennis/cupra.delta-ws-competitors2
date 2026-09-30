"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { isRoundPhase, PHASE_LABEL, phaseSequence } from "@/engine/session";
import type { Phase } from "@/engine/types";
import { demoLeaderboard, demoMotiveClusters, demoProgress, participantNames } from "@/lib/demoData";
import { displayCode } from "@/lib/participant";
import { useLocalSession } from "@/lib/useLocalSession";
import { Glyph } from "../shared/bits";
import { ExploreView, FeaturesProgressView, InterviewProgressView, LeaderboardView, LobbyView, MotivesView, PersonaIntroView, SummaryView } from "./views";

/**
 * Trainer-/Präsentations-View für die Leinwand. Breites Layout, große Schrift,
 * Steuerleiste unten. Die Teilnehmer gehen self-paced durch; die Leinwand zeigt,
 * was der Trainer gerade besprechen will. Phase 0: Zustand aus dem localStorage.
 */
export function TrainerApp({ code }: { code: string }) {
  const s = useLocalSession(code);
  const { config, state, me, rounds } = s;
  const [showNames, setShowNames] = useState(false);
  const seq = phaseSequence(rounds);

  // Demo: `?phase=summary` öffnet die Leinwand direkt in einer Phase (Screenshots, Pitch)
  const { loaded, dispatch } = s;
  useEffect(() => {
    if (!loaded) return;
    const wanted = new URLSearchParams(window.location.search).get("phase");
    const target = wanted ? seq.findIndex((x) => x.phase === wanted) : -1;
    if (target < 0) return;
    dispatch({ type: "RESET" });
    for (let i = 0; i < target; i++) dispatch({ type: "NEXT" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  if (!s.loaded) return null;

  const index = seq.findIndex((x) => x.phase === state.phase && x.round === state.round);
  const progress = demoProgress(config, state.phase, state.round, me);
  const leaderboard = demoLeaderboard(config, state.phase, state.round, me);
  const names = participantNames(me);
  const isLast = index === seq.length - 1;

  let view: React.ReactNode = null;
  const round = state.round;
  switch (state.phase) {
    case "lobby":
      view = <LobbyView code={code} participants={progress.participants} />;
      break;
    case "persona":
      view = <PersonaIntroView config={config} round={round} />;
      break;
    case "interview":
      view = <InterviewProgressView config={config} round={round} progress={progress} />;
      break;
    case "motives":
      view = <MotivesView config={config} round={round} />;
      break;
    case "explore":
      view = <ExploreView config={config} round={round} />;
      break;
    case "features":
      view = <FeaturesProgressView config={config} round={round} progress={progress} />;
      break;
    case "summary":
      view = <SummaryView config={config} clusters={demoMotiveClusters(config, me)} />;
      break;
    case "leaderboard":
    case "ended":
      view = <LeaderboardView leaderboard={leaderboard} ended={state.phase === "ended"} />;
      break;
    default:
      view = null;
  }

  return (
    <div className="flex h-dvh flex-col bg-night text-white">
      {/* Kopf */}
      <header className="relative z-30 flex shrink-0 items-center justify-between gap-6 border-b border-white/10 px-6 py-4 lg:px-10 lg:py-5">
        <div className="flex items-center gap-5">
          <img alt="CUPRA" src="/design/emblem.svg" className="h-9 w-auto" />
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-[2px] text-white/50">Global Launch Training</span>
            <span className="text-[20px] font-medium leading-none">{config.title}</span>
          </div>
        </div>
        <PhaseStepper phases={seq.map((x) => x.phase)} current={index} />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowNames((v) => !v)}
            aria-expanded={showNames}
            aria-label={showNames ? "Hide participants" : "Show participants"}
            className={`flex h-9 items-center gap-2 rounded-[6px] border px-3 text-[16px] tabular-nums transition ${showNames ? "border-teal/60 bg-teal-tint text-white" : "border-transparent text-white/80 hover:border-white/20"}`}
          >
            <Glyph name="users" className="size-5" />
            {progress.participants}
            <Glyph name="chevron-right" className={`size-3.5 text-white/50 transition ${showNames ? "-rotate-90" : "rotate-90"}`} />
          </button>
          <span className="rounded-[6px] border border-white/20 px-3 py-1.5 text-[14px] font-medium tracking-[3px]">{displayCode(code)}</span>
        </div>
        {showNames && (
          <div className="absolute right-6 top-full mt-2 w-[min(720px,calc(100vw-48px))] rounded-[10px] border border-white/15 bg-night/95 p-5 shadow-card backdrop-blur-[12px] animate-fade-up lg:right-10">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[2px] text-white/50">In the room · {names.length}</span>
              <button type="button" onClick={() => setShowNames(false)} className="text-[11px] uppercase tracking-[1px] text-white/50 hover:text-white">
                Close
              </button>
            </div>
            <ul className="grid grid-cols-3 gap-x-6 gap-y-1.5 lg:grid-cols-4">
              {names.map((n, i) => (
                <li key={`${n}-${i}`} className={`flex min-w-0 items-center gap-2 text-[15px] leading-[1.35] ${i === 0 && me ? "text-teal" : "text-white/85"}`}>
                  <span className="size-1.5 shrink-0 rounded-full bg-copper-light" />
                  <span className="min-w-0 truncate">{n}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {/* Inhalt */}
      <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-6 py-6 lg:px-10 lg:py-8">
        <div key={`${state.phase}-${state.round}`} className="flex flex-1 flex-col animate-fade-up">
          {view}
        </div>
      </main>

      {/* Steuerleiste */}
      <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-white/10 bg-black/30 px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => s.dispatch({ type: "BACK" })} disabled={index === 0} className="flex h-12 items-center gap-2 rounded-[6px] border border-white/25 bg-white/5 px-5 text-[13px] font-medium uppercase tracking-[1px] disabled:opacity-30">
            <Glyph name="chevron-left" className="size-4" /> Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Reset the session? The screen returns to the lobby and the local participant starts over.")) {
                s.dispatch({ type: "RESET" });
                s.leave();
              }
            }}
            className="flex h-12 items-center gap-2 rounded-[6px] px-4 text-[13px] font-medium uppercase tracking-[1px] text-white/50 hover:text-white"
          >
            <Glyph name="refresh" className="size-4" /> Reset
          </button>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-medium uppercase tracking-[2px] text-white/50">Now</span>
          <span className="text-[18px] leading-none">
            {PHASE_LABEL[state.phase]}
            {isRoundPhase(state.phase) && rounds > 1 && <span className="text-white/50"> · Round {state.round + 1}</span>}
          </span>
        </div>
        <button
          type="button"
          onClick={() => s.dispatch({ type: "NEXT" })}
          disabled={isLast}
          className="flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-[6px] bg-copper-gradient px-6 text-[14px] font-medium uppercase tracking-[1px] transition active:scale-[0.99] disabled:opacity-30"
        >
          {nextLabel(state.phase, state.round, rounds)} <Glyph name="chevron-right" className="size-4" />
        </button>
      </footer>
    </div>
  );
}

function nextLabel(phase: Phase, round: number, rounds: number): string {
  switch (phase) {
    case "lobby":
      return "Start workshop";
    case "persona":
      return "Open interview";
    case "interview":
      return "Reveal motives";
    case "motives":
      return "Send to the cars";
    case "explore":
      return "Open feature input";
    case "features":
      return round + 1 < rounds ? `Start round ${round + 2}` : "Show summary";
    case "summary":
      return "Show leaderboard";
    case "leaderboard":
      return "End workshop";
    default:
      return "Next";
  }
}

function PhaseStepper({ phases, current }: { phases: Phase[]; current: number }) {
  return (
    <ol className="hidden items-center gap-1.5 lg:flex">
      {phases.map((p, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={i} className="flex items-center gap-1.5">
            <span
              title={PHASE_LABEL[p]}
              className={`block rounded-full transition-all ${state === "current" ? "h-2.5 w-7 bg-teal shadow-glow" : state === "done" ? "size-2.5 bg-copper-light" : "size-2.5 bg-white/20"}`}
            />
          </li>
        );
      })}
    </ol>
  );
}
