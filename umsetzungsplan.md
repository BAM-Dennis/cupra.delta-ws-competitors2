# CUPRA Competitor II Workshop App – Umsetzungsplan

**Stand: 14.09.2026 · Phase 0 lokal umgesetzt und durchgeklickt (siehe README), Deployment offen · Basis: „Developer-Briefing: Workshop-App Competitor II (Konzept-Umfang zur Aufwandsschätzung)“ vom 14.09.2026 (SAPERED, Janine Kappenberg)**
**Ziel dieses Plans: Competitor II als eigenständiges Projekt aufsetzen, dabei so viel wie möglich aus Competitor I übernehmen, und in klaren Stufen vom Klick-Prototyp zur raumfähigen Version kommen. Design/CI kommt vom Grafiker und ist eine eigene Phase.**
**Technische Referenzen:**
- **Plattform:** `../cupra.delta-ws-competitor` (Competitor I, Phase 0, Commit `865bb86` bzw. HEAD `b600b80`). Stack, Design-Tokens, Fonts, UI-Bausteine, Session-Reducer, Scorer-Interface, localStorage-Sync. Dieses Projekt bleibt unverändert.
- **Fertiger Comp-II-Code:** Commit `3e13cab` im Repo `BAM-Dennis/cupra.delta-ws-competitors` (dort wieder revertiert). 32 Dateien, 2 675 Zeilen: Typen, Schema, Zustandsmaschine, Punkteregeln, regelbasierte Matcher, Demo-Konfiguration, alle Teilnehmer-Screens und Leinwand-Ansichten. `git show 3e13cab --stat` zeigt die Liste, `git show 3e13cab:<pfad>` holt einzelne Dateien.
- **Ziel-Repo:** `git@github.com:BAM-Dennis/cupra.delta-ws-competitors2.git`

---

## 1. Leitprinzipien

1. **Eigenes Repo, gleiche Plattform.** Comp II lebt in einem eigenen Repository mit eigenem Deployment. Der Code ist aber eine Kopie der Comp-I-Plattform, nicht ein Neubau: gleiche Struktur, gleiche Dateinamen, gleiche Konventionen. Das hält den Weg zu einem späteren Zusammenlegen offen (Abschnitt 3).
2. **Ein Workshop-Typ pro Repo.** Die im Commit `3e13cab` gebaute Union `type: "competitor-1" | "competitor-2"` wird hier **nicht** übernommen. Dieses Repo kennt nur `competitor-2`. Das spart die Typ-Verzweigungen in Schema, Reducer, App-Shell und Scorer und macht den Code einfacher lesbar. Das Feld `type` bleibt in der Konfiguration, damit eine Zusammenführung später ohne Datenmigration geht.
3. **Regeln als reine Funktionen.** Punkteregeln, Fairness-Regeln des Interviews (maximal ein Motiv pro Frage, entdeckte Motive zählen nicht erneut, Schwellenwert), Paar-Prüfung Feature/Motiv, Clustering nach Motiv und die Zustandsmaschine liegen framework-frei in `src/engine/` und sind per Vitest getestet. Die KI liefert Klassifikation und Text, nie Punkte.
4. **Zwei Matcher, ein Interface.** `Scorer` hat drei Methoden: `answerInterview` (Matcher A), `scoreFeature` (Matcher B), `summarizeRound`. Zwei Implementierungen: `keywordScorer` (regelbasiert, läuft ohne API-Key, Phase 0) und `llmScorer` (Claude, Phase 2). Das ist die im Briefing geforderte getrennte Schätzung „echt versus vereinfacht“, je Matcher.
5. **Eine Konfiguration, zwei Ansichten.** Personas, Motive, Feature-Motiv-Modell und Kategorien stehen in einer JSON-Datei pro Markt. Teilnehmer-App und Leinwand rendern dieselbe Quelle.
6. **Polling statt WebSocket, Server hält die Wahrheit, Konstanten zentral.** Wie in Comp I, unverändert übernommen.
7. **Prototyp zuerst.** Phase 0 ist hier fast fertig, weil der Code im Commit existiert. Der erste Vercel-Link für SAPERED ist eine Sache von Stunden, nicht Tagen.

---

## 2. Screening des Briefings

Comp II teilt mit Comp I: PWA per QR, persistente User-ID, Trainer-Leinwand mit Phasensteuerung, dialogische Freitext-Eingabe mit Feedback, Scoring gegen feste Ground Truth, Leaderboard, Realtime, Konfiguration pro Markt. Neu sind drei Bausteine:

1. **Persona-Interview, Matcher A (Frage → Motiv).** Teilnehmer stellt offene Freitextfragen, die Persona antwortet in der Rolle. Klarer Treffer auf ein noch unentdecktes Motiv deckt genau dieses auf. Geschlossene oder themenferne Fragen bekommen einen In-Character-Stups. Nach der letzten Frage Reveal der nicht entdeckten Motive.
2. **Feature-Motiv-Modell many-to-many, Matcher B (Feature → Motiv).** Teilnehmer nennt bis zu drei CUPRA-Features pro Runde und ordnet jedes einem Motiv zu. Gültig, wenn das Paar im Modell steht. Ein Feature kann unter mehreren Motiven gültig sein.
3. **Motiv-Zusammenfassung für die Leinwand.** Alle Feature-Nennungen aller Teilnehmer, geclustert nach Motiv, über beide Runden, nicht nach Persona getrennt. Nur Leinwand, nicht auf den Teilnehmer-Geräten.

Weggefallen gegenüber Comp I: Positionierungs-Matrix, Need- und Differenzierungsliste, Argument-Scoring.

**Konsequenzen, die aus dem Briefing folgen:**

- **Zeit.** Zwei Interviews sind der Zeittreiber, SAPERED nennt 55 bis 60 Minuten. Der Hebel bei hartem 45-Minuten-Limit ist die Fragenzahl (zwei statt drei), nicht eine Runde. Deshalb ist `interviewQuestions` eine Konfigurationsgröße, kein Code.
- **Zwei echte KI-Klassifikationen.** Matcher A ist anspruchsvoller als alles in Comp I: die Persona muss in der Rolle bleiben, konsistent über den Gesprächsverlauf antworten und darf keine Motive außerhalb der Liste erfinden. Das ist der zentrale Risiko- und Kostenpunkt.
- **Fairness-Regeln sind Code, nicht Prompt.** Das LLM klassifiziert `{ isOpen, discoveredMotiveId, confidence }`, der Code entscheidet mit Schwellenwert und Entdeckt-Liste, ob ein Punkt fällt.
- **Reifegrad Pitch.** Fragenzahl und Darstellung des Reveals werden im Feinkonzept festgelegt. Der Prototyp folgt Empfehlung B7: im Interview nur ein dezentes Signal plus Fortschritt, die explizite Benennung erst im Reveal.
- **Content-Abhängigkeit.** Motive je Persona mit Themen und Aufdeck-Sätzen, Feature-Motiv-Modell und die zwei Personas kommen von CUPRA. Ohne sie sind beide Matcher Platzhalter. Deshalb Eval-Satz und Konfigurations-Template früh.

---

## 3. Entscheidung: eigenes Repo statt zweiter Typ auf einer Plattform

Der Commit `3e13cab` hat Comp II als zweiten Workshop-Typ in das Comp-I-Repo gebaut und wurde revertiert. Comp II bekommt jetzt ein eigenes Repo. Was das bedeutet:

| | Eigenes Repo (dieser Plan) | Ein Repo, zwei Typen (Commit 3e13cab) |
|---|---|---|
| Codeverständnis | Ein Flow pro Repo, keine Typ-Verzweigungen | Union in Schema, Reducer, App-Shell, Scorer, Participant |
| Deployment | Zwei Vercel-Projekte, zwei Datenbanken, getrennt schaltbar | Eins |
| Plattform-Phasen 1 bis 4 (Backend, Polling, Deployment) | Werden **einmal gebaut und einmal portiert**, siehe Abschnitt 4 | Einmal gebaut |
| Übergreifende User-ID | Zwei Origins haben getrennten localStorage. Die ID muss über die Join-URL (`?u=`) oder eine gemeinsame Domain mit Pfad-Präfix transportiert werden | Trivial |
| Workshopübergreifende Aggregation (Punkte je Person über Comp I und II) | Braucht eine gemeinsame Datenbank oder Export | Eine Abfrage |
| Angebot und Schätzung | Comp II ist als eigenes Paket sauber ausweisbar | Zusatzaufwand im Comp-I-Plan |

**Festgelegt:** eigenes Repo. Die zwei Punkte mit Mehraufwand (Portieren der Plattform-Phasen, User-ID über Origins) werden im Plan berücksichtigt. Empfehlung für die Plattform-Phasen: Phase 1 (Postgres, API, Polling) **in einem der beiden Repos bauen und in das andere kopieren**, die Dateien sind bis auf die Tabellen für Argumente/Matrix bzw. Interview/Features identisch. Wenn beide Workshops in Produktion gehen, ist ein Monorepo mit gemeinsamem `packages/platform` die saubere Endform. Das ist eine spätere Option (Abschnitt 14), kein Blocker.

---

## 4. Was woher übernommen wird

Drei Quellen: **P** = Comp-I-Projekt `../cupra.delta-ws-competitor` (Plattform, HEAD), **C** = Commit `3e13cab` (Comp-II-Code), **N** = neu in diesem Repo. Bei **C\*** stammt die Datei aus dem Commit, die Comp-I-Zweige (`Comp1Config`, Argumente, Matrix, Needs, Differenzierer) werden entfernt.

| Bereich | Datei(en) | Quelle | Anpassung |
|---|---|---|---|
| Projektgerüst | `package.json`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `postcss.config.mjs`, `next.config.ts`, `vercel.json`, `.gitignore`, `.env.example`, `AGENTS.md`, `CLAUDE.md` | P | Name `cupra-competitor2-workshop` |
| Design-Tokens, Fonts, Hintergründe | `src/app/globals.css`, `src/app/layout.tsx`, `public/fonts/`, `public/design/` | P | 1:1 |
| Shared UI | `src/components/shared/ui.tsx`, `bits.tsx`, `Background.tsx`, `Icon.tsx`, `LeaderboardList.tsx` | P | 1:1. `Matrix.tsx` **nicht** kopieren |
| Client-Infrastruktur | `src/lib/storage.ts`, `storedValue.ts`, `useClientValue.ts`, `identity.ts` | P | localStorage-Keys auf `cw2.*` |
| Konstanten | `src/engine/config.ts` | C\* | Nur Comp-II- und Plattform-Konstanten (Abschnitt 11) |
| Typen | `src/engine/types.ts` | C\* | `Brand`, `Category`, `Motive`, `PersonaMotive`, `EmotionalPersona`, `Round`, `FeatureDef`, `WorkshopConfig` (ein Typ), `Phase` ohne `argue`/`matrix`/`reveal`, `InterviewTurn`, `FeatureEvaluation`, `ScoredFeature`, `MotiveCluster`, `LeaderboardEntry` |
| Schema | `src/engine/configSchema.ts` | C\* | `comp2Schema` wird `workshopConfigSchema`, Referenzprüfung für Motive in Features und Personas, keine doppelten Motive je Persona, genau eine CUPRA-Marke |
| Zustandsmaschine | `src/engine/session.ts` | C\* | Eine Phasenfolge (Abschnitt 6), Signatur `sessionReducer(state, event, rounds)` wie Comp I |
| Punkteregeln | `src/engine/scoring.ts` | C\* | `pointsForInterviewTurn`, `pointsForFeature`, `maxPointsPerRound`, `isValidPair`, `clusterFeaturesByMotive` |
| Engine-Tests | `src/engine/__tests__/comp2.test.ts`, `session.test.ts`, `config.test.ts` | C\* | `comp2.test.ts` wird `scoring.test.ts`; Comp-I-Fälle raus |
| Scorer-Interface | `src/scoring/types.ts`, `index.ts` | C\* | `InterviewInput/Output`, `FeatureInput/Output`, `SummaryInput`; `Scorer` mit `answerInterview`, `scoreFeature`, `summarizeRound` |
| Keyword-Scorer | `src/scoring/keywordScorer.ts`, `__tests__/keywordScorer2.test.ts` | C\* | `isOpenQuestion`, `matchMotive`, `matchFeature`, `normalize`/`best` bleiben; `evaluateByKeywords` (Comp I) raus |
| Demo-Konfiguration | `src/data/config/demo.json` (aus `demo2.json`), `index.ts` | C | Umbenennen nach `demo.json`, Session-Code `demo`; `configForCode` bleibt für Phase 0 |
| Teilnehmer-Modell | `src/lib/participant.ts`, `demoData.ts`, `useLocalSession.ts` | C\* | `Participant` ohne `arguments`/`placements`; `useLocalSession` ohne `submitArgument`/`submitMatrix` |
| Teilnehmer-Screens | `src/components/participant/Comp2Screens.tsx` | C | Aufteilen in `PersonaIntroScreen.tsx`, `InterviewScreen.tsx`, `MotivesRevealScreen.tsx`, `FeaturesScreen.tsx`, `SummaryWaitScreen.tsx` |
| Teilnehmer-Shell | `ParticipantApp.tsx`, `Screens.tsx` (Join/Lobby/Explore/`VersusCard`), `AppHeader.tsx`, `ResultScreen.tsx`, `JoinScreen.tsx`, `DevBar.tsx` | C\* | Nur Comp-II-Zweig im Phasen-Switch; `ArgueScreen.tsx`, `MatrixScreens.tsx` **nicht** kopieren |
| Leinwand | `src/components/trainer/views2.tsx` → `views.tsx`, `TrainerApp.tsx` | C\* | Lobby-, Explore-, Leaderboard-View aus `views.tsx` (P) mitnehmen, Comp-I-Views raus |
| Routen | `src/app/page.tsx`, `s/[code]/page.tsx`, `t/page.tsx`, `t/[code]/page.tsx` | C\* | Startseite nur mit Comp-II-Demo-Links |
| Briefing | `SAPERED_Workshop-App_Konzept_Aufwandsschaetzung_CompII.md` | liegt vor | – |
| README | `README.md` | N | Nach Muster Comp I |

**Extraktion in der Praxis** (aus diesem Ordner, Comp-I-Repo liegt daneben):

```bash
REF=../cupra.delta-ws-competitor
# Plattform-Dateien aus HEAD
cp $REF/package.json $REF/tsconfig.json $REF/eslint.config.mjs $REF/vitest.config.ts $REF/postcss.config.mjs $REF/next.config.ts $REF/vercel.json $REF/.gitignore $REF/.env.example $REF/AGENTS.md $REF/CLAUDE.md .
cp -R $REF/public . && mkdir -p src/app src/components/shared src/lib && cp $REF/src/app/globals.css $REF/src/app/layout.tsx $REF/src/app/favicon.ico src/app/
cp $REF/src/components/shared/{ui,bits,Background,Icon,LeaderboardList}.tsx src/components/shared/
cp $REF/src/lib/{storage,storedValue,useClientValue,identity}.ts src/lib/
# Comp-II-Dateien aus dem Commit (Beispiel)
git -C $REF show 3e13cab:src/components/participant/Comp2Screens.tsx > src/components/participant/Comp2Screens.tsx
git -C $REF show 3e13cab:src/components/trainer/views2.tsx > src/components/trainer/views.tsx
git -C $REF show 3e13cab:src/data/config/demo2.json > src/data/config/demo.json
# ... restliche C*-Dateien ebenso, dann Comp-I-Zweige entfernen
```

---

## 5. Phasenplan

Nach jeder Phase existiert etwas Vorzeigbares. Aufwände sind grobe Orientierung für eine Person. Wo eine Zahl in Klammern steht, gilt sie, falls die Plattform-Phase in Comp I bereits gebaut ist und nur portiert wird.

### Phase 0 – Klick-Prototyp aus dem Commit extrahieren (ca. 0,5 bis 1 Tag) · Meilenstein „Prototyp“ · **umgesetzt 14.09.2026, Deployment offen**

Ziel: alle Screens des Comp-II-Flows und die Leinwand mit Demo-Inhalt, im echten Look, auf dem Handy per Vercel-Link bedienbar. Ohne Datenbank, ohne KI, ohne Geräte-Synchronisation. Der Code existiert im Commit, die Arbeit ist Extraktion und Vereinfachung.

**Gerüst**
- [x] `git init`, Remote `git@github.com:BAM-Dennis/cupra.delta-ws-competitors2.git`, Dateien nach Abschnitt 4 übernehmen, `npm install`
- [x] Union auflösen: `WorkshopConfig` ist `Comp2Config`, ein Schema, eine Phasenfolge, `Participant` ohne Comp-I-Felder, `Scorer` ohne `scoreArgument`
- [x] `demo2.json` → `demo.json`, Session-Code `demo`, `_note` als Platzhalter-Hinweis behalten
- [x] Tests grün: Zustandsmaschine (komplette Phasenfolge, `BACK`, `RESET`), Punkteregeln, Paar-Prüfung, Clustering, `isOpenQuestion`, `matchMotive` (kein zweites Motiv pro Frage, entdecktes zählt nicht erneut), `matchFeature`, Schema-Referenzprüfung
- [x] `npm run lint`, `npm run build`

**Teilnehmer-Screens (`/s/demo`)**
- [x] Join, Lobby (aus Comp I)
- [x] **Persona-Vorstellung:** Name, Tagline, Intro in erster Person, Motive verdeckt als Platzhalter-Karten, Hinweis auf den Wettbewerber der Runde
- [x] **Interview:** Chat-Verlauf, Textfeld unten, Zähler „Frage 1 von 3“, Antwort der Persona in-character, bei Treffer dezentes Signal plus Fortschritt (B7), kein Klartext-Motiv
- [x] **Motiv-Reveal:** entdeckte und nicht entdeckte Motive mit Label und Beschreibung, Punkte dieser Phase
- [x] **Erkundung:** Kategorien als aufklappbare Karten, Motive der Persona als Leitplanken oben, keine Eingabe
- [x] **Feature-Eingabe:** Textfeld plus Motiv-Auswahl (Chips), Feedback pro Feature, Zähler „Feature 1 von 3“, „Fertig“ ab dem ersten Feature, danach Gesamtfeedback mit Rundenpunkten
- [x] **Warten auf Zusammenfassung:** eigene Features nach Motiv, „Der Trainer zeigt gleich die Zusammenfassung“
- [x] **Ergebnis:** Gesamtstand, Leaderboard mit eigener Zeile
- [x] Dev-Leiste per `?dev=1`

**Trainer-Leinwand (`/t/demo`)**
- [x] Steuerleiste (aus Comp I): Phase, Weiter, Zurück, Reset, Teilnehmerzahl, Phasen-Stepper
- [x] Ansichten: Lobby mit QR und Code, Persona-Vorstellung, Interview-Fortschritt (Demo-Balken), Motiv-Reveal, Kategorien-Übersicht, Feature-Fortschritt, **Zusammenfassung nach Motiv** (vier Spalten oder Karten je Motiv, Features nach Häufigkeit, Nennungen als Zahl), Leaderboard
- [ ] Vercel-Projekt anlegen, Deployment, Link an SAPERED

**Fertig wenn:** Jemand ohne Erklärung den Teilnehmer-Flow auf dem Handy durchklickt und die Leinwand parallel im Laptop-Browser zeigt, was die Gruppe sehen würde. Feedback-Runde mit SAPERED zu Flow, Fragenzahl und Reveal-Darstellung vor Phase 1.

### Phase 1 – Raum-Prototyp: echte Sessions und Synchronisation (ca. 2 Tage, portiert ca. 1 Tag)

Ziel: mehrere Handys treten per QR einer Session bei, der Trainer schaltet die Phasen, alle Geräte folgen. Diese Phase ist bis auf zwei Tabellen und zwei Endpunkte identisch zu Comp I Phase 1. Wer zuerst baut, liefert die Vorlage für das andere Repo.

**Postgres**
- [ ] `docker-compose.yml` (Port 5443, DB `workshop2`), `npm run db:up`, `npm run db:migrate`, Schema `db/migrations/0001_init.sql` (Abschnitt 8)
- [ ] Konfiguration beim Anlegen einer Session als JSON-Snapshot in `sessions.config`

**API (Abschnitt 9)**
- [ ] `POST /api/sessions`, `GET /api/sessions/[code]/state`, `POST /api/sessions/[code]/advance`, `POST /api/sessions/[code]/join`, `GET /api/sessions/[code]/me`, `GET /api/sessions/[code]/progress`, `GET /api/sessions/[code]/leaderboard` (wie Comp I)
- [ ] `POST /api/sessions/[code]/interview` und `POST /api/sessions/[code]/features` zunächst mit `keywordScorer`, damit Reconnect und Fortschritt echt sind

**Client**
- [ ] `identity.ts`: `userId` aus `?u=` der Join-URL, sonst localStorage, sonst neu. **Comp-II-spezifisch:** die Join-URL im QR trägt die ID nur, wenn eine übergreifende Mechanik vorliegt (Abschnitt 13, Risiko 4). Bis dahin gerätegebunden
- [ ] `useSessionState(code)`: Polling alle 2 s, Backoff bis 10 s, Hinweis „Verbindung wird wiederhergestellt“
- [ ] Teilnehmer-App liest Phase und eigenen Stand (`interviews`, `features`, `roundFinished`) vom Server. `useLocalSession` wird durch `useSession` ersetzt, die Screens bleiben
- [ ] Trainer `/t` (Session anlegen) und `/t/[code]`, Trainer-Token in localStorage, QR-Code groß auf der Leinwand

**Fertig wenn:** Drei Handys über Mobilfunk plus ein Laptop. Trainer drückt „Weiter“, alle Handys wechseln innerhalb von 2 bis 3 Sekunden. Handy neu laden führt in dieselbe Phase mit demselben Gesprächsverlauf zurück.

### Phase 2 – KI: Matcher A als Persona, Matcher B, Zusammenfassung (ca. 3 Tage)

Ziel: die Persona antwortet mit Claude in ihrer Rolle, Features werden semantisch erkannt, die Zusammenfassung verdichtet auch unerkannte Freitexte. Details in Abschnitt 12.

**Matcher A, Interview (ca. 2 Tage, der Kern von Comp II)**
- [ ] `src/scoring/llmScorer.ts`, `answerInterview` mit Anthropic TypeScript SDK und Structured Outputs: `{ reply: string, isOpen: boolean, discoveredMotiveId: string | null, confidence: "clear" | "borderline" | "none" }`
- [ ] System-Prompt statisch (Rollenregeln), Persona-Block (Name, Hintergrund, Motivliste mit Themen und Aufdeck-Sätzen, bereits entdeckte Motive) als erster User-Block mit `cache_control`; Gesprächsverlauf als Messages. Modell `claude-opus-5`, `effort: "low"`, Antwort auf zwei bis drei Sätze begrenzt
- [ ] Harte Regeln im Prompt: in der Rolle bleiben, kein Motiv außerhalb der Liste, kein Motiv benennen, das nicht klar getroffen wurde, bei geschlossenen Fragen kurz antworten und offener fragen lassen, `revealLine` der Konfiguration sinngemäß verwenden
- [ ] Fairness im Code (`engine/interview.ts`): nur `confidence === "clear"` deckt auf, bereits entdeckte Motive werden vor dem Aufruf aus der Kandidatenliste genommen, `discoveredMotiveId` muss in der Persona-Liste stehen, sonst wird die Antwort als „kein Treffer“ gewertet und der Text behalten
- [ ] Fehlerpfad: Timeout 12 s oder API-Fehler, dann `keywordScorer` mit Zusatz „(automatisch bewertet)“. Die Frage geht nie verloren
- [ ] Eval-Satz `src/scoring/__tests__/fixtures.interview.json`: 30 bis 40 Fragen je Persona, markiert als offen/geschlossen und Treffer/Grenzfall/kein Treffer. `npm run eval:interview` gibt Trefferquote für `isOpen` und `discoveredMotiveId` aus. Grundlage für die Abnahme der Motiv-Themen mit CUPRA

**Matcher B, Feature (ca. 0,5 Tag)**
- [ ] `scoreFeature`: Claude klassifiziert den Freitext auf eine `featureId` aus dem Modell oder `null`, Ausgabe `{ featureId, feedback }`. Paar-Prüfung und Punkte bleiben in `engine/scoring.ts`. Mechanik identisch zum Argument-Scorer aus Comp I, deshalb günstig
- [ ] Feedback-Regeln: ein bis zwei Sätze, bei erkanntem Feature mit falschem Motiv den Zusammenhang erklären, ohne die gültigen Motive wörtlich aufzuzählen
- [ ] Eval-Satz `fixtures.features.json`: 20 bis 30 Feature-Texte mit erwarteter `featureId`

**Zusammenfassung (ca. 0,5 Tag)**
- [ ] Deterministisches Clustering aus Phase 0 bleibt die Basis (`clusterFeaturesByMotive`)
- [ ] `summarizeMotives`: Claude gruppiert die **unerkannten** Freitexte je Motiv zu wenigen Überschriften und formuliert je Motiv einen Satz als Vorlage fürs Schlusswort. Ergebnis wird in `sessions.summary` gespeichert, einmal berechnet beim Wechsel in `summary`, Leinwand pollt
- [ ] Gesamtfeedback pro Runde (`summarizeRound`): zwei bis drei Sätze über Interview und Features, ohne LLM Textbaustein nach Punktestufen

**Übergreifend**
- [ ] Umschalter `SCORER=llm|keyword`, `ANTHROPIC_API_KEY`
- [ ] Latenz-Logging (`latency_ms`, `scorer`) in `interview_turns` und `feature_submissions`

**Fertig wenn:** Eine Frage wird abgeschickt, die Persona antwortet nach 2 bis 5 Sekunden in ihrer Rolle, gleiche Fragen decken dieselben Motive auf, eine geschlossene Frage bekommt den Stups, der Fallback greift bei gezogenem API-Key. Der Eval-Satz liegt über 85 Prozent für `isOpen` und über 80 Prozent für den Motiv-Treffer.

### Phase 3 – Zusammenfassung auf der Leinwand, Leaderboard, Robustheit (ca. 1 Tag)

- [ ] `GET /api/sessions/[code]/summary`: Cluster aus `feature_submissions` plus KI-Verdichtung, Leinwand zeigt je Motiv die Features nach Häufigkeit, Anzahl Nennungen, optional den Schlusswort-Satz für den Trainer (nur Leinwand, E2)
- [ ] Leaderboard serverseitig als SQL-View, Tie-Break frühere Abgabe, Leinwand Top 10, App Top 10 plus eigene Zeile
- [ ] Phasenwechsel schließt offene Eingaben mit 10 s Toleranz. Wer beim Wechsel zu `motives` noch tippt, sieht „Der Trainer ist weitergegangen“, die Punkte bleiben
- [ ] Interview-Frage und Feature je `(round, idx)` genau einmal, doppeltes Absenden 409
- [ ] Reconnect Ende-zu-Ende: Flugmodus mitten im Interview, Tab-Wechsel, Browser-Neustart, Gesprächsverlauf vollständig zurück
- [ ] Doppel-Tap, leere Eingaben, Längen (`QUESTION_MAX_CHARS`, `FEATURE_MAX_CHARS`)
- [ ] Trainer-Notfallfunktionen: Reset, Teilnehmer entfernen, eine Phase zurück

**Fertig wenn:** Ein kompletter Workshop mit 5 Geräten läuft durch, inklusive Zusammenfassung und Leaderboard auf der Leinwand.

### Phase 4 – Konfiguration, Deployment, Raumtest (ca. 1,5 Tage, portiert ca. 1 Tag) · Meilenstein „Raumfähig“

- [ ] Excel-Template mit Blättern Marken, Motive, Features (mit Motiv-Spalten als Matrix, Kreuz = gültiges Paar), Personas, Persona-Motive (Themen, Aufdeck-Satz), Stups-Sätze, Kategorien. `npm run config:import -- markt.xlsx` erzeugt und validiert die JSON, `npm run config:export` erzeugt die Vorlage aus der Demo. Fehler mit Blatt und Zeile
- [ ] Session-Anlage wählt die Konfiguration (Dropdown aller `src/data/config/*.json`) und die Fragenzahl (Override von `interviewQuestions`, damit der Trainer bei knapper Zeit auf zwei Fragen gehen kann, ohne eine neue Datei zu brauchen)
- [ ] Vercel-Projekt, Neon-Postgres, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `SCORER`, `TRAINER_PIN`, Migration gegen Produktion
- [ ] Lasttest: 24 simulierte Teilnehmer stellen innerhalb von 90 s je 3 Fragen (72 Persona-Aufrufe parallel, Antworten länger als in Comp I), danach je 3 Features. Antwortzeiten protokollieren, Rate-Limits prüfen
- [ ] Raumtest mit echten Geräten, Trainer-Checkliste (Session anlegen, Fragenzahl, QR, Phasen, Zusammenfassung lesen, Notfall)
- [ ] README mit Betrieb, Konfiguration, Trainer-Anleitung

**Fertig wenn:** Eine Trainingsgruppe kann Comp II mit echter Konfiguration durchführen.

### Phase 5 – Design/CI (nach Vorlage des Grafikers, Erfahrungswert ca. 2 bis 3 Tage)

- [ ] Screens nach Figma, insbesondere Interview-Chat, das Aufdeck-Signal (B7), Motiv-Reveal, Feature-Eingabe mit Motiv-Chips und die Zusammenfassung auf der Leinwand
- [ ] Visueller Abgleich per Playwright-Screenshots
- [ ] Animationen: Aufdeck-Signal, Reveal, Zusammenfassung baut sich je Motiv auf, Leaderboard

---

## 6. Session-Zustandsmaschine (`src/engine/session.ts`)

```
lobby
  → persona    (round 0)   Persona stellt sich vor
  → interview  (round 0)   offene Fragen, Matcher A
  → motives    (round 0)   Reveal entdeckt / nicht entdeckt
  → explore    (round 0)   Erkundung am Fahrzeug, App passiv
  → features   (round 0)   Top-3-Features mit Motiv, Matcher B
  → persona    (round 1)
  → interview  (round 1)
  → motives    (round 1)
  → explore    (round 1)
  → features   (round 1)
  → summary                Zusammenfassung nach Motiv, nur Leinwand
  → leaderboard
  → ended
```

Zustand `{ phase, round, version }`, Reducer mit `NEXT`, `BACK`, `RESET`, generisch über `rounds.length`. Teilnehmer-Zustand getrennt und pro Person: `interviews[]`, `features[]`, `roundFinished[]`, auf dem Server, per `/me` geholt. Der Wechsel der Fahrzeuge zwischen den Runden ist kein eigener Zustand, er passiert während `persona` der zweiten Runde.

---

## 7. Projektstruktur

```
src/
  app/
    page.tsx                          Einstieg: Code eingeben, Demo-Links
    s/[code]/page.tsx                 Teilnehmer-App
    t/page.tsx                        Trainer: Session anlegen
    t/[code]/page.tsx                 Trainer: Leinwand + Steuerleiste
    api/sessions/route.ts
    api/sessions/[code]/{state,advance,join,me,progress,leaderboard}/route.ts
    api/sessions/[code]/interview/route.ts
    api/sessions/[code]/features/route.ts
    api/sessions/[code]/rounds/[round]/finish/route.ts
    api/sessions/[code]/summary/route.ts
  components/
    participant/   JoinScreen, LobbyScreen, PersonaIntroScreen, InterviewScreen,
                   MotivesRevealScreen, ExploreScreen, FeaturesScreen,
                   SummaryWaitScreen, ResultScreen, AppHeader, DevBar, ParticipantApp
    trainer/       TrainerApp, views (Lobby/QR, PersonaIntro, InterviewProgress,
                   Motives, Explore, FeaturesProgress, Summary, Leaderboard)
    shared/        LeaderboardList, Background, Icon, ui, bits
  engine/          config, types, configSchema, session, scoring, interview (Fairness-Regeln)
  scoring/         types (Scorer-Interface), keywordScorer, llmScorer, prompts, __tests__ (Fixtures, Eval)
  data/config/     demo.json, später ein JSON pro Markt
  lib/             db, api, storage, identity, useSession, useLocalSession (nur Phase 0)
db/migrations/
scripts/           migrate.mts, config-import.mts, config-export.mts, simulate.mts, eval-interview.mts
```

---

## 8. Datenmodell (SQL, `db/migrations/0001_init.sql`)

`users`, `sessions`, `participations` und die View `leaderboard` sind identisch zu Comp I (dort Abschnitt 6), `sessions.workshop_ref` ist `'competitor-2'`. Neu:

```sql
create table interview_turns (
  id                uuid primary key default gen_random_uuid(),
  participation_id  uuid not null references participations(id) on delete cascade,
  round             int  not null,
  idx               int  not null,                  -- 0..interviewQuestions-1
  question          text not null,
  reply             text not null,
  is_open           boolean not null,
  discovered_motive text,                           -- motiveId oder null, maximal eins
  confidence        text,                           -- clear | borderline | none (llm)
  points            int  not null default 0,
  scorer            text,                           -- 'llm' | 'keyword'
  latency_ms        int,
  created_at        timestamptz not null default now(),
  unique (participation_id, round, idx)
);

create table feature_submissions (
  id                uuid primary key default gen_random_uuid(),
  participation_id  uuid not null references participations(id) on delete cascade,
  round             int  not null,
  idx               int  not null,                  -- 0..2
  text              text not null,
  motive_id         text not null,                  -- vom Teilnehmer gewählt
  feature_id        text,                           -- erkanntes Feature oder null
  pair_valid        boolean not null,
  feedback          text,
  points            int  not null default 0,
  scorer            text,
  latency_ms        int,
  created_at        timestamptz not null default now(),
  unique (participation_id, round, idx)
);

alter table sessions add column summary jsonb;      -- Cluster plus KI-Verdichtung, einmal berechnet
```

Motive, Persona-Motive und das Feature-Motiv-Modell liegen wie alle Inhalte im Konfigurations-Snapshot `sessions.config`, nicht in eigenen Tabellen. Die Zusammenfassung ist eine Abfrage über `feature_submissions` einer Session, gruppiert nach `motive_id` und `feature_id`. `participations.score` wird bei jeder bepunkteten Abgabe in derselben Transaktion nachgeführt.

---

## 9. API-Verträge (Kurzform)

| Endpunkt | Wer | Request | Antwort |
|---|---|---|---|
| `POST /api/sessions` | Trainer | `{ configRef, interviewQuestions? }` | `{ code, trainerToken }` |
| `GET /api/sessions/[code]/state` | alle | – | `{ phase, round, version, participants, roundsTotal, interviewQuestions }` |
| `POST /api/sessions/[code]/advance` | Trainer | `{ trainerToken, action: "NEXT" \| "BACK" \| "RESET" }` | neuer `state` |
| `POST /api/sessions/[code]/join` | Teilnehmer | `{ userId, displayName? }` | `{ participationId, state, me }` |
| `GET /api/sessions/[code]/me?userId=` | Teilnehmer | – | `{ interviews[], features[], roundFinished[], roundSummaries[], score }` |
| `POST /api/sessions/[code]/interview` | Teilnehmer | `{ userId, round, idx, question }` | `{ reply, isOpen, discoveredMotiveId, points, score }` · 409 wenn bereits gesetzt |
| `POST /api/sessions/[code]/features` | Teilnehmer | `{ userId, round, idx, text, motiveId }` | `{ evaluation, feedback, points, score }` · 409 wenn bereits gesetzt |
| `POST /api/sessions/[code]/rounds/[round]/finish` | Teilnehmer | `{ userId }` | `{ summary, roundPoints, score }` |
| `GET /api/sessions/[code]/progress` | Trainer | – | `{ participants, interviewsByRound[], featuresByRound[], motivesDiscovered: { motiveId: count } }` |
| `GET /api/sessions/[code]/summary` | Trainer | – | `{ clusters: MotiveCluster[], narrative?: { motiveId: string }[] }` |
| `GET /api/sessions/[code]/leaderboard?userId=` | alle | – | `{ top[], me }` |

Validierung mit `zod`, Phasenprüfung serverseitig: Frage nur in `interview` der passenden Runde, Feature nur in `features`, jeweils mit 10 s Toleranz. Der Interview-Endpunkt liest den bisherigen Verlauf und die entdeckten Motive aus der Datenbank, der Client schickt nur die neue Frage.

---

## 10. Konfigurationsformat (`src/data/config/*.json`)

```jsonc
{
  "id": "demo",
  "type": "competitor-2",
  "market": "GLOBAL",
  "workshopRef": "competitor-2",
  "language": "en",
  "title": "Competitor Workshop II",
  "interviewQuestions": 3,
  "brands": [
    { "id": "cupra", "name": "CUPRA Delta", "short": "CUPRA", "isCupra": true, "present": true },
    { "id": "mini",  "name": "MINI Cooper E", "short": "MINI", "present": true },
    { "id": "smart", "name": "smart #1", "short": "smart", "present": true }
  ],
  "motives": [
    { "id": "m-standout", "label": "Standing out", "description": "Being noticed, not driving what everyone else drives." },
    { "id": "m-joy",      "label": "Driving joy", "description": "…" },
    { "id": "m-design",   "label": "Design as self-expression", "description": "…" },
    { "id": "m-premium",  "label": "Owning something special", "description": "…" }
  ],
  "features": [
    { "id": "f-exterior", "text": "Distinctive exterior with copper accents", "motiveIds": ["m-standout", "m-design"], "keywords": ["copper", "exterior", "…"] },
    { "id": "f-seats",    "text": "Sport seats and driver-focused cockpit",   "motiveIds": ["m-joy", "m-premium"],     "keywords": ["seats", "cockpit", "…"] }
  ],
  "rounds": [
    {
      "id": "r1",
      "competitorBrandId": "mini",
      "persona": {
        "name": "Nico",
        "tagline": "29, creative agency",
        "intro": "Hi, I'm Nico. …",
        "background": "Nur für die KI-Rolle, nicht sichtbar",
        "motives": [
          { "motiveId": "m-standout", "topics": ["what his colleagues drive", "…"], "revealLine": "Honestly? Half my agency …", "keywords": ["colleagues", "…"] }
        ],
        "nudgeLines": ["Hm, yes or no doesn't really get you far with me. …"]
      },
      "categories": [
        { "id": "c-exterior", "title": "Exterior", "prompts": ["Stand ten steps back from both cars. Which one do people look at?", "…"] }
      ]
    }
  ]
}
```

Motive sind global definiert, damit die Zusammenfassung über beide Personas nach Motiv sortieren kann. Die persona-spezifische Ausprägung (Themen, Aufdeck-Satz) hängt an der Persona. `keywords` nutzt nur der `keywordScorer`, der `llmScorer` bekommt `topics`, `description`, `background`, `revealLine`. Das zod-Schema prüft: jede `motiveId` in Features und Personas existiert, kein Motiv doppelt je Persona, jede Runde hat einen bekannten Wettbewerber und mindestens eine Kategorie, genau eine CUPRA-Marke, `interviewQuestions` zwischen 1 und 6. Die Demo-Inhalte (aus `3e13cab:src/data/config/demo2.json`) sind fachliche Platzhalter, die echten kommen von CUPRA.

---

## 11. Konstanten (`src/engine/config.ts`)

| Konstante | Wert | Quelle |
|---|---|---|
| `INTERVIEW_QUESTIONS_DEFAULT` | 3 | B2, Feinkonzept: zwei oder drei, pro Konfiguration und Session überschreibbar |
| `QUESTION_MIN_CHARS` / `QUESTION_MAX_CHARS` | 6 / 300 | Annahme |
| `FEATURES_PER_ROUND` | 3 | D1 |
| `FEATURE_MIN_CHARS` / `FEATURE_MAX_CHARS` | 4 / 200 | Annahme |
| `POINTS_MOTIVE_DISCOVERED` | 1 | US-2, maximal eins pro Frage |
| `POINTS_FEATURE_RECOGNIZED` | 1 | Annahme: formatives Feedback „echtes Feature, falsches Motiv“ |
| `POINTS_FEATURE_PAIR` | 1 | D3 |
| `INTERVIEW_CONFIDENCE_MIN` | `"clear"` | Abschnitt 7 Briefing, Schwellenwert |
| `STATE_POLL_MS` / `PROGRESS_POLL_MS` | 2 000 / 3 000 | wie Comp I |
| `PHASE_GRACE_MS` | 10 000 | wie Comp I |
| `SCORER_TIMEOUT_MS` | 12 000 | Fallback-Schwelle |
| `DISPLAY_NAME_MAX`, `LEADERBOARD_TOP_N`, `SESSION_CODE_LENGTH` | 20 / 10 / 6 | wie Comp I |

Maximum je Runde bei drei Motiven und drei Fragen: 3 (Interview) plus 6 (Features) gleich 9 Punkte, über zwei Runden 18. Die Aufteilung in „erkannt“ und „Paar gültig“ ist eine Annahme des Prototyps, das Briefing nennt nur „Punkte pro gültigem Paar“. **Mit CUPRA zu bestätigen.**

---

## 12. KI-Logik im Detail

### Matcher A: Persona-Interview

**Aufrufstruktur.** Ein Aufruf pro Frage, synchron, Antwort in wenigen Sekunden (NFR Abschnitt 9 Briefing).

- **System-Prompt (statisch, gecacht):** Rollenregeln. „Du bist die beschriebene Person in einem Verkaufsgespräch. Antworte in der ersten Person, zwei bis drei Sätze, natürlich, nicht wie ein Fragebogen. Du hast eine feste Liste innerer Kaufmotive. Du sprichst ein Motiv nur dann erkennbar an, wenn die Frage offen ist und klar dessen Themenfeld öffnet. Du erfindest keine Motive außerhalb der Liste. Auf geschlossene Fragen antwortest du kurz und lädst ein, offener zu fragen. Du nennst niemals die Motiv-Labels wörtlich.“
- **Persona-Block (erster User-Block, `cache_control`):** Name, Tagline, Intro, Hintergrund, Wettbewerber der Runde, Liste der **noch nicht entdeckten** Motive mit Themen und Aufdeck-Satz, Liste der bereits entdeckten Motive (nur damit die Persona konsistent bleibt, nicht erneut aufdeckbar).
- **Gesprächsverlauf:** bisherige Fragen und Antworten als abwechselnde Messages, dann die neue Frage.
- **Ausgabe (Structured Output):** `{ reply, isOpen, discoveredMotiveId: string | null, confidence: "clear" | "borderline" | "none" }`.

**Fairness im Code (`engine/interview.ts`), nicht im Prompt:**
1. Kandidaten sind nur die noch nicht entdeckten Motive der Persona.
2. Ein Punkt fällt nur bei `isOpen && confidence === "clear" && discoveredMotiveId ∈ Kandidaten`.
3. `borderline` wird gespeichert, aber nicht bepunktet. Die Antwort bleibt, der Teilnehmer bekommt keinen Punkt. Das ist der Schwellenwert aus dem Briefing.
4. Liefert das Modell eine ID außerhalb der Liste, wird sie verworfen und geloggt.
5. Maximal ein Motiv pro Frage ist durch das Schema erzwungen (ein Feld, kein Array).

**Eval-Satz.** Je Persona 30 bis 40 Fragen in vier Klassen: offen mit klarem Treffer, offen mit Grenzfall, offen ohne Treffer, geschlossen. Skript gibt Trefferquote für `isOpen` und für den Motiv-Treffer aus, plus Liste der Abweichungen. Der Satz wird mit CUPRA-Inhalten neu befüllt, sobald sie vorliegen. Er ist gleichzeitig das Abnahme-Instrument für die Themenlisten.

**Kosten und Latenz.** 24 Teilnehmer mal 3 Fragen mal 2 Runden sind 144 Aufrufe pro Workshop, Persona-Block gecacht, Antwort kurz. Kosten im Cent- bis unteren Euro-Bereich pro Workshop. Der Lasttest in Phase 4 misst Antwortzeiten bei 72 parallelen Aufrufen.

### Matcher B: Feature → Motiv

Der Teilnehmer wählt das Motiv selbst, das Modell muss nur den Freitext auf eine `featureId` abbilden oder `null` liefern. Ausgabe `{ featureId, feedback }`. Paar-Prüfung `isValidPair(config, featureId, motiveId)` und Punkte laufen im Code. Prompt bekommt die Feature-Liste mit `text`, nicht die Motiv-Zuordnung, damit das Feedback nicht die gültigen Motive verrät. Mechanik und Prompt-Aufbau wie der Argument-Scorer aus Comp I, deshalb der kleinste Posten.

### Zusammenfassung nach Motiv

Zweistufig: `clusterFeaturesByMotive` gruppiert deterministisch alle erkannten Features je Motiv nach Häufigkeit und sammelt unerkannte Texte. Mit LLM kommt ein Aufruf beim Wechsel in `summary` dazu, der die unerkannten Texte je Motiv zu wenigen Überschriften verdichtet und je Motiv einen Satz für das Schlusswort formuliert. Ergebnis wird in `sessions.summary` gespeichert, die Leinwand liest es. Ohne LLM zeigt die Leinwand nur die Cluster, das ist bereits US-5-konform.

---

## 13. Schätz-Hebel (Briefing Abschnitt 10, getrennt ausgewiesen)

Zahlen sind Aufwand für eine Person. Phase 0 ist mit dem vorhandenen Commit weitgehend erledigt.

| Hebel | Variante A (vereinfacht) | Variante B (echtes LLM) | Differenz |
|---|---|---|---|
| **Matcher A, Interview** | Fragewort-Heuristik für offen/geschlossen, Stichwort-Matching gegen Motiv-Themen, feste Aufdeck- und Stups-Sätze aus der Konfiguration. Ca. 0,5 Tag, **im Commit enthalten**. Schwäche: erkennt nur gepflegte Themenwörter, wirkt nach der zweiten Frage mechanisch, keine echte Rolle | Claude in der Persona-Rolle mit Structured Outputs, Gesprächsverlauf, Prompt-Caching, Fairness-Regeln im Code, Fallback, Eval-Satz. Ca. 2 Tage plus laufende API-Kosten | ca. 2 Tage plus Betrieb |
| **Matcher B, Feature** | Stichwort-Matching gegen die Feature-Liste plus Paar-Prüfung. Ca. 0,25 Tag, **im Commit enthalten** | Claude klassifiziert auf Feature-ID, Paar-Prüfung im Code, Eval-Satz. Ca. 0,5 Tag | ca. 0,5 Tag |
| **Motiv-Zusammenfassung** | Deterministisches Clustering über erkannte Feature-IDs, unerkannte Texte als eigene Einträge, Leinwand-Ansicht. Ca. 0,5 Tag, **im Commit enthalten** | Zusätzlich KI-Verdichtung der unerkannten Texte und ein Satz je Motiv fürs Schlusswort. Ca. 0,5 Tag | ca. 0,5 Tag |
| **Realtime** | Polling alle 2 s, 0 Tage Zusatz | SSE, ca. 1 Tag, nicht nötig | ca. 1 Tag |
| **Konfiguration** | Excel-Template mit Import und Validierung, ca. 1 Tag (Phase 4) | Admin-UI, ca. 4 bis 6 Tage | ca. 3 bis 5 Tage |
| **Screens** | Teilnehmer 9 Screens, Leinwand 8 Ansichten, im Look der Streak Challenge, im Commit enthalten | Nach Figma mit Animationen, ca. 2 bis 3 Tage (Phase 5) | Design-Phase |

**Summen:**

| Szenario | Aufwand |
|---|---|
| Kern-Umfang Phasen 0 bis 4, **eigenständig gebaut**, Variante B bei beiden Matchern und Zusammenfassung | ca. 8 Tage (0,5–1 + 2 + 3 + 1 + 1,5) |
| Dasselbe, aber Phasen 1 und 4 **aus Comp I portiert** (Comp I ist dann bereits raumfähig) | ca. 6 Tage |
| Reiner Zusatzaufwand Comp II gegenüber einer fertigen Comp-I-Plattform (Sicht des Briefings, Abschnitt 10) | Variante A durchgängig ca. 2,5 Tage, Variante B ca. 5 Tage |
| Design/CI | obendrauf, sobald Figma vorliegt |

**Empfehlung:** Matcher A als echtes LLM setzen, das Interview lebt von der In-Character-Antwort. Matcher B kann regelbasiert starten und mit wenig Aufwand nachziehen. Die KI-Verdichtung der Zusammenfassung ist ein Nice-to-have für das Schlusswort.

---

## 14. Risiken und getroffene Entscheidungen

1. **Matcher A ist das Risiko.** Eine Persona, die aus der Rolle fällt, Motive erfindet oder zu großzügig aufdeckt, macht das Scoring unfair. Gegenmaßnahmen: Kandidatenliste nur mit unentdeckten Motiven, Schwellenwert `clear`, ID-Prüfung gegen die Liste, Eval-Satz mit Grenzfällen, `effort: "low"` und kurze Antworten für Latenz. Der Eval-Satz entscheidet, ob die Themenlisten von CUPRA scharf genug sind.
2. **Ground Truth fehlt.** Motive, Themen, Aufdeck-Sätze, Feature-Motiv-Modell und Personas kommen von CUPRA. Deshalb Excel-Template und Eval-Satz früh, damit die Inhalte direkt in der Zielstruktur geliefert werden.
3. **Zwei Repos, eine Plattform.** Backend, Polling, Deployment und Excel-Import existieren nach Phase 4 zweimal. Bugfixes müssen in beide Repos. Akzeptiert für Prototyp und erste Workshops. Wenn beide Workshops dauerhaft laufen, Zusammenführung in ein Monorepo mit `packages/platform` prüfen (ca. 2 Tage).
4. **Übergreifende User-ID über zwei Origins.** localStorage ist pro Domain. Solange die Reihe keine Identitätsmechanik (Codes, Badge) hat, ist die ID pro Workshop-App gerätegebunden und die Punkte sind nur innerhalb eines Workshops zugeordnet. Sobald die Mechanik steht, trägt die Join-URL die ID (`?u=`), `identity.ts` ist dafür vorbereitet. Alternative ohne Codeänderung: beide Apps unter einer Domain mit Pfad-Präfix deployen.
5. **Zeit im Workshop.** 55 bis 60 Minuten laut SAPERED. Die Fragenzahl ist pro Session einstellbar, damit der Trainer bei 45 Minuten auf zwei Fragen gehen kann. Keine Runde wird gestrichen.
6. **Punktaufteilung Feature.** „Erkannt“ plus „Paar gültig“ statt nur „Paar gültig“ ist eine Annahme, weil sie formatives Feedback erlaubt. Ein Wert in `config.ts`, kein Umbau.
7. **Reveal-Darstellung.** Prototyp folgt B7: dezentes Signal im Interview, Klartext erst im Reveal. Ist eine Design-Frage fürs Feinkonzept, kein Aufwandstreiber.
8. **Kein zweiter Workshop-Typ in diesem Repo.** Die Union aus dem Commit wird bewusst nicht übernommen. Sollte Comp II doch in die Comp-I-Plattform wandern, ist der Commit `3e13cab` die fertige Vorlage dafür.
9. **Modellwahl.** `claude-opus-5` als Konstante, günstigeres Modell ist eine Entscheidung des Auftraggebers und im Code ein Einzeiler, der Eval-Satz zeigt sofort, ob die Qualität hält.

---

## 15. Offene Punkte mit SAPERED und CUPRA

- Fragenzahl im Interview: zwei oder drei (Feinkonzept). Der Prototyp zeigt drei und lässt umstellen.
- Punktaufteilung beim Feature-Scoring (Abschnitt 11).
- Matcher A als echtes LLM gesetzt? Empfehlung ja.
- Darstellung des Motiv-Reveals: Signal im Interview versus Klartext-Layer (mit Grafiker).
- Identitätsmechanik der Reihe (Codes, Badge), relevant für die übergreifende Punktezuordnung über zwei Apps.
- Von CUPRA: zwei Personas, Motive je Persona mit Beschreibung, Themen und Aufdeck-Satz, Feature-Motiv-Modell, finale Copy.

---

## 16. Nächster Schritt

Vercel-Deployment des Prototyps, Push nach `BAM-Dennis/cupra.delta-ws-competitors2`, Link an SAPERED. Die Feedback-Runde zu Flow, Fragenzahl und Reveal entscheidet, ob Phase 1 unverändert startet und ob sie hier oder zuerst in Comp I gebaut wird.
