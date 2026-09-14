import { z } from "zod";
import type { WorkshopConfig } from "./types";

const id = z.string().min(1);

const brandSchema = z.object({
  id,
  name: z.string().min(1),
  short: z.string().optional(),
  isCupra: z.boolean().optional(),
  present: z.boolean(),
});

const categorySchema = z.object({ id, title: z.string().min(1), prompts: z.array(z.string().min(1)).min(1) });

const motiveSchema = z.object({ id, label: z.string().min(1), description: z.string().min(1) });

const personaMotiveSchema = z.object({
  motiveId: id,
  topics: z.array(z.string().min(1)).min(1),
  revealLine: z.string().min(1),
  keywords: z.array(z.string()).optional(),
});

const roundSchema = z.object({
  id,
  competitorBrandId: id,
  persona: z.object({
    name: z.string().min(1),
    tagline: z.string().optional(),
    intro: z.string().min(1),
    background: z.string().optional(),
    motives: z.array(personaMotiveSchema).min(1),
    nudgeLines: z.array(z.string().min(1)).min(1),
  }),
  categories: z.array(categorySchema).min(1),
});

const featureSchema = z.object({
  id,
  text: z.string().min(1),
  motiveIds: z.array(id).min(1),
  keywords: z.array(z.string()).optional(),
});

export const workshopConfigSchema = z
  .object({
    id,
    type: z.literal("competitor-2"),
    market: z.string(),
    workshopRef: z.string(),
    language: z.string(),
    title: z.string(),
    brands: z.array(brandSchema).min(2),
    interviewQuestions: z.number().int().min(1).max(6),
    motives: z.array(motiveSchema).min(1),
    features: z.array(featureSchema).min(1),
    rounds: z.array(roundSchema).min(1),
  })
  .superRefine((cfg, ctx) => {
    const brandIds = new Set(cfg.brands.map((b) => b.id));
    const motiveIds = new Set(cfg.motives.map((m) => m.id));

    if (cfg.brands.filter((b) => b.isCupra).length !== 1) {
      ctx.addIssue({ code: "custom", path: ["brands"], message: "Genau eine Marke muss isCupra sein" });
    }
    cfg.features.forEach((f, i) => {
      f.motiveIds.forEach((m) => {
        if (!motiveIds.has(m)) ctx.addIssue({ code: "custom", path: ["features", i, "motiveIds"], message: `Unbekanntes Motiv ${m}` });
      });
    });
    cfg.rounds.forEach((r, i) => {
      if (!brandIds.has(r.competitorBrandId)) {
        ctx.addIssue({ code: "custom", path: ["rounds", i, "competitorBrandId"], message: `Unbekannte Marke ${r.competitorBrandId}` });
      }
      const seen = new Set<string>();
      r.persona.motives.forEach((pm, j) => {
        if (!motiveIds.has(pm.motiveId)) ctx.addIssue({ code: "custom", path: ["rounds", i, "persona", "motives", j], message: `Unbekanntes Motiv ${pm.motiveId}` });
        if (seen.has(pm.motiveId)) ctx.addIssue({ code: "custom", path: ["rounds", i, "persona", "motives", j], message: `Motiv ${pm.motiveId} doppelt` });
        seen.add(pm.motiveId);
      });
    });
  });

export function parseWorkshopConfig(input: unknown): WorkshopConfig {
  return workshopConfigSchema.parse(input) as WorkshopConfig;
}
