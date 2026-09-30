"use client";

import { WS_CONFIG } from "@/engine/config";
import { demoLeaderboard, demoProgress } from "@/lib/demoData";
import { participantScore } from "@/lib/participant";
import { useLocalSession } from "@/lib/useLocalSession";
import { Background } from "../shared/Background";
import { AppHeader } from "./AppHeader";
import { ContinueBar } from "./ContinueBar";
import { DevBar } from "./DevBar";
import { FeaturesScreen } from "./FeaturesScreen";
import { FeedbackScreen } from "./FeedbackScreen";
import { InterviewScreen } from "./InterviewScreen";
import { JoinScreen } from "./JoinScreen";
import { MotivesRevealScreen } from "./MotivesRevealScreen";
import { PersonaIntroScreen } from "./PersonaIntroScreen";
import { ResultScreen } from "./ResultScreen";
import { ExploreScreen, LobbyScreen } from "./Screens";

/** Gespielt wird die erste konfigurierte Erkundung (Persona/Wettbewerber-Paar). */
const ROUND = 0;

/**
 * Teilnehmer-App: ein Screen pro Phase, kein Routing im Flow. Self-paced: jeder Screen
 * hat einen Weiter-Button, der Trainer schiebt niemanden. Die Dev-Leiste (?dev=1) bleibt
 * als Abkürzung zum Durchklicken.
 */
export function ParticipantApp({ code }: { code: string }) {
  const s = useLocalSession(code);
  const { config, me } = s;

  if (!s.loaded) return <Background variant="blur" />;

  if (!me) {
    return <JoinScreen config={config} code={code} onJoin={s.join} />;
  }

  const phase = me.phase;
  const round = ROUND;
  const r = config.rounds[round];
  const score = participantScore(me);
  const progress = demoProgress(config, phase, round, me);
  const next = () => s.step({ type: "NEXT" });
  const interviewDone = me.interviews.filter((t) => t.round === round).length >= config.interviewQuestions;

  let body: React.ReactNode = null;
  let bar: React.ReactNode = null;
  switch (phase) {
    case "lobby":
      body = <LobbyScreen me={me} participants={progress.participants} />;
      bar = <ContinueBar label="Start" onClick={next} hint="Go at your own pace. Your phone leads, the screen in the room follows the trainer." />;
      break;
    case "persona":
      body = <PersonaIntroScreen config={config} round={round} />;
      bar = <ContinueBar label="Open interview" onClick={next} />;
      break;
    case "interview":
      body = <InterviewScreen config={config} round={round} me={me} onAsk={(q) => s.askQuestion(round, q)} />;
      if (interviewDone) bar = <ContinueBar label="Reveal motives" onClick={next} />;
      break;
    case "motives":
      body = <MotivesRevealScreen config={config} round={round} me={me} />;
      bar = <ContinueBar label="Go to the cars" onClick={next} hint="Next: find the CUPRA features that serve these motives." />;
      break;
    case "explore":
      body = <ExploreScreen config={config} round={round} />;
      bar = <ContinueBar label={`Name your top ${WS_CONFIG.FEATURES_PER_ROUND}`} onClick={next} hint="Take your time at the cars, then come back here." />;
      break;
    case "features":
      body = (
        <FeaturesScreen
          config={config}
          round={round}
          me={me}
          onSubmit={(text, motiveId) => s.submitFeature(round, text, motiveId)}
          onFinish={() => s.finishRound(round)}
          onNext={next}
        />
      );
      break;
    case "feedback":
      body = <FeedbackScreen config={config} round={round} me={me} />;
      bar = <ContinueBar label="See your result" onClick={next} />;
      break;
    default:
      body = <ResultScreen config={config} round={round} me={me} leaderboard={demoLeaderboard(config, phase, round, me)} onRestart={s.leave} />;
      break;
  }

  return (
    <>
      <Background variant="blur" />
      <div className="relative flex flex-1 flex-col px-5 pb-[max(16px,env(safe-area-inset-bottom))]">
        <AppHeader config={config} phase={phase} competitor={config.brands.find((b) => b.id === r.competitorBrandId)} score={score} displayName={me.displayName} />
        {body}
        {bar}
      </div>
      <DevBar phase={phase} step={s.step} onLeave={s.leave} />
    </>
  );
}
