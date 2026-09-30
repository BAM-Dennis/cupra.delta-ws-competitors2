/** Typen für Konfiguration, Session und Teilnehmer-Daten. Framework-frei. */

/* ---------- Konfiguration ---------- */

export interface Brand {
  id: string;
  name: string;
  /** Kurzform für Kacheln, z. B. "MINI" */
  short?: string;
  isCupra?: boolean;
  /** Steht das Fahrzeug im Raum? */
  present: boolean;
}

export interface Category {
  id: string;
  title: string;
  prompts: string[];
}

/** Globales Motiv, über alle Personas gleich benannt (für die Zusammenfassung nach Motiv). */
export interface Motive {
  id: string;
  label: string;
  description: string;
}

/** Ausprägung eines Motivs bei einer Persona: Themenfelder und In-Character-Aufdeck-Satz. */
export interface PersonaMotive {
  motiveId: string;
  /** Zwei bis drei Beispiel-Themen, die das Motiv öffnen */
  topics: string[];
  /** Antwort der Persona, wenn das Motiv aufgedeckt wird */
  revealLine: string;
  /** Nur für den keywordScorer */
  keywords?: string[];
}

export interface Persona {
  name: string;
  tagline?: string;
  /** Kurze Selbstvorstellung, in der ersten Person */
  intro: string;
  /** Hintergrund für die KI-Rolle, nicht für die Teilnehmer sichtbar */
  background?: string;
  motives: PersonaMotive[];
  /** In-Character-Antwort auf geschlossene oder themenferne Fragen */
  nudgeLines: string[];
}

export interface Round {
  id: string;
  competitorBrandId: string;
  persona: Persona;
  categories: Category[];
}

/** CUPRA-Feature, das auf mehrere Motive einzahlt (many-to-many). */
export interface FeatureDef {
  id: string;
  text: string;
  motiveIds: string[];
  keywords?: string[];
}

export interface WorkshopConfig {
  id: string;
  /** Bleibt für eine spätere Zusammenführung mit Competitor I erhalten */
  type: "competitor-2";
  market: string;
  workshopRef: string;
  language: string;
  title: string;
  brands: Brand[];
  /** Anzahl offener Fragen im Interview (Feinkonzept: zwei oder drei) */
  interviewQuestions: number;
  motives: Motive[];
  features: FeatureDef[];
  rounds: Round[];
}

/* ---------- Session ---------- */

/**
 * Phasen. Trainer-Leinwand: lobby → Runde(n) → summary → leaderboard → ended.
 * Teilnehmer (self-paced): lobby → Runde → feedback → leaderboard.
 */
export type Phase = "lobby" | "persona" | "interview" | "motives" | "explore" | "features" | "feedback" | "summary" | "leaderboard" | "ended";

export interface SessionState {
  phase: Phase;
  /** Aktive Runde bei Runden-Phasen, sonst letzte Runde */
  round: number;
  /** Zähler, steigt bei jedem Trainer-Klick */
  version: number;
}

export type SessionEvent = { type: "NEXT" } | { type: "BACK" } | { type: "RESET" };

/* ---------- Scoring ---------- */

export interface InterviewTurn {
  round: number;
  idx: number;
  question: string;
  /** In-Character-Antwort der Persona */
  reply: string;
  /** War die Frage offen genug, um etwas aufzudecken? */
  isOpen: boolean;
  /** Maximal ein Motiv pro Frage */
  discoveredMotiveId: string | null;
  points: number;
  scorer: "llm" | "keyword";
}

export interface FeatureEvaluation {
  /** Erkanntes Feature aus dem Modell, sonst null */
  featureId: string | null;
  /** Vom Teilnehmer gewähltes Motiv */
  motiveId: string;
  /** Steht das Paar Feature/Motiv im Modell? */
  pairValid: boolean;
}

export interface ScoredFeature {
  round: number;
  idx: number;
  text: string;
  evaluation: FeatureEvaluation;
  feedback: string;
  points: number;
  scorer: "llm" | "keyword";
}

export interface RoundSummary {
  round: number;
  points: number;
  maxPoints: number;
  text: string;
}

/** Zusammenfassung für die Leinwand: genannte Features je Motiv. */
export interface MotiveCluster {
  motiveId: string;
  /** Feature-Nennungen, häufigste zuerst */
  items: Array<{ featureId: string | null; text: string; count: number }>;
  total: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
}
