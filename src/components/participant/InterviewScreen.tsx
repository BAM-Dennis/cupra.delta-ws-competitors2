"use client";

import { useEffect, useRef, useState } from "react";
import { WS_CONFIG } from "@/engine/config";
import type { InterviewTurn, WorkshopConfig } from "@/engine/types";
import { discoveredMotives, type Participant } from "@/lib/participant";
import { Bar, Glyph, TypingDots } from "../shared/bits";
import { Overline, Panel } from "../shared/ui";

/* Interview (US-1): offene Fragen, Persona antwortet in der Rolle */

interface InterviewProps {
  config: WorkshopConfig;
  round: number;
  me: Participant;
  onAsk: (question: string) => Promise<unknown>;
}

export function InterviewScreen({ config, round, me, onAsk }: InterviewProps) {
  const r = config.rounds[round];
  const turns = me.interviews.filter((t) => t.round === round).sort((a, b) => a.idx - b.idx);
  const discovered = discoveredMotives(me, round);
  const total = r.persona.motives.length;
  const done = turns.length >= config.interviewQuestions;
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const trimmed = text.trim();
  const valid = trimmed.length >= WS_CONFIG.QUESTION_MIN_CHARS && trimmed.length <= WS_CONFIG.QUESTION_MAX_CHARS;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, busy]);

  const ask = async () => {
    if (!valid || busy || done) return;
    setBusy(true);
    setText("");
    try {
      await onAsk(trimmed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 pt-5">
        <div className="flex flex-col gap-2">
          <p className="text-[14px] leading-[1.35] text-white/70">
            Ask <span className="font-medium text-white">{r.persona.name}</span> open questions. Why, how, what. Closed questions get you nowhere.
          </p>
          <div className="flex items-center gap-3">
            <Bar value={turns.length / config.interviewQuestions} tone="teal" className="flex-1" />
            <span className="text-[11px] font-medium uppercase tracking-[1px] text-white/60">
              {turns.length} of {config.interviewQuestions} questions
            </span>
          </div>
          {/* Dezentes Signal (B7): Anzahl, nicht Benennung */}
          <div className="flex items-center gap-1.5">
            {r.persona.motives.map((m, i) => (
              <span
                key={m.motiveId}
                className={`h-1.5 flex-1 rounded-full transition ${i < discovered.length ? "bg-copper-gradient shadow-glow" : "bg-white/15"}`}
              />
            ))}
            <span className="pl-1 text-[11px] uppercase tracking-[1px] text-white/50">
              {discovered.length}/{total} motives
            </span>
          </div>
        </div>

        <ol className="flex flex-col gap-4">
          {/* Persona eröffnet */}
          <li className="animate-fade-up">
            <PersonaBubble name={r.persona.name}>
              <p className="text-[14px] leading-[1.4]">{r.persona.intro}</p>
            </PersonaBubble>
          </li>
          {turns.map((t) => (
            <InterviewItem key={t.idx} turn={t} personaName={r.persona.name} />
          ))}
          {busy && (
            <li className="flex flex-col gap-2 animate-fade-up">
              <div className="max-w-[85%] self-end rounded-[12px] rounded-br-[4px] bg-copper-gradient px-4 py-3 text-[15px] opacity-60">…</div>
              <PersonaBubble name={r.persona.name}>
                <TypingDots />
              </PersonaBubble>
            </li>
          )}
        </ol>

        {done && !busy && (
          <Panel className="animate-slide-up">
            <Overline className="text-teal">Interview over</Overline>
            <p className="text-[15px] leading-[1.45]">
              You uncovered {discovered.length} of {total} motives. The trainer reveals all of them in a moment.
            </p>
          </Panel>
        )}
        <div ref={endRef} className="h-2" />
      </div>

      {!done && (
        <div className="sticky bottom-0 z-20 -mx-5 mt-auto bg-gradient-to-b from-transparent via-night/90 to-night px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-8">
          <div className="flex items-end gap-2 rounded-[8px] border border-white/25 bg-night/80 p-2 pl-4 backdrop-blur-[10px] focus-within:border-white/60">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask();
                }
              }}
              rows={1}
              maxLength={WS_CONFIG.QUESTION_MAX_CHARS}
              disabled={busy}
              placeholder={`Question ${turns.length + 1} for ${r.persona.name}…`}
              className="max-h-32 min-h-[40px] min-w-0 flex-1 resize-none bg-transparent py-2 text-[15px] leading-[1.35] text-white outline-none placeholder:text-white/40"
            />
            <button
              type="button"
              onClick={() => void ask()}
              disabled={!valid || busy}
              aria-label="Ask"
              className="flex size-10 shrink-0 items-center justify-center rounded-[6px] bg-copper-gradient text-white transition active:scale-95 disabled:opacity-30"
            >
              <Glyph name="arrow-right" className="size-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InterviewItem({ turn, personaName }: { turn: InterviewTurn; personaName: string }) {
  return (
    <li className="flex flex-col gap-2 animate-fade-up">
      <div className="max-w-[85%] self-end rounded-[12px] rounded-br-[4px] bg-copper-gradient px-4 py-3 text-[15px] leading-[1.35]">{turn.question}</div>
      <PersonaBubble name={personaName} highlight={Boolean(turn.discoveredMotiveId)}>
        <p className="text-[14px] leading-[1.4]">{turn.reply}</p>
        {turn.discoveredMotiveId && (
          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[1px] text-copper-light">
            <Glyph name="spark" className="size-3" /> something surfaced
          </span>
        )}
        {!turn.isOpen && (
          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[1px] text-white/40">
            <Glyph name="x" className="size-3" /> closed question
          </span>
        )}
      </PersonaBubble>
    </li>
  );
}

/** Sprechblase der Persona. Platzhalter-Gestaltung, kommt vom Grafiker. */
function PersonaBubble({ name, children, highlight = false }: { name: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex max-w-[92%] items-start gap-2.5 self-start">
      <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-copper-gradient text-[12px] font-medium">{name[0]}</span>
      <div className={`flex min-w-0 flex-col rounded-[12px] rounded-tl-[4px] border px-4 py-3 backdrop-blur-[10px] ${highlight ? "border-copper/60 bg-copper/15 shadow-[0_0_16px_rgba(183,127,88,0.25)]" : "border-white/15 bg-white/5"}`}>
        <span className="mb-1 text-[10px] font-medium uppercase tracking-[1px] text-white/50">{name}</span>
        {children}
      </div>
    </div>
  );
}
