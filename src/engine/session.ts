import type { Phase, SessionEvent, SessionState } from "./types";

export const INITIAL_SESSION: SessionState = { phase: "lobby", round: 0, version: 0 };

/** Phasen innerhalb einer Runde (Umsetzungsplan Abschnitt 6). */
const ROUND_PHASES: Phase[] = ["persona", "interview", "motives", "explore", "features"];
/** Phasen nach der letzten Runde. */
const OUTRO_PHASES: Phase[] = ["summary", "leaderboard", "ended"];

/** Lineare Phasenfolge für eine Konfiguration mit `rounds` Runden. */
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

/** Reducer: NEXT / BACK laufen die Sequenz ab, RESET zurück in die Lobby. */
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
  summary: "Summary",
  leaderboard: "Leaderboard",
  ended: "End",
};
