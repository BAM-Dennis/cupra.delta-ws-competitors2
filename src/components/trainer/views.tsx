"use client";
/* eslint-disable @next/next/no-img-element */

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { WS_CONFIG } from "@/engine/config";
import type { LeaderboardEntry, MotiveCluster, WorkshopConfig } from "@/engine/types";
import type { DemoProgress } from "@/lib/demoData";
import { displayCode } from "@/lib/participant";
import { useClientValue } from "@/lib/useClientValue";
import { Bar, BigStat, Chip, Glyph } from "../shared/bits";
import { LeaderboardList } from "../shared/LeaderboardList";
import { PersonaAvatar } from "../shared/PersonaAvatar";

const H = "text-[44px] font-light leading-none";
const SUB = "text-[18px] leading-[1.4] text-white/70";

/* ---------------- Lobby: QR ---------------- */

export function LobbyView({ code, participants }: { code: string; participants: number }) {
  const [qr, setQr] = useState<string | null>(null);
  const origin = useClientValue(() => window.location.origin, "");
  const url = origin ? `${origin}/s/${code}` : "";
  useEffect(() => {
    if (!url) return;
    let alive = true;
    QRCode.toDataURL(url, { margin: 1, width: 640, color: { dark: "#ffffff", light: "#00000000" } })
      .then((d) => alive && setQr(d))
      .catch(() => alive && setQr(null));
    return () => {
      alive = false;
    };
  }, [url]);
  return (
    <div className="grid flex-1 grid-cols-2 items-center gap-16">
      <div className="flex flex-col gap-6">
        <span className="text-[13px] font-medium uppercase tracking-[3px] text-teal">Welcome</span>
        <h1 className="text-[64px] font-light leading-[1.02]">
          Scan to join
          <br />
          <span className="font-medium">the workshop.</span>
        </h1>
        <p className={SUB}>Open your camera, scan the code, keep the page open. No app, no install. Your points count across the whole series.</p>
        <div className="flex items-center gap-4 pt-4">
          <BigStat value={participants} label="joined" />
          <span className="h-12 w-px bg-white/15" />
          <div className="flex flex-col">
            <span className="text-[12px] uppercase tracking-[1px] text-white/50">or type</span>
            <span className="text-[22px] font-medium tracking-[4px]">{displayCode(code)}</span>
            <span className="text-[13px] text-white/40">{url.replace(/^https?:\/\//, "")}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <div className="rounded-[24px] border border-white/15 bg-white/5 p-8 shadow-glow-strong">
          {qr ? <img alt={`QR code for ${url}`} src={qr} className="size-[380px]" /> : <div className="size-[380px] animate-pulse rounded bg-white/10" />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Persona-Vorstellung: Motive bleiben verdeckt ---------------- */

export function PersonaIntroView({ config, round }: { config: WorkshopConfig; round: number }) {
  const r = config.rounds[round];
  const competitor = config.brands.find((b) => b.id === r.competitorBrandId);
  const cupra = config.brands.find((b) => b.isCupra);
  return (
    <div className="grid flex-1 grid-cols-[1.1fr_1fr] gap-16">
      <div className="flex flex-col gap-6">
        <ExplorationTag config={config} round={round} />
        <div className="flex items-center gap-6">
          <PersonaAvatar persona={r.persona} className="size-28 text-[40px]" />
          <div>
            <h1 className={H}>{r.persona.name}</h1>
            {r.persona.tagline && <p className="mt-2 text-[20px] text-white/60">{r.persona.tagline}</p>}
          </div>
        </div>
        <p className="text-[22px] leading-[1.45] text-white/85">“{r.persona.intro}”</p>
        <div className="mt-auto flex items-center gap-4 text-[22px]">
          <span className="font-medium">{cupra?.name}</span>
          <span className="text-white/40">vs</span>
          <span className="font-medium">{competitor?.name}</span>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-6">
        <span className="text-[13px] font-medium uppercase tracking-[3px] text-teal">The interview</span>
        <p className="text-[26px] leading-[1.35]">
          {r.persona.name} has <span className="font-medium">{r.persona.motives.length} emotional motives</span>. You have <span className="font-medium">{config.interviewQuestions} open questions</span> to uncover them.
        </p>
        <div className="flex gap-3">
          {r.persona.motives.map((m) => (
            <span key={m.motiveId} className="flex h-20 flex-1 items-center justify-center rounded-[10px] border border-dashed border-white/25 text-[13px] uppercase tracking-[2px] text-white/40">
              hidden
            </span>
          ))}
        </div>
        <p className={SUB}>Open questions open people. Why, how, what. A yes-or-no question earns a polite nudge and nothing else.</p>
      </div>
    </div>
  );
}

/* ---------------- Interview-Fortschritt ---------------- */

export function InterviewProgressView({ config, round, progress }: { config: WorkshopConfig; round: number; progress: DemoProgress }) {
  const r = config.rounds[round];
  return (
    <div className="grid flex-1 grid-cols-[1fr_1.2fr] gap-16">
      <div className="flex flex-col gap-6">
        <ExplorationTag config={config} round={round} />
        <h1 className={H}>
          Interview
          <br />
          with <span className="font-medium">{r.persona.name}</span>.
        </h1>
        <p className={SUB}>Ask open questions on your phone. {r.persona.name} answers in character and lets slip what really matters when you hit the right topic.</p>
        <div className="mt-auto flex flex-col gap-3 rounded-[10px] border border-teal/30 bg-teal/10 p-6">
          <span className="text-[13px] font-medium uppercase tracking-[2px] text-teal">Scoring</span>
          <p className="text-[18px] leading-[1.4]">One point per uncovered motive. At most one motive per question. Closed questions uncover nothing.</p>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-8">
        {Array.from({ length: config.interviewQuestions }, (_, i) => {
          const n = progress.questionsAsked[i] ?? 0;
          return (
            <div key={i} className="flex flex-col gap-3">
              <div className="flex items-end justify-between">
                <span className="text-[22px]">Question {i + 1}</span>
                <span className="text-[28px] tabular-nums">
                  {n} <span className="text-[16px] text-white/50">/ {progress.participants}</span>
                </span>
              </div>
              <Bar value={n / progress.participants} className="!h-3" tone={i === config.interviewQuestions - 1 ? "teal" : "copper"} />
            </div>
          );
        })}
        <div className="flex items-center justify-between rounded-[8px] bg-white/5 px-6 py-4 text-[20px]">
          <span className="text-white/70">Motives uncovered on average</span>
          <span className="tabular-nums">
            {progress.avgMotivesDiscovered} <span className="text-[16px] text-white/50">/ {r.persona.motives.length}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Motiv-Reveal ---------------- */

export function MotivesView({ config, round }: { config: WorkshopConfig; round: number }) {
  const r = config.rounds[round];
  return (
    <div className="flex flex-1 flex-col gap-8 animate-reveal">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-4">
          <ExplorationTag config={config} round={round} />
          <h1 className={H}>
            What really drives <span className="font-medium">{r.persona.name}</span>.
          </h1>
        </div>
        <p className="max-w-[480px] text-right text-[18px] text-white/60">Check your phone: which of these did you uncover?</p>
      </div>
      <div className="grid flex-1 gap-4" style={{ gridTemplateColumns: `repeat(${r.persona.motives.length}, minmax(0, 1fr))` }}>
        {r.persona.motives.map((pm, i) => {
          const m = config.motives.find((x) => x.id === pm.motiveId);
          return (
            <div key={pm.motiveId} className="flex flex-col gap-4 rounded-[10px] border border-copper/50 bg-copper/10 p-6" style={{ animationDelay: `${i * 0.12}s` }}>
              <span className="text-[13px] font-medium uppercase tracking-[2px] text-copper-light">Motive {i + 1}</span>
              <h2 className="text-[26px] font-medium leading-tight">{m?.label}</h2>
              <p className="text-[16px] leading-[1.4] text-white/75">{m?.description}</p>
              <p className="mt-auto text-[17px] italic leading-[1.4]">“{pm.revealLine}”</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Exploration ---------------- */

export function ExploreView({ config, round }: { config: WorkshopConfig; round: number }) {
  const r = config.rounds[round];
  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-4">
          <ExplorationTag config={config} round={round} />
          <h1 className={H}>To the cars.</h1>
        </div>
        <p className="max-w-[480px] text-right text-[18px] text-white/60">Explore along the categories on your phone. Nothing to type yet.</p>
      </div>
      <div className="grid flex-1 grid-cols-4 gap-4">
        {r.categories.map((c, i) => (
          <div key={c.id} className="glass flex flex-col gap-4 rounded-[10px] p-6">
            <span className="flex size-10 items-center justify-center rounded-[6px] bg-white/10 text-[16px] font-medium">{i + 1}</span>
            <h2 className="text-[24px] font-medium leading-tight">{c.title}</h2>
            <ul className="flex flex-col gap-3">
              {c.prompts.map((p, j) => (
                <li key={j} className="flex gap-3 text-[15px] leading-[1.4] text-white/75">
                  <span className="mt-[8px] size-1.5 shrink-0 rounded-full bg-copper-light" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Feature-Fortschritt ---------------- */

export function FeaturesProgressView({ config, round, progress }: { config: WorkshopConfig; round: number; progress: DemoProgress }) {
  const r = config.rounds[round];
  const competitor = config.brands.find((b) => b.id === r.competitorBrandId);
  const motives = r.persona.motives.map((pm) => config.motives.find((m) => m.id === pm.motiveId)?.label ?? pm.motiveId);
  return (
    <div className="grid flex-1 grid-cols-[1fr_1.2fr] gap-16">
      <div className="flex flex-col gap-6">
        <ExplorationTag config={config} round={round} />
        <h1 className={H}>
          Top {WS_CONFIG.FEATURES_PER_ROUND} features
          <br />
          for <span className="font-medium">{r.persona.name}</span>.
        </h1>
        <p className={SUB}>Which CUPRA features beat the {competitor?.name} on {r.persona.name}&apos;s motives? Name the feature, pick the motive.</p>
        <div className="flex flex-wrap gap-2">
          {motives.map((m) => (
            <Chip key={m} tone="copper" className="!text-[13px] !px-4 !py-1.5">
              {m}
            </Chip>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-3 rounded-[10px] border border-teal/30 bg-teal/10 p-6">
          <span className="text-[13px] font-medium uppercase tracking-[2px] text-teal">A valid pair</span>
          <p className="text-[18px] leading-[1.4]">A real CUPRA feature, matched to a motive it genuinely serves. The same feature can serve more than one motive.</p>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-8">
        {Array.from({ length: WS_CONFIG.FEATURES_PER_ROUND }, (_, i) => {
          const n = progress.featuresSubmitted[i] ?? 0;
          return (
            <div key={i} className="flex flex-col gap-3">
              <div className="flex items-end justify-between">
                <span className="text-[22px]">Feature {i + 1}</span>
                <span className="text-[28px] tabular-nums">
                  {n} <span className="text-[16px] text-white/50">/ {progress.participants}</span>
                </span>
              </div>
              <Bar value={n / progress.participants} className="!h-3" tone={i === WS_CONFIG.FEATURES_PER_ROUND - 1 ? "teal" : "copper"} />
            </div>
          );
        })}
        <div className="flex items-center justify-between rounded-[8px] bg-white/5 px-6 py-4 text-[20px]">
          <span className="text-white/70">Finished the round</span>
          <span className="tabular-nums">
            {progress.roundFinished} <span className="text-[16px] text-white/50">/ {progress.participants}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Zusammenfassung nach Motiv (US-5) ---------------- */

/**
 * Leinwand-Zusammenfassung nach Magnus' Figma-Redesign: sechs gleich breite Karten in einer
 * Reihe ab 1280 px, drei Spalten auf mittleren, zwei auf kleinen Bildschirmen. Schrift skaliert
 * per clamp, nichts bricht aus den Karten aus, kein horizontales Scrollen.
 */
export function SummaryView({ config, clusters }: { config: WorkshopConfig; clusters: MotiveCluster[] }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 animate-reveal xl:gap-8">
      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-3">
        <div className="flex flex-col gap-3">
          <span className="text-[13px] font-medium uppercase tracking-[3px] text-teal">Summary</span>
          <h1 className="text-[clamp(28px,2.7vw,44px)] font-light leading-[1.05]">
            What the room found,
            <br />
            <span className="font-medium">motive by motive.</span>
          </h1>
        </div>
        <p className="max-w-[440px] text-right text-[clamp(13px,1.05vw,17px)] leading-[1.4] text-white/60">
          All features named by everyone in the room, clustered by the motive they were matched to.
        </p>
      </div>
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 xl:gap-4">
        {clusters.map((c) => (
          <MotiveCard key={c.motiveId} label={config.motives.find((x) => x.id === c.motiveId)?.label ?? c.motiveId} cluster={c} />
        ))}
      </div>
    </div>
  );
}

function MotiveCard({ label, cluster }: { label: string; cluster: MotiveCluster }) {
  const items = cluster.items.slice(0, 6);
  // Balkenbreite relativ zur häufigsten Nennung in dieser Karte
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <section className="glass flex min-w-0 flex-col rounded-[10px] p-4 xl:p-5">
      <h2 className="min-h-[2.6em] text-balance text-[clamp(14px,1.15vw,20px)] font-medium leading-[1.3] [overflow-wrap:anywhere]">{label}</h2>
      <ul className="mt-5 flex flex-col gap-3.5">
        {items.map((it) => (
          <li key={it.featureId ?? it.text} className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <span className={`min-w-0 flex-1 text-[clamp(11px,0.85vw,14px)] leading-[1.3] [overflow-wrap:anywhere] ${it.featureId ? "text-white/85" : "italic text-white/55"}`}>{it.text}</span>
              <span className="shrink-0 text-[clamp(11px,0.85vw,14px)] leading-[1.3] tabular-nums text-white/70">{it.count}</span>
            </div>
            <Bar value={it.count / max} className="!h-[3px]" tone={it.featureId ? "copper" : "teal"} />
          </li>
        ))}
        {items.length === 0 && <li className="text-[clamp(11px,0.85vw,14px)] text-white/40">Nothing named for this motive.</li>}
      </ul>
      <div className="mt-auto flex items-baseline gap-2 pt-6">
        <span className="text-[clamp(22px,1.9vw,32px)] leading-none tabular-nums text-copper-light">{cluster.total}</span>
        <span className="text-[10px] font-medium uppercase leading-none tracking-[1.5px] text-white/50">motives named</span>
      </div>
    </section>
  );
}

/* ---------------- Leaderboard ---------------- */

export function LeaderboardView({ leaderboard, ended }: { leaderboard: { top: LeaderboardEntry[]; all: LeaderboardEntry[] }; ended: boolean }) {
  const [first, ...rest] = leaderboard.top;
  return (
    <div className="grid flex-1 grid-cols-[1fr_1.2fr] gap-16">
      <div className="flex flex-col gap-6">
        <span className="text-[13px] font-medium uppercase tracking-[3px] text-teal">{ended ? "Thank you" : "Results"}</span>
        <h1 className={H}>
          {ended ? "Workshop" : "Today's"}
          <br />
          <span className="font-medium">{ended ? "complete." : "leaderboard."}</span>
        </h1>
        {first && (
          <div className="mt-4 flex flex-col gap-3 rounded-[12px] border border-teal/40 bg-teal-tint p-8 shadow-glow-strong">
            <span className="text-[13px] font-medium uppercase tracking-[2px] text-teal">Top of the room</span>
            <div className="flex items-end justify-between">
              <span className="text-[40px] font-medium leading-none">{first.displayName}</span>
              <span className="text-[56px] leading-none tabular-nums">
                {first.score} <span className="text-[18px] text-white/60">pts</span>
              </span>
            </div>
          </div>
        )}
        <p className={`${SUB} mt-auto`}>Points are saved to each participant ID and add up over the training series.</p>
      </div>
      <div className="flex min-h-0 flex-col justify-center">
        <div className="min-h-0 overflow-y-auto pr-1">
          <LeaderboardList top={rest.length ? [first, ...rest] : leaderboard.top} me={null} big />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Hilfen ---------------- */

/** Statt „Round 1 of 2“: die gespielte Persona. Der Wettbewerber steht dort, wo er Inhalt ist (Erkundung, Features). */
function ExplorationTag({ config, round }: { config: WorkshopConfig; round: number }) {
  const r = config.rounds[round];
  return (
    <div className="flex items-center gap-2">
      <Chip tone="teal" className="!text-[13px] !px-4 !py-1.5">
        {r.persona.name}
      </Chip>
      <Glyph name="spark" className="size-4 text-copper-light" />
    </div>
  );
}
