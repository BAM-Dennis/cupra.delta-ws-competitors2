import { describe, expect, it } from "vitest";
import demo from "@/data/config/demo.json";
import { parseWorkshopConfig } from "../configSchema";

describe("Demo-Konfiguration", () => {
  it("ist gültig und vom Typ competitor-2", () => {
    const cfg = parseWorkshopConfig(demo);
    expect(cfg.type).toBe("competitor-2");
    expect(cfg.interviewQuestions).toBe(3);
  });
  it("hat sechs Motive, drei je Persona, ohne Überschneidung (Seed-Content)", () => {
    const cfg = parseWorkshopConfig(demo);
    expect(cfg.motives).toHaveLength(6);
    const [a, b] = cfg.rounds.map((r) => r.persona.motives.map((m) => m.motiveId));
    expect(a).toHaveLength(3);
    expect(b).toHaveLength(3);
    expect(a.filter((m) => b.includes(m))).toEqual([]);
  });
  it("jedes Motiv einer Persona wird von mindestens einem Feature bedient", () => {
    const cfg = parseWorkshopConfig(demo);
    cfg.rounds.forEach((r) =>
      r.persona.motives.forEach((pm) => expect(cfg.features.some((f) => f.motiveIds.includes(pm.motiveId))).toBe(true)),
    );
  });
  it("hat zwei konfigurierte Runden mit eigener Persona und eigenem Wettbewerber (gespielt wird die erste, Nico gegen MINI)", () => {
    const cfg = parseWorkshopConfig(demo);
    expect(cfg.rounds).toHaveLength(2);
    expect(cfg.rounds[0].persona.name).toBe("Nico");
    expect(cfg.rounds[0].competitorBrandId).toBe("mini");
    expect(cfg.rounds[0].competitorBrandId).not.toBe(cfg.rounds[1].competitorBrandId);
    expect(cfg.rounds[0].persona.name).not.toBe(cfg.rounds[1].persona.name);
  });
  it("jedes Feature zahlt auf mindestens zwei Motive ein (many-to-many)", () => {
    parseWorkshopConfig(demo).features.forEach((f) => expect(f.motiveIds.length).toBeGreaterThanOrEqual(2));
  });
  it("erkennt unbekannte Motive in Features und Personas", () => {
    const broken = structuredClone(demo);
    broken.features[0].motiveIds.push("m-unknown");
    broken.rounds[0].persona.motives[0].motiveId = "m-nope";
    expect(() => parseWorkshopConfig(broken)).toThrow(/Unbekanntes Motiv/);
  });
  it("erkennt doppelte Motive bei einer Persona", () => {
    const broken = structuredClone(demo);
    broken.rounds[0].persona.motives[1].motiveId = broken.rounds[0].persona.motives[0].motiveId;
    expect(() => parseWorkshopConfig(broken)).toThrow(/doppelt/);
  });
  it("erkennt eine unbekannte Wettbewerber-Marke", () => {
    const broken = structuredClone(demo);
    broken.rounds[0].competitorBrandId = "tesla";
    expect(() => parseWorkshopConfig(broken)).toThrow(/Unbekannte Marke/);
  });
  it("verlangt genau eine CUPRA-Marke", () => {
    const broken = structuredClone(demo);
    broken.brands[1] = { ...broken.brands[1], isCupra: true };
    expect(() => parseWorkshopConfig(broken)).toThrow(/isCupra/);
  });
});
