# CUPRA Competitor II Workshop App

Workshop-App für das CUPRA Global Launch Training, Workshop „Competitor II“ (emotional, Marke und Kaufmotive). Teilnehmer interviewen per Smartphone eine Persona mit offenen Fragen, decken ihre Kaufmotive auf, erkunden CUPRA und Wettbewerber entlang dieser Motive und nennen die CUPRA-Features, die darauf einzahlen. Der Trainer steuert die Session und zeigt auf der Leinwand am Ende, welche Features die Gruppe welchem Motiv zugeordnet hat.

Konzept: [SAPERED_Workshop-App_Konzept_Aufwandsschaetzung_CompII.md](SAPERED_Workshop-App_Konzept_Aufwandsschaetzung_CompII.md) · Seed-Content: [SAPERED_Workshop-App_SeedContent_CompII.md](SAPERED_Workshop-App_SeedContent_CompII.md) · Plan: [umsetzungsplan.md](umsetzungsplan.md)

**Verhältnis zu Competitor I:** eigenes Repo, gleiche Plattform. Der Code ist eine Kopie der Comp-I-Struktur (`../cupra.delta-ws-competitor`), reduziert auf einen Workshop-Typ. Der ursprüngliche Comp-II-Code stammt aus Commit `3e13cab` im Comp-I-Repo.

## Stand: Phase 0, Klick-Prototyp

Alle Screens des Teilnehmer-Flows und die Trainer-Leinwand mit Demo-Inhalt, im Look der CUPRA Streak Challenge. **Ohne Datenbank, ohne KI, ohne Geräte-Synchronisation.** Session und Teilnehmer liegen im `localStorage` des Browsers.

- **Self-paced:** Teilnehmer gehen mit „Weiter“-Buttons selbst durch alle Screens, der Trainer schiebt niemanden. Die Leinwand (`/t/demo`) läuft unabhängig davon mit eigener Steuerleiste; `?dev=1` blendet auf dem Teilnehmer-Gerät eine Leiste zum Durchspringen ein.
- **Eine Erkundung:** gespielt wird das erste konfigurierte Paar (Nico gegen MINI), die zweite Runde bleibt in der Konfiguration (`WS_CONFIG.EXPLORATIONS`).
- **Feedback-Screen** nach der Feature-Eingabe: aufgedeckte Motive, jedes Feature mit Bewertung (CUPRA-Feature, gültiges Paar) und Coaching-Satz, Rundenfazit und Punkte. Danach Ergebnis mit Leaderboard.
- Beide Matcher laufen regelbasiert über den `keywordScorer`: die Persona antwortet mit festen Aufdeck- und Stups-Sätzen aus der Konfiguration, eine Fragewort-Heuristik entscheidet über offen/geschlossen, Features werden über Stichwörter erkannt. Mit simulierter Antwortzeit.
- Mitspieler im Leaderboard, Fortschrittszahlen und die Gruppen-Nennungen in der Zusammenfassung sind Demo-Daten.

Phase 1 ersetzt den localStorage durch Postgres plus Polling, Phase 2 den Keyword-Scorer durch Claude in der Persona-Rolle. Die Screens bleiben.

## Stack

Next.js (App Router, TypeScript), Tailwind 4, Vitest. Ab Phase 1: Postgres über `pg`. Ab Phase 2: Anthropic SDK.

## Lokal starten

```bash
npm install
npm run dev          # http://localhost:3000
```

| Route | Zweck |
|---|---|
| `/` | Einstieg: Session-Code eingeben, Demo-Links |
| `/s/demo` | Teilnehmer-App (Session „demo“), self-paced |
| `/s/demo?dev=1` | Teilnehmer-App mit Dev-Leiste zum Durchspringen der Phasen |
| `/t/demo` | Trainer-Leinwand mit Steuerleiste und QR-Code |

Demo zurücksetzen: „Reset“ in der Trainer-Steuerleiste oder das Reset-Symbol in der Dev-Leiste.

## Ablauf

Teilnehmer: Lobby → Persona-Vorstellung, Interview, Motiv-Reveal, Erkundung, Feature-Eingabe → Feedback → Ergebnis mit Leaderboard. Leinwand: Lobby → dieselbe Runde → Zusammenfassung nach Motiv → Leaderboard. Eine Erkundung (eine Persona, ein Wettbewerber).

## Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` | Dev-Server |
| `npm test` | Unit-Tests für Engine und Scorer (Vitest) |
| `npm run lint` | ESLint |
| `npm run build` | Produktions-Build |

## Struktur

- `src/engine/` – reine Funktionen: Konstanten (`config.ts`), Typen, zod-Schema der Konfiguration, Punkteregeln und Motiv-Clustering (`scoring.ts`), Session-Zustandsmaschine (`session.ts`).
- `src/scoring/` – `Scorer`-Interface (`answerInterview`, `scoreFeature`, `summarizeRound`) und `keywordScorer`. Der `llmScorer` (Phase 2) implementiert dasselbe Interface.
- `src/data/config/demo.json` – Konfiguration nach dem SAPERED-Seed-Content vom 14.09.2026: Marken, sechs Motive (drei je Persona: Nico gegen MINI, Sara gegen smart), acht Features mit Motiv-Zuordnung (many-to-many), Persona-Profile, Zitate, Probe-Themen, Aufdeck-Sätze, Stups-Texte und Erkundungs-Kategorien. **Platzhalter von SAPERED**, final bestätigt CUPRA. Die `keywords` an Motiven und Features sind Ergänzungen für den Keyword-Scorer.
- `src/components/participant/` – Teilnehmer-Screens, `ParticipantApp.tsx` schaltet nach der eigenen Phase des Teilnehmers (`me.phase`), `ContinueBar` ist der Weiter-Button.
- `src/components/trainer/` – Leinwand: `TrainerApp.tsx` (Kopf, Steuerleiste, Phasen-Stepper) und `views.tsx`.
- `src/components/shared/` – Feedback-Element, Leaderboard, UI-Bausteine, Hintergründe und Icons aus der Streak Challenge.
- `src/lib/` – `useLocalSession` (Phase-0-Ersatz für den Server), `storedValue` (localStorage mit Tab-Sync), `identity` (persistente Teilnehmer-ID), `demoData`.
- `src/app/globals.css` – Cupra-Fonts und Design-Tokens, übernommen aus der Streak Challenge.

## Konfiguration anpassen

`src/data/config/demo.json` editieren. Das zod-Schema prüft beim Start Referenzen: Motive in Features und Personas, keine doppelten Motive je Persona, bekannte Wettbewerber-Marke je Runde, genau eine CUPRA-Marke, `interviewQuestions` zwischen 1 und 6. `keywords` nutzt nur der Keyword-Scorer. Neue Konfiguration: Datei anlegen und in `src/data/config/index.ts` registrieren; der Session-Code wählt die Konfiguration.

## Punkte

Interview: 1 Punkt pro aufgedecktem Motiv, maximal eins pro Frage, geschlossene Fragen decken nichts auf. Feature: 1 Punkt für ein erkanntes CUPRA-Feature, 1 Punkt zusätzlich, wenn das Paar Feature/Motiv im Modell steht. Drei Features pro Runde, drei Fragen (konfigurierbar). Maximum je Runde bei drei Motiven: 9 Punkte, wie im Seed-Content vorgesehen. Werte in `src/engine/config.ts`.
