import { WS_CONFIG } from "./config";
import type { Phase, SessionEvent, SessionState, WorkshopConfig } from "./types";

export const INITIAL_SESSION: SessionState = { phase: "lobby", round: 0, version: 0 };

/** Phasen innerhalb einer Runde (Umsetzungsplan Abschnitt 6). */
const ROUND_PHASES: Phase[] = ["persona", "interview", "motives", "explore", "features"];
/** Phasen der Leinwand nach der letzten Runde. */
const OUTRO_PHASES: Phase[] = ["summary", "leaderboard", "ended"];
/** Globale Reihenfolge aller Phasen, für Vergleiche über beide Abläufe hinweg. */
const PHASE_ORDER: Phase[] = ["lobby", ...ROUND_PHASES, "feedback", ...OUTRO_PHASES];

/** Wie viele der konfigurierten Runden gespielt werden (Pitch: eine Erkundung, das erste Paar). */
export function activeRounds(config: Pick<WorkshopConfig, "rounds">): number {
  return Math.max(1, Math.min(config.rounds.length, WS_CONFIG.EXPLORATIONS));
}

/** Lineare Phasenfolge der Leinwand für `rounds` Runden. */
export function phaseSequence(rounds: number): Array<Pick<SessionState, "phase" | "round">> {
  const seq: Array<Pick<SessionState, "phase" | "round">> = [{ phase: "lobby", round: 0 }];
  for (let r = 0; r < rounds; r++) ROUND_PHASES.forEach((phase) => seq.push({ phase, round: r }));
  OUTRO_PHASES.forEach((phase) => seq.push({ phase, round: Math.max(0, rounds - 1) }));
  return seq;
}

function indexOf(state: SessionState, rounds: number): number {
  const seq = phaseSequence(rounds);
  const i = seq.findIndex((s) => s.phase === state.phase && s.round === state.round);
  return i < 0 ? 0 : i;
}

/** Reducer der Leinwand: NEXT / BACK laufen die Sequenz ab, RESET zurück in die Lobby. */
export function sessionReducer(state: SessionState, event: SessionEvent, rounds: number): SessionState {
  const seq = phaseSequence(rounds);
  const i = indexOf(state, rounds);
  switch (event.type) {
    case "NEXT": {
      const next = seq[Math.min(seq.length - 1, i + 1)];
      if (next.phase === state.phase && next.round === state.round) return state;
      return { ...next, version: state.version + 1 };
    }
    case "BACK": {
      if (i === 0) return state;
      return { ...seq[i - 1], version: state.version + 1 };
    }
    case "RESET":
      return { ...INITIAL_SESSION, version: state.version + 1 };
  }
}

/**
 * Phasen, die der Teilnehmer selbst durchläuft (self-paced, eine Erkundung):
 * Lobby, Runde, eigenes Feedback, Ergebnis mit Leaderboard. Kein Warten auf den Trainer.
 */
export const PARTICIPANT_PHASES: Phase[] = ["lobby", ...ROUND_PHASES, "feedback", "leaderboard"];

/** Reducer des Teilnehmers: NEXT / BACK entlang PARTICIPANT_PHASES, RESET in die Lobby. */
export function participantReducer(phase: Phase, event: SessionEvent): Phase {
  const i = Math.max(0, PARTICIPANT_PHASES.indexOf(phase));
  switch (event.type) {
    case "NEXT":
      return PARTICIPANT_PHASES[Math.min(PARTICIPANT_PHASES.length - 1, i + 1)];
    case "BACK":
      return PARTICIPANT_PHASES[Math.max(0, i - 1)];
    case "RESET":
      return PARTICIPANT_PHASES[0];
  }
}

/** Liegt `phase` in der globalen Reihenfolge bei oder hinter `other`? */
export function phaseAtOrAfter(phase: Phase, other: Phase): boolean {
  return PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(other);
}

export function isRoundPhase(phase: Phase): boolean {
  return ROUND_PHASES.includes(phase);
}

export const PHASE_LABEL: Record<Phase, string> = {
  lobby: "Lobby",
  persona: "Persona",
  interview: "Interview",
  motives: "Motives",
  explore: "Exploration",
  features: "Features",
  feedback: "Feedback",
  summary: "Summary",
  leaderboard: "Leaderboard",
  ended: "End",
};
