import { WS_CONFIG } from "@/engine/config";
import { clusterFeaturesByMotive, maxPointsPerRound } from "@/engine/scoring";
import { phaseSequence } from "@/engine/session";
import type { LeaderboardEntry, MotiveCluster, Phase, ScoredFeature, WorkshopConfig } from "@/engine/types";
import { participantScore, type Participant } from "./participant";

/**
 * Demo-Daten für Phase 0: simulierte Mitspieler, damit Leaderboard und
 * Trainer-Fortschritt nicht leer sind. Deterministisch, abhängig von der Phase.
 * Fällt in Phase 1 weg.
 */
const DEMO_PEOPLE: Array<{ name: string; skill: number }> = [
  { name: "Sofia", skill: 0.94 },
  { name: "Mateo", skill: 0.88 },
  { name: "Aya", skill: 0.83 },
  { name: "Jonas", skill: 0.79 },
  { name: "Priya", skill: 0.74 },
  { name: "Luca", skill: 0.7 },
  { name: "Emma", skill: 0.66 },
  { name: "Noah", skill: 0.61 },
  { name: "Chloé", skill: 0.57 },
  { name: "Diego", skill: 0.52 },
  { name: "Mia", skill: 0.48 },
  { name: "Tom", skill: 0.44 },
  { name: "Hana", skill: 0.4 },
  { name: "Felix", skill: 0.36 },
  { name: "Zara", skill: 0.33 },
  { name: "Ben", skill: 0.29 },
  { name: "Ines", skill: 0.25 },
  { name: "Omar", skill: 0.22 },
  { name: "Lea", skill: 0.18 },
  { name: "Sam", skill: 0.15 },
  { name: "Nina", skill: 0.12 },
  { name: "Kai", skill: 0.09 },
  { name: "Rosa", skill: 0.05 },
];

export const DEMO_PARTICIPANT_COUNT = DEMO_PEOPLE.length;

/** Wie viele Punkte konnten die anderen bis zu dieser Phase maximal gesammelt haben? */
function availablePoints(config: WorkshopConfig, phase: Phase, round: number): number {
  const seq = phaseSequence(config.rounds.length);
  const idx = seq.findIndex((s) => s.phase === phase && s.round === round);
  let pts = 0;
  for (let r = 0; r < config.rounds.length; r++) {
    // Runde zählt, sobald ihre letzte Eingabephase erreicht ist
    const lastIdx = seq.findIndex((s) => s.phase === "features" && s.round === r);
    if (lastIdx >= 0 && idx >= lastIdx) pts += maxPointsPerRound(config, r);
  }
  return pts;
}

export function demoLeaderboard(
  config: WorkshopConfig,
  phase: Phase,
  round: number,
  me: Participant | null,
): { top: LeaderboardEntry[]; me: LeaderboardEntry | null; all: LeaderboardEntry[] } {
  const avail = availablePoints(config, phase, round);
  const rows = DEMO_PEOPLE.map((p, i) => ({
    userId: `demo-${i}`,
    displayName: p.name,
    score: Math.round(p.skill * avail),
    joined: i,
  }));
  if (me) rows.push({ userId: me.userId, displayName: me.displayName || "You", score: participantScore(me), joined: -1 });
  rows.sort((a, b) => b.score - a.score || a.joined - b.joined);
  const all: LeaderboardEntry[] = rows.map((r, i) => ({ rank: i + 1, userId: r.userId, displayName: r.displayName, score: r.score }));
  return { all, top: all.slice(0, WS_CONFIG.LEADERBOARD_TOP_N), me: me ? all.find((e) => e.userId === me.userId) ?? null : null };
}

export interface DemoProgress {
  participants: number;
  /** je Frage-Index: wie viele haben gefragt */
  questionsAsked: number[];
  /** durchschnittlich aufgedeckte Motive */
  avgMotivesDiscovered: number;
  /** je Feature-Index: wie viele haben abgegeben */
  featuresSubmitted: number[];
  roundFinished: number;
}

export function demoProgress(config: WorkshopConfig, phase: Phase, round: number, me: Participant | null): DemoProgress {
  const n = DEMO_PARTICIPANT_COUNT + (me ? 1 : 0);
  const mineFeatures = me?.features.filter((f) => f.round === round).length ?? 0;
  const inSubmit = phase === "features";
  const fBase = inSubmit ? [0.85, 0.6, 0.35] : [1, 1, 1];
  const mineQ = me?.interviews.filter((t) => t.round === round).length ?? 0;
  const inInterview = phase === "interview";
  const qBase = inInterview ? [0.9, 0.55, 0.25, 0.1, 0.05, 0.02] : [1, 1, 1, 1, 1, 1];
  const motives = config.rounds[round]?.persona.motives.length ?? 0;
  return {
    participants: n,
    questionsAsked: Array.from({ length: config.interviewQuestions }, (_, i) => Math.round((qBase[i] ?? 1) * DEMO_PARTICIPANT_COUNT) + (mineQ > i ? 1 : 0)),
    avgMotivesDiscovered: motives ? Math.round(motives * (inInterview ? 0.45 : 0.7) * 10) / 10 : 0,
    featuresSubmitted: Array.from({ length: WS_CONFIG.FEATURES_PER_ROUND }, (_, i) => Math.round((fBase[i] ?? 1) * DEMO_PARTICIPANT_COUNT) + (mineFeatures > i ? 1 : 0)),
    roundFinished: Math.round((inSubmit ? 0.3 : 1) * DEMO_PARTICIPANT_COUNT) + (me?.roundFinished[round] ? 1 : 0),
  };
}

/**
 * Simulierte Feature-Nennungen der Gruppe für die Motiv-Zusammenfassung,
 * plus die echten Nennungen des lokalen Teilnehmers.
 */
export function demoMotiveClusters(config: WorkshopConfig, me: Participant | null): MotiveCluster[] {
  const fake: ScoredFeature[] = [];
  config.features.forEach((f, fi) => {
    f.motiveIds.forEach((m, mi) => {
      const count = 2 + ((fi * 7 + mi * 3) % 9);
      for (let k = 0; k < count; k++) {
        fake.push({
          round: k % 2,
          idx: 0,
          text: f.text,
          evaluation: { featureId: f.id, motiveId: m, pairValid: true },
          feedback: "",
          points: 2,
          scorer: "keyword",
        });
      }
    });
  });
  // Ein paar unerkannte Freitext-Nennungen, damit der Cluster realistisch aussieht
  const [m0, m1] = config.motives;
  if (m0) fake.push({ round: 0, idx: 0, text: "The way the car sits low on the road", evaluation: { featureId: null, motiveId: m0.id, pairValid: false }, feedback: "", points: 0, scorer: "keyword" });
  if (m1) fake.push({ round: 1, idx: 0, text: "Drive mode sound in CUPRA mode", evaluation: { featureId: null, motiveId: m1.id, pairValid: false }, feedback: "", points: 0, scorer: "keyword" });
  return clusterFeaturesByMotive(config, [...fake, ...(me?.features ?? [])]);
}
