import { describe, expect, it } from "vitest";
import { getConfig } from "@/data/config";
import { activeRounds, INITIAL_SESSION, PARTICIPANT_PHASES, participantReducer, phaseAtOrAfter, phaseSequence, sessionReducer } from "../session";
import type { Phase, SessionState } from "../types";

const cfg = getConfig("demo");
const ROUNDS = activeRounds(cfg);

function run(state: SessionState, n: number, rounds = ROUNDS): SessionState {
  let s = state;
  for (let i = 0; i < n; i++) s = sessionReducer(s, { type: "NEXT" }, rounds);
  return s;
}

describe("Leinwand: sessionReducer mit einer Erkundung", () => {
  it("spielt nur die erste konfigurierte Runde, obwohl zwei konfiguriert sind", () => {
    expect(cfg.rounds).toHaveLength(2);
    expect(ROUNDS).toBe(1);
  });
  it("läuft die komplette Sequenz ab: Lobby, Runde, Zusammenfassung, Leaderboard, Ende", () => {
    const seq = phaseSequence(ROUNDS).map((s) => `${s.phase}:${s.round}`);
    expect(seq).toEqual(["lobby:0", "persona:0", "interview:0", "motives:0", "explore:0", "features:0", "summary:0", "leaderboard:0", "ended:0"]);
  });
  it("NEXT erhöht die Version und bleibt am Ende stehen", () => {
    const end = run(INITIAL_SESSION, 20);
    expect(end).toMatchObject({ phase: "ended", round: 0, version: 8 });
    expect(run(end, 1)).toEqual(end);
  });
  it("BACK geht eine Phase zurück, nicht vor die Lobby", () => {
    const s = run(INITIAL_SESSION, 6);
    expect(s).toMatchObject({ phase: "summary", round: 0 });
    const back = sessionReducer(s, { type: "BACK" }, ROUNDS);
    expect(back).toMatchObject({ phase: "features", round: 0, version: 7 });
    expect(sessionReducer(INITIAL_SESSION, { type: "BACK" }, ROUNDS)).toEqual(INITIAL_SESSION);
  });
  it("RESET führt in die Lobby", () => {
    const s = run(INITIAL_SESSION, 5);
    expect(sessionReducer(s, { type: "RESET" }, ROUNDS)).toEqual({ phase: "lobby", round: 0, version: 6 });
  });
  it("ist generisch in der Rundenzahl", () => {
    expect(phaseSequence(1)).toHaveLength(1 + 5 + 3);
    expect(phaseSequence(3)).toHaveLength(1 + 15 + 3);
    expect(phaseSequence(2).filter((s) => s.round === 1)).toHaveLength(5 + 3);
  });
});

describe("Teilnehmer: self-paced participantReducer", () => {
  it("geht Lobby, Runde, Feedback, Ergebnis durch, ohne Trainer-Phasen", () => {
    expect(PARTICIPANT_PHASES).toEqual(["lobby", "persona", "interview", "motives", "explore", "features", "feedback", "leaderboard"]);
  });
  it("NEXT läuft bis zum Ergebnis und bleibt dort", () => {
    let p: Phase = "lobby";
    const seen: Phase[] = [p];
    for (let i = 0; i < 10; i++) {
      p = participantReducer(p, { type: "NEXT" });
      seen.push(p);
    }
    expect(seen.slice(0, PARTICIPANT_PHASES.length)).toEqual(PARTICIPANT_PHASES);
    expect(p).toBe("leaderboard");
  });
  it("BACK und RESET", () => {
    expect(participantReducer("feedback", { type: "BACK" })).toBe("features");
    expect(participantReducer("lobby", { type: "BACK" })).toBe("lobby");
    expect(participantReducer("leaderboard", { type: "RESET" })).toBe("lobby");
  });
  it("Feedback liegt in der globalen Reihenfolge nach den Features", () => {
    expect(phaseAtOrAfter("feedback", "features")).toBe(true);
    expect(phaseAtOrAfter("explore", "features")).toBe(false);
    expect(phaseAtOrAfter("summary", "features")).toBe(true);
  });
});
