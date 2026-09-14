import type { FeatureEvaluation, InterviewTurn, ScoredFeature, WorkshopConfig } from "@/engine/types";

/** Matcher A: offene Frage an die Persona. */
export interface InterviewInput {
  config: WorkshopConfig;
  round: number;
  idx: number;
  question: string;
  /** Bisheriger Gesprächsverlauf, damit die Persona konsistent bleibt */
  history: InterviewTurn[];
  /** Bereits entdeckte Motive werden nicht erneut aufgedeckt */
  discoveredMotiveIds: string[];
}

export interface InterviewOutput {
  reply: string;
  isOpen: boolean;
  discoveredMotiveId: string | null;
}

/** Matcher B: Feature mit gewähltem Motiv. */
export interface FeatureInput {
  config: WorkshopConfig;
  round: number;
  idx: number;
  text: string;
  motiveId: string;
}

export interface FeatureOutput {
  evaluation: FeatureEvaluation;
  feedback: string;
}

export interface SummaryInput {
  config: WorkshopConfig;
  round: number;
  interviews: InterviewTurn[];
  features: ScoredFeature[];
}

/**
 * Austauschbare Bewertungs-Implementierung: keyword (Phase 0) oder llm (Phase 2).
 * Die Punkte rechnet immer `engine/scoring.ts`, der Scorer liefert Klassifikation und Text.
 */
export interface Scorer {
  readonly name: "keyword" | "llm";
  answerInterview(input: InterviewInput): Promise<InterviewOutput>;
  scoreFeature(input: FeatureInput): Promise<FeatureOutput>;
  summarizeRound(input: SummaryInput): Promise<string>;
}
