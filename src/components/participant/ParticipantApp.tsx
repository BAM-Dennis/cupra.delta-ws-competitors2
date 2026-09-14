"use client";

import { demoLeaderboard, demoProgress } from "@/lib/demoData";
import { participantScore } from "@/lib/participant";
import { useLocalSession } from "@/lib/useLocalSession";
import { Background } from "../shared/Background";
import { AppHeader } from "./AppHeader";
import { DevBar } from "./DevBar";
import { FeaturesScreen } from "./FeaturesScreen";
import { InterviewScreen } from "./InterviewScreen";
import { JoinScreen } from "./JoinScreen";
import { MotivesRevealScreen } from "./MotivesRevealScreen";
import { PersonaIntroScreen } from "./PersonaIntroScreen";
import { ResultScreen } from "./ResultScreen";
import { ExploreScreen, LobbyScreen } from "./Screens";
import { SummaryWaitScreen } from "./SummaryWaitScreen";

/** Teilnehmer-App: ein Screen-Wechsel pro Phase, kein Routing im Flow. */
export function ParticipantApp({ code }: { code: string }) {
  const s = useLocalSession(code);
  const { config, state, me } = s;

  if (!s.loaded) return <Background variant="blur" />;

  if (!me) {
    return (
      <>
        <JoinScreen config={config} code={code} onJoin={s.join} />
        <DevBar state={state} dispatch={s.dispatch} />
      </>
    );
  }

  const score = participantScore(me);
  const progress = demoProgress(config, state.phase, state.round, me);
  const round = state.round;

  let body: React.ReactNode = null;
  switch (state.phase) {
    case "lobby":
      body = <LobbyScreen me={me} participants={progress.participants} />;
      break;
    case "persona":
      body = <PersonaIntroScreen config={config} round={round} />;
      break;
    case "interview":
      body = <InterviewScreen key={round} config={config} round={round} me={me} onAsk={(q) => s.askQuestion(round, q)} />;
      break;
    case "motives":
      body = <MotivesRevealScreen config={config} round={round} me={me} />;
      break;
    case "explore":
      body = <ExploreScreen config={config} round={round} />;
      break;
    case "features":
      body = (
        <FeaturesScreen
          key={round}
          config={config}
          round={round}
          me={me}
          onSubmit={(text, motiveId) => s.submitFeature(round, text, motiveId)}
          onFinish={() => s.finishRound(round)}
        />
      );
      break;
    case "summary":
      body = <SummaryWaitScreen config={config} me={me} />;
      break;
    case "leaderboard":
    case "ended":
      body = <ResultScreen config={config} me={me} leaderboard={demoLeaderboard(config, state.phase, round, me)} />;
      break;
  }

  return (
    <>
      <Background variant="blur" />
      <div className="relative flex flex-1 flex-col px-5 pb-[max(16px,env(safe-area-inset-bottom))]">
        <AppHeader config={config} phase={state.phase} round={round} score={score} displayName={me.displayName} />
        {body}
      </div>
      <DevBar state={state} dispatch={s.dispatch} onLeave={s.leave} />
    </>
  );
}
