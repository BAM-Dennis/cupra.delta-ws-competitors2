import { WS_CONFIG } from "./config";
import type { FeatureEvaluation, MotiveCluster, ScoredFeature, WorkshopConfig } from "./types";

/** Punkte für eine Interview-Frage: nur ein aufgedecktes Motiv zählt (US-2). */
export function pointsForInterviewTurn(discoveredMotiveId: string | null): number {
  return discoveredMotiveId ? WS_CONFIG.POINTS_MOTIVE_DISCOVERED : 0;
}

/** Punkte für ein Feature: erkanntes CUPRA-Feature plus gültiges Feature-Motiv-Paar (D3). */
export function pointsForFeature(e: FeatureEvaluation): number {
  let p = 0;
  if (e.featureId) p += WS_CONFIG.POINTS_FEATURE_RECOGNIZED;
  if (e.featureId && e.pairValid) p += WS_CONFIG.POINTS_FEATURE_PAIR;
  return p;
}

/** Maximum einer Runde: alle Motive der Persona (höchstens Fragenzahl) plus alle Features. */
export function maxPointsPerRound(config: WorkshopConfig, round: number): number {
  const motives = config.rounds[round]?.persona.motives.length ?? 0;
  return (
    Math.min(motives, config.interviewQuestions) * WS_CONFIG.POINTS_MOTIVE_DISCOVERED +
    WS_CONFIG.FEATURES_PER_ROUND * (WS_CONFIG.POINTS_FEATURE_RECOGNIZED + WS_CONFIG.POINTS_FEATURE_PAIR)
  );
}

/** Ist das Paar Feature/Motiv im Modell hinterlegt? */
export function isValidPair(config: WorkshopConfig, featureId: string, motiveId: string): boolean {
  return config.features.find((f) => f.id === featureId)?.motiveIds.includes(motiveId) ?? false;
}

/**
 * Zusammenfassung nach Motiv (US-5): alle Feature-Nennungen aller Teilnehmer,
 * gruppiert nach dem zugeordneten Motiv, innerhalb des Motivs nach Häufigkeit.
 * Erkannte Features werden über ihre ID zusammengefasst, unerkannte über den Text.
 */
export function clusterFeaturesByMotive(config: WorkshopConfig, features: ScoredFeature[]): MotiveCluster[] {
  return config.motives.map((m) => {
    const mine = features.filter((f) => f.evaluation.motiveId === m.id);
    const buckets = new Map<string, { featureId: string | null; text: string; count: number }>();
    for (const f of mine) {
      const key = f.evaluation.featureId ?? `text:${f.text.trim().toLowerCase()}`;
      const text = f.evaluation.featureId ? config.features.find((x) => x.id === f.evaluation.featureId)?.text ?? f.text : f.text;
      const b = buckets.get(key);
      if (b) b.count += 1;
      else buckets.set(key, { featureId: f.evaluation.featureId, text, count: 1 });
    }
    const items = [...buckets.values()].sort((a, b) => b.count - a.count);
    return { motiveId: m.id, items, total: mine.length };
  });
}
