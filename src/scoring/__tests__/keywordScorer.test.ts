import { describe, expect, it } from "vitest";
import { getConfig } from "@/data/config";
import { isOpenQuestion, keywordScorer, matchFeature } from "../keywordScorer";

const config = getConfig("demo");

describe("Matcher A: Frage → Motiv (keyword)", () => {
  it("erkennt offene und geschlossene Fragen", () => {
    expect(isOpenQuestion("What do other people notice about your car?")).toBe(true);
    expect(isOpenQuestion("How do you want the car to feel?")).toBe(true);
    expect(isOpenQuestion("Do you like the MINI?")).toBe(false);
    expect(isOpenQuestion("Is range important?")).toBe(false);
  });
  it("deckt bei offener, passender Frage genau ein Motiv auf", async () => {
    const r = await keywordScorer.answerInterview({
      config,
      round: 0,
      idx: 0,
      question: "What do you want other people to notice when you pull up?",
      history: [],
      discoveredMotiveIds: [],
    });
    expect(r.isOpen).toBe(true);
    expect(r.discoveredMotiveId).toBe("m-standout");
    expect(r.reply).toBe(config.rounds[0].persona.motives[0].revealLine);
  });
  it("deckt ein bereits entdecktes Motiv nicht erneut auf", async () => {
    const r = await keywordScorer.answerInterview({
      config,
      round: 0,
      idx: 1,
      question: "What do other people notice about your car?",
      history: [],
      discoveredMotiveIds: ["m-standout"],
    });
    expect(r.discoveredMotiveId).toBeNull();
    expect(r.isOpen).toBe(true);
    expect(r.reply).toMatch(/already|earlier/);
  });
  it("gibt bei geschlossener Frage einen In-Character-Stups ohne Motiv", async () => {
    const r = await keywordScorer.answerInterview({ config, round: 0, idx: 0, question: "Do you like fast cars?", history: [], discoveredMotiveIds: [] });
    expect(r.isOpen).toBe(false);
    expect(r.discoveredMotiveId).toBeNull();
    expect(config.rounds[0].persona.nudgeLines).toContain(r.reply);
  });
});

describe("Matcher B: Feature → Motiv (keyword)", () => {
  it("erkennt ein Feature und prüft das Paar", async () => {
    expect(matchFeature(config, "the copper accents on the front")?.id).toBe("f-copper");
    const ok = await keywordScorer.scoreFeature({ config, round: 0, idx: 0, text: "The copper accents on the front", motiveId: "m-standout" });
    expect(ok.evaluation).toEqual({ featureId: "f-copper", motiveId: "m-standout", pairValid: true });
    const wrong = await keywordScorer.scoreFeature({ config, round: 0, idx: 1, text: "The copper accents on the front", motiveId: "m-character" });
    expect(wrong.evaluation.pairValid).toBe(false);
    expect(wrong.feedback).toMatch(/different motive/);
  });
  it("dasselbe Feature ist unter mehreren Motiven gültig", async () => {
    const a = await keywordScorer.scoreFeature({ config, round: 0, idx: 0, text: "The seat that holds you", motiveId: "m-character" });
    const b = await keywordScorer.scoreFeature({ config, round: 1, idx: 1, text: "The seat that holds you", motiveId: "m-quality" });
    expect(a.evaluation.pairValid && b.evaluation.pairValid).toBe(true);
  });
  it("Sara: Frage nach dem Heimweg deckt das Ruhe-Motiv auf, Frage nach Materialien das Qualitäts-Motiv", async () => {
    const calm = await keywordScorer.answerInterview({ config, round: 1, idx: 0, question: "How do you feel on your drive home after work?", history: [], discoveredMotiveIds: [] });
    expect(calm.discoveredMotiveId).toBe("m-calm");
    const quality = await keywordScorer.answerInterview({ config, round: 1, idx: 1, question: "What do you notice about the materials when you sit in a car?", history: [], discoveredMotiveIds: ["m-calm"] });
    expect(quality.discoveredMotiveId).toBe("m-quality");
  });
  it("Rundenfeedback nennt Punkte und Maximum", async () => {
    const text = await keywordScorer.summarizeRound({ config, round: 0, interviews: [], features: [] });
    expect(text).toMatch(/0 of 9 points/);
  });
});
