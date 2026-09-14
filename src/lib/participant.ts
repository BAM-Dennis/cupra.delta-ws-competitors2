import type { InterviewTurn, RoundSummary, ScoredFeature } from "@/engine/types";

/** Teilnehmer-Zustand pro Session. Phase 0 im localStorage, ab Phase 1 auf dem Server. */
export interface Participant {
  userId: string;
  displayName: string;
  joinedAt: string;
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
  return (
    p.interviews.filter((t) => t.round === round).reduce((s, t) => s + t.points, 0) +
    p.features.filter((f) => f.round === round).reduce((s, f) => s + f.points, 0)
  );
}

export function sessionKey(code: string) {
  return `cw2.session.${code}`;
}
export function meKey(code: string) {
  return `cw2.me.${code}`;
}
