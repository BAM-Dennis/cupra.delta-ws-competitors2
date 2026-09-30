"use client";

import { useCallback, useMemo } from "react";
import { configForCode } from "@/data/config";
import { WS_CONFIG } from "@/engine/config";
import { maxPointsPerRound, pointsForFeature, pointsForInterviewTurn } from "@/engine/scoring";
import { activeRounds, INITIAL_SESSION, participantReducer, sessionReducer } from "@/engine/session";
import type { InterviewTurn, ScoredFeature, SessionEvent, SessionState } from "@/engine/types";
import { getScorer } from "@/scoring";
import { getOrCreateUserId } from "./identity";
import { discoveredMotives, emptyParticipant, meKey, sessionKey, type Participant } from "./participant";
import { readStored, useStoredValue } from "./storedValue";

/** Simulierte Antwortzeit der Bewertung, damit der Prototyp das spätere Verhalten zeigt. */
const FAKE_LATENCY_MS = 900;

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Phase-0-Ersatz für den Server: Session und Teilnehmer im localStorage.
 * Die Leinwand (`state`, `dispatch`) und der Teilnehmer (`me.phase`, `step`) laufen
 * unabhängig: Teilnehmer gehen self-paced durch, der Trainer zeigt auf der Leinwand, was er will.
 * Die Rückgabe entspricht dem, was später `useSession(code)` vom Server liefert.
 */
export function useLocalSession(code: string) {
  const config = useMemo(() => configForCode(code), [code]);
  const rounds = activeRounds(config);
  const [state, setState, stateLoaded] = useStoredValue<SessionState>(sessionKey(code), INITIAL_SESSION);
  const [storedMe, setMe, meLoaded] = useStoredValue<Participant | null>(meKey(code), null);
  // Ältere gespeicherte Teilnehmer ohne eigene Phase starten in der Lobby
  const me = useMemo(() => (storedMe ? { ...storedMe, phase: storedMe.phase ?? "lobby" } : null), [storedMe]);

  /** Leinwand: Phase der Trainer-Ansicht */
  const dispatch = useCallback((event: SessionEvent) => setState((prev) => sessionReducer(prev, event, rounds)), [setState, rounds]);

  /** Teilnehmer: eigene Phase weiter / zurück / von vorn */
  const step = useCallback(
    (event: SessionEvent) => setMe((prev) => (prev ? { ...prev, phase: participantReducer(prev.phase ?? "lobby", event) } : prev)),
    [setMe],
  );

  const join = useCallback(
    (displayName: string) => {
      setMe(emptyParticipant(getOrCreateUserId(), displayName.trim().slice(0, WS_CONFIG.DISPLAY_NAME_MAX), rounds));
    },
    [setMe, rounds],
  );

  /** Matcher A: Frage an die Persona, Antwort in der Rolle, höchstens ein Motiv. */
  const askQuestion = useCallback(
    async (round: number, question: string): Promise<InterviewTurn | undefined> => {
      const scorer = getScorer();
      // Immer den aktuellen Stand lesen, nicht den Closure-Stand (mehrere Aufrufe hintereinander)
      const current = readStored<Participant>(meKey(code));
      if (!current) return;
      const history = current.interviews.filter((t) => t.round === round);
      const idx = history.length;
      if (idx >= config.interviewQuestions) return;
      const [result] = await Promise.all([
        scorer.answerInterview({ config, round, idx, question, history, discoveredMotiveIds: discoveredMotives(current, round) }),
        wait(FAKE_LATENCY_MS),
      ]);
      const turn: InterviewTurn = {
        round,
        idx,
        question,
        reply: result.reply,
        isOpen: result.isOpen,
        discoveredMotiveId: result.discoveredMotiveId,
        points: pointsForInterviewTurn(result.discoveredMotiveId),
        scorer: scorer.name,
      };
      setMe((prev) => (prev ? { ...prev, interviews: [...prev.interviews, turn] } : prev));
      return turn;
    },
    [config, code, setMe],
  );

  /** Matcher B: Feature plus gewähltes Motiv, Paar-Prüfung gegen das Modell. */
  const submitFeature = useCallback(
    async (round: number, text: string, motiveId: string): Promise<ScoredFeature | undefined> => {
      const scorer = getScorer();
      const current = readStored<Participant>(meKey(code));
      if (!current) return;
      const idx = current.features.filter((f) => f.round === round).length;
      if (idx >= WS_CONFIG.FEATURES_PER_ROUND) return;
      const [result] = await Promise.all([scorer.scoreFeature({ config, round, idx, text, motiveId }), wait(FAKE_LATENCY_MS)]);
      const scored: ScoredFeature = {
        round,
        idx,
        text,
        evaluation: result.evaluation,
        feedback: result.feedback,
        points: pointsForFeature(result.evaluation),
        scorer: scorer.name,
      };
      setMe((prev) => (prev ? { ...prev, features: [...prev.features, scored] } : prev));
      return scored;
    },
    [config, code, setMe],
  );

  /** Rundenabschluss: Zusammenfassung des Scorers, Punkte und Maximum der Runde. */
  const finishRound = useCallback(
    async (round: number) => {
      const scorer = getScorer();
      const current = readStored<Participant>(meKey(code));
      if (!current || current.roundFinished[round]) return;
      const interviews = current.interviews.filter((t) => t.round === round);
      const features = current.features.filter((f) => f.round === round);
      const [text] = await Promise.all([scorer.summarizeRound({ config, round, interviews, features }), wait(FAKE_LATENCY_MS)]);
      const points = interviews.reduce((s, t) => s + t.points, 0) + features.reduce((s, f) => s + f.points, 0);
      const summary = { round, points, maxPoints: maxPointsPerRound(config, round), text };
      setMe((prev) =>
        prev
          ? {
              ...prev,
              roundFinished: prev.roundFinished.map((f, i) => (i === round ? true : f)),
              roundSummaries: [...prev.roundSummaries.filter((s) => s.round !== round), summary],
            }
          : prev,
      );
    },
    [config, code, setMe],
  );

  const leave = useCallback(() => setMe(null), [setMe]);

  return {
    config,
    rounds,
    state,
    me,
    loaded: stateLoaded && meLoaded,
    dispatch,
    step,
    join,
    leave,
    askQuestion,
    submitFeature,
    finishRound,
  };
}

export type LocalSession = ReturnType<typeof useLocalSession>;
