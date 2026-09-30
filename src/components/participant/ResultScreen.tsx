"use client";

import { MAX_POINTS_PER_FEATURE, WS_CONFIG } from "@/engine/config";
import type { LeaderboardEntry, WorkshopConfig } from "@/engine/types";
import { featureScore, interviewScore, participantScore, type Participant } from "@/lib/participant";
import { BigStat } from "../shared/bits";
import { LeaderboardList } from "../shared/LeaderboardList";
import { Overline, Panel, SecondaryButton, StatTile } from "../shared/ui";

interface Props {
  config: WorkshopConfig;
  round: number;
  me: Participant;
  leaderboard: { top: LeaderboardEntry[]; me: LeaderboardEntry | null; all: LeaderboardEntry[] };
  /** Prototyp: Teilnehmer verlassen und von vorn beginnen (ein Gerät, kein Trainer nötig) */
  onRestart?: () => void;
}

/** US-6: eigenes Ergebnis (Interview und Features) und Leaderboard. */
export function ResultScreen({ config, round, me, leaderboard, onRestart }: Props) {
  const total = participantScore(me);
  const r = config.rounds[round];
  const tiles = [
    { key: "interview", label: "Interview", value: interviewScore(me, round), max: Math.min(r.persona.motives.length, config.interviewQuestions) },
    { key: "features", label: "Features", value: featureScore(me, round), max: WS_CONFIG.FEATURES_PER_ROUND * MAX_POINTS_PER_FEATURE },
  ];

  return (
    <div className="flex flex-col gap-5 pt-5">
      <Panel className="items-center animate-slide-up">
        <Overline className="text-teal">Your result</Overline>
        <BigStat value={total} label="points" />
        {leaderboard.me && (
          <p className="text-[14px] text-white/70">
            Rank <span className="font-medium text-white">{leaderboard.me.rank}</span> of {leaderboard.all.length} in the room
          </p>
        )}
        <div className="flex w-full gap-2 pt-2">
          {tiles.map((t) => (
            <StatTile key={t.key} label={t.label} footer={`of ${t.max}`}>
              {t.value}
            </StatTile>
          ))}
        </div>
      </Panel>
      <section className="flex flex-col gap-2 animate-fade-up [animation-delay:0.2s]">
        <Overline className="text-white/60">Leaderboard</Overline>
        <LeaderboardList top={leaderboard.top} me={leaderboard.me} highlightId={me.userId} />
      </section>
      <p className="text-center text-[12px] text-white/40">Your points are saved to your participant ID for the whole series.</p>
      {onRestart && (
        <SecondaryButton onClick={onRestart} className="mb-6">
          Start over
        </SecondaryButton>
      )}
    </div>
  );
}
