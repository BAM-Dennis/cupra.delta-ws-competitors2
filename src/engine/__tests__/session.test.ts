import { describe, expect, it } from "vitest";
import { INITIAL_SESSION, phaseSequence, sessionReducer } from "../session";
import type { SessionState } from "../types";

function run(state: SessionState, n: number, rounds = 2): SessionState {
  let s = state;
  for (let i = 0; i < n; i++) s = sessionReducer(s, { type: "NEXT" }, rounds);
  return s;
}

describe("sessionReducer", () => {
  it("läuft die komplette Sequenz mit zwei Runden ab", () => {
    const seq = phaseSequence(2).map((s) => `${s.phase}:${s.round}`);
    expect(seq).toEqual([
      "lobby:0",
      "persona:0",
      "interview:0",
      "motives:0",
      "explore:0",
      "features:0",
      "persona:1",
      "interview:1",
      "motives:1",
      "explore:1",
      "features:1",
      "summary:1",
      "leaderboard:1",
      "ended:1",
    ]);
  });
  it("NEXT erhöht die Version und bleibt am Ende stehen", () => {
    const end = run(INITIAL_SESSION, 20);
    expect(end).toMatchObject({ phase: "ended", round: 1, version: 13 });
    expect(run(end, 1)).toEqual(end);
  });
  it("BACK geht eine Phase zurück, nicht vor die Lobby", () => {
    const s = run(INITIAL_SESSION, 6);
    expect(s).toMatchObject({ phase: "persona", round: 1 });
    const back = sessionReducer(s, { type: "BACK" }, 2);
    expect(back).toMatchObject({ phase: "features", round: 0, version: 7 });
    expect(sessionReducer(INITIAL_SESSION, { type: "BACK" }, 2)).toEqual(INITIAL_SESSION);
  });
  it("RESET führt in die Lobby", () => {
    const s = run(INITIAL_SESSION, 7);
    expect(sessionReducer(s, { type: "RESET" }, 2)).toEqual({ phase: "lobby", round: 0, version: 8 });
  });
  it("ist generisch in der Rundenzahl", () => {
    expect(phaseSequence(1)).toHaveLength(1 + 5 + 3);
    expect(phaseSequence(3)).toHaveLength(1 + 15 + 3);
  });
});
