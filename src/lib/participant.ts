import type { InterviewTurn, Phase, RoundSummary, ScoredFeature } from "@/engine/types";

/** Teilnehmer-Zustand pro Session. Phase 0 im localStorage, ab Phase 1 auf dem Server. */
export interface Participant {
  userId: string;
  displayName: string;
  joinedAt: string;
  /** Eigene Position im self-paced Ablauf (PARTICIPANT_PHASES), unabhängig von der Leinwand */
  phase: Phase;
  interviews: InterviewTurn[];
  features: ScoredFeature[];
  roundFinished: boolean[];
  roundSummaries: RoundSummary[];
}

export function emptyParticipant(userId: string, displayName: string, rounds: number): Participant {
  return {
    userId,
    displayName,
    joinedAt: new Date().toISOString(),
    phase: "lobby",
    interviews: [],
    features: [],
    roundFinished: Array.from({ length: rounds }, () => false),
    roundSummaries: [],
  };
}

export function participantScore(p: Participant | null): number {
  if (!p) return 0;
  return p.interviews.reduce((s, t) => s + t.points, 0) + p.features.reduce((s, f) => s + f.points, 0);
}

export function discoveredMotives(p: Participant, round: number): string[] {
  return p.interviews.filter((t) => t.round === round && t.discoveredMotiveId).map((t) => t.discoveredMotiveId as string);
}

export function roundScore(p: Participant, round: number): number {
  return interviewScore(p, round) + featureScore(p, round);
}

export function interviewScore(p: Participant, round: number): number {
  return p.interviews.filter((t) => t.round === round).reduce((s, t) => s + t.points, 0);
}

export function featureScore(p: Participant, round: number): number {
  return p.features.filter((f) => f.round === round).reduce((s, f) => s + f.points, 0);
}

/** Session-Codes: intern klein (URL, Speicher-Schlüssel), angezeigt groß. */
export function normalizeCode(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}
export function displayCode(code: string): string {
  return code.toUpperCase();
}

export function sessionKey(code: string) {
  return `cw2.session.${code}`;
}
export function meKey(code: string) {
  return `cw2.me.${code}`;
}
