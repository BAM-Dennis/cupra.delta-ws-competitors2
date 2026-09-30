import { isRoundPhase } from "@/engine/session";
import type { Brand, Phase, WorkshopConfig } from "@/engine/types";
import { Chip } from "../shared/bits";
import { Overline } from "../shared/ui";

interface Props {
  config: WorkshopConfig;
  phase: Phase;
  /** Wettbewerber der gespielten Erkundung */
  competitor?: Brand;
  score: number;
  displayName?: string;
}

const PHASE_TEXT: Record<Phase, string> = {
  lobby: "Lobby",
  persona: "Your customer",
  interview: "Interview",
  motives: "Motives",
  explore: "Explore",
  features: "Your features",
  feedback: "Your feedback",
  summary: "Summary",
  leaderboard: "Results",
  ended: "Results",
};

/** Kopfzeile der Teilnehmer-App: Workshop, Phase, Wettbewerber, eigener Punktestand. */
export function AppHeader({ config, phase, competitor, score, displayName }: Props) {
  return (
    <header className="flex items-start justify-between gap-3 pt-[max(16px,env(safe-area-inset-top))]">
      <div className="flex min-w-0 flex-col gap-1.5">
        <Overline className="truncate text-white/50">{config.title}</Overline>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[18px] font-medium leading-none">{PHASE_TEXT[phase]}</span>
          {isRoundPhase(phase) && competitor && <Chip tone="teal">vs {competitor.short ?? competitor.name}</Chip>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <div className="flex items-baseline gap-1">
          <span className="text-[30px] leading-none tracking-[1px] tabular-nums">{score}</span>
          <span className="text-[10px] uppercase tracking-[1px] text-white/60">pts</span>
        </div>
        {displayName && <span className="max-w-[140px] truncate text-[11px] leading-[1.3] text-white/50">{displayName}</span>}
      </div>
    </header>
  );
}
