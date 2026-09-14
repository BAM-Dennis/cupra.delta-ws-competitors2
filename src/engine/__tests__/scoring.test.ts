import { describe, expect, it } from "vitest";
import { getConfig } from "@/data/config";
import { clusterFeaturesByMotive, isValidPair, maxPointsPerRound, pointsForFeature, pointsForInterviewTurn } from "../scoring";
import type { ScoredFeature } from "../types";

const cfg = getConfig("demo");

describe("Scoring", () => {
  it("Interview: ein Punkt pro aufgedecktem Motiv, sonst null", () => {
    expect(pointsForInterviewTurn("m-character")).toBe(1);
    expect(pointsForInterviewTurn(null)).toBe(0);
  });
  it("Feature: erkannt plus gültiges Paar", () => {
    expect(pointsForFeature({ featureId: "f-seat", motiveId: "m-character", pairValid: true })).toBe(2);
    expect(pointsForFeature({ featureId: "f-seat", motiveId: "m-standout", pairValid: false })).toBe(1);
    expect(pointsForFeature({ featureId: null, motiveId: "m-character", pairValid: false })).toBe(0);
  });
  it("isValidPair prüft gegen das Modell, dasselbe Feature ist unter mehreren Motiven gültig", () => {
    expect(isValidPair(cfg, "f-seat", "m-character")).toBe(true);
    expect(isValidPair(cfg, "f-seat", "m-quality")).toBe(true);
    expect(isValidPair(cfg, "f-seat", "m-standout")).toBe(false);
    expect(isValidPair(cfg, "f-nope", "m-character")).toBe(false);
  });
  it("Rundenmaximum: Motive der Persona (höchstens Fragenzahl) plus Features", () => {
    // Persona 1 hat 3 Motive, 3 Fragen, 3 Features à 2 Punkte
    expect(maxPointsPerRound(cfg, 0)).toBe(3 + 6);
    expect(maxPointsPerRound({ ...cfg, interviewQuestions: 2 }, 0)).toBe(2 + 6);
  });
  it("clustert Nennungen nach Motiv und fasst gleiche Features zusammen", () => {
    const f = (featureId: string | null, motiveId: string, text: string): ScoredFeature => ({
      round: 0,
      idx: 0,
      text,
      evaluation: { featureId, motiveId, pairValid: Boolean(featureId) },
      feedback: "",
      points: 0,
      scorer: "keyword",
    });
    const clusters = clusterFeaturesByMotive(cfg, [
      f("f-seat", "m-character", "the seats"),
      f("f-seat", "m-character", "sport seats!"),
      f("f-vz", "m-character", "vz badge"),
      f(null, "m-quality", "the smell"),
    ]);
    expect(clusters).toHaveLength(cfg.motives.length);
    const character = clusters.find((c) => c.motiveId === "m-character")!;
    expect(character.total).toBe(3);
    expect(character.items[0]).toMatchObject({ featureId: "f-seat", count: 2 });
    expect(clusters.find((c) => c.motiveId === "m-quality")!.items[0].text).toBe("the smell");
    expect(clusters.find((c) => c.motiveId === "m-design")!.total).toBe(0);
  });
});
