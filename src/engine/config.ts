/** Zentrale Konstanten. Quelle: Umsetzungsplan Abschnitt 11. */
export const WS_CONFIG = {
  /* Interview, Matcher A */
  /** Fallback, wenn die Konfiguration keine Fragenzahl setzt */
  INTERVIEW_QUESTIONS_DEFAULT: 3,
  QUESTION_MIN_CHARS: 6,
  QUESTION_MAX_CHARS: 300,
  /** Pro aufgedecktem Motiv, maximal eins pro Frage */
  POINTS_MOTIVE_DISCOVERED: 1,

  /* Features, Matcher B */
  FEATURES_PER_ROUND: 3,
  FEATURE_MIN_CHARS: 4,
  FEATURE_MAX_CHARS: 200,
  /** Feature ist ein gelistetes CUPRA-Feature */
  POINTS_FEATURE_RECOGNIZED: 1,
  /** Paar Feature/Motiv steht im Modell */
  POINTS_FEATURE_PAIR: 1,

  /* Plattform */
  STATE_POLL_MS: 2_000,
  PROGRESS_POLL_MS: 3_000,
  PHASE_GRACE_MS: 10_000,
  SCORER_TIMEOUT_MS: 12_000,
  DISPLAY_NAME_MAX: 20,
  LEADERBOARD_TOP_N: 10,
  SESSION_CODE_LENGTH: 6,
} as const;

export const MAX_POINTS_PER_FEATURE = WS_CONFIG.POINTS_FEATURE_RECOGNIZED + WS_CONFIG.POINTS_FEATURE_PAIR;
