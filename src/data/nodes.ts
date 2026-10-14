import type { FlowNode } from './types';

export const nodes: FlowNode[] = [
  // ---------------------------------------------------------------- access
  {
    id: 'frontend-chat',
    title: { en: 'Chat interface', de: 'Chat-Oberfläche' },
    slug: 'frontend-chat',
    categoryId: 'access',
    icon: 'message-square',
    summary: {
      en: 'The web app a visitor actually types into — chat on one side, knowledge graph on the other.',
      de: 'Die Web-App, in die ein Besucher tatsächlich tippt — Chat auf der einen Seite, Wissensgraph auf der anderen.',
    },
    description: {
      en: 'A single-page app: a chat panel for asking questions and reading answers, and a graph panel that shows the evidence behind the current answer as a node graph, a table, or charts. Remembers your conversations, your language, and your light/dark preference.',
      de: 'Eine Single-Page-App: ein Chat-Bereich zum Stellen von Fragen und Lesen von Antworten sowie ein Graph-Bereich, der die Belege hinter der aktuellen Antwort als Knotengraph, Tabelle oder Diagramm zeigt. Merkt sich Ihre Unterhaltungen, Ihre Sprache und Ihre Hell-/Dunkel-Einstellung.',
    },
    howItFits: {
      en: 'Every question starts here and every answer ends up back here. It also talks directly to the sign-in and rate-limiting systems before a question is even allowed through.',
      de: 'Jede Frage beginnt hier, und jede Antwort landet wieder hier. Sie kommuniziert außerdem direkt mit Anmeldung und Rate-Limiting, bevor eine Frage überhaupt zugelassen wird.',
    },
    talksTo: ['rate-limiter', 'anonymous-session', 'auth-service', 'graph-view', 'graph-explore', 'request-log'],
    technicalDetails: [
      'implementation/frontend — React + Vite, TypeScript',
      'ChatContext (frontend/src/contexts/ChatContext.tsx) is the central orchestrator for sending questions and streaming answers',
      'services/api.ts wraps fetch/JSON + Server-Sent Events for streaming responses',
    ],
  },
  {
    id: 'anonymous-session',
    title: { en: 'Anonymous visitor ID', de: 'Anonyme Besucher-ID' },
    slug: 'anonymous-session',
    categoryId: 'access',
    icon: 'fingerprint-pattern',
    summary: {
      en: 'A private, signed cookie that remembers your conversations before you ever log in.',
      de: 'Ein privates, signiertes Cookie, das Ihre Unterhaltungen speichert, noch bevor Sie sich anmelden.',
    },
    description: {
      en: 'The first time you visit without logging in, the server hands your browser a random id in a cookie. Every later request includes it, so "your" conversation history stays yours — without asking for an account. If you do log in later, that history is carried over to your account.',
      de: 'Beim ersten Besuch ohne Anmeldung übergibt der Server Ihrem Browser eine zufällige ID in einem Cookie. Jede spätere Anfrage enthält sie, sodass „Ihr“ Gesprächsverlauf Ihnen zugeordnet bleibt — ganz ohne Konto. Melden Sie sich später an, wird dieser Verlauf auf Ihr Konto übertragen.',
    },
    howItFits: {
      en: 'Sits between the chat interface and every backend request, identifying who is asking.',
      de: 'Sitzt zwischen der Chat-Oberfläche und jeder Backend-Anfrage und identifiziert, wer fragt.',
    },
    talksTo: [],
    technicalDetails: [
      'backend/app/core/dependencies.py — get_or_create_user_id()',
      'Cookie name: user_id (backend/app/shared/cookies.py)',
      '1-year expiry, HttpOnly, SameSite=Lax',
    ],
  },
  {
    id: 'rate-limiter',
    title: { en: 'Rate limiter', de: 'Rate-Limiter' },
    slug: 'rate-limiter',
    categoryId: 'access',
    icon: 'gauge',
    summary: {
      en: 'Caps how often one visitor can ask a question, since each one costs real LLM API money.',
      de: 'Begrenzt, wie oft ein Besucher eine Frage stellen kann, da jede davon echte LLM-API-Kosten verursacht.',
    },
    description: {
      en: 'Before an expensive request (asking a question, fetching a citation) is allowed through, the server checks how many requests that visitor\'s network address has made recently. Too many in too short a time → a "please wait a moment" response instead of running the full pipeline. Signed-in visitors are exempt — a real account can be identified and moderated directly if it misbehaves.',
      de: 'Bevor eine teure Anfrage (eine Frage stellen, eine Zitation abrufen) zugelassen wird, prüft der Server, wie viele Anfragen von der Netzwerkadresse dieses Besuchers kürzlich kamen. Zu viele in zu kurzer Zeit → eine „Bitte kurz warten“-Antwort statt der vollständigen Pipeline. Angemeldete Besucher sind ausgenommen — ein echtes Konto lässt sich bei Missbrauch direkt identifizieren und moderieren.',
    },
    howItFits: {
      en: 'The very first gate a question passes through, before safety checks or any real processing happens.',
      de: 'Das allererste Tor, durch das eine Frage geht, noch vor Sicherheitsprüfungen oder jeglicher echten Verarbeitung.',
    },
    talksTo: ['guardrails-input'],
    technicalDetails: [
      'backend/app/core/rate_limiter.py + middleware in backend/app/main.py',
      'Sliding window, keyed by IP address (not by cookie — a cookie is trivially cleared by the visitor)',
      'Applies to POST /qa/ask, /qa/ask/stream, and GET /qa/citation',
    ],
  },

  // --------------------------------------------------------------- safety
  {
    id: 'guardrails-input',
    title: { en: 'Input checks', de: 'Eingabeprüfung' },
    slug: 'guardrails-input',
    categoryId: 'safety',
    icon: 'shield-alert',
    summary: {
      en: 'Reads the question before anything else does, looking for jailbreak attempts or abuse.',
      de: 'Liest die Frage noch vor allem anderen und sucht nach Jailbreak-Versuchen oder Missbrauch.',
    },
    description: {
      en: 'Runs a question through a small panel of checks: is this trying to manipulate the assistant into ignoring its instructions (a "jailbreak")? Is it abusive or toxic language? Is it asking for clearly harmful content? If every check agrees it\'s fine, the question moves on; if a check fails, the question is politely refused instead of being sent anywhere further.',
      de: 'Lässt eine Frage durch mehrere Prüfungen laufen: Wird versucht, den Assistenten zur Missachtung seiner Anweisungen zu bewegen (ein „Jailbreak“)? Enthält sie missbräuchliche oder toxische Sprache? Wird eindeutig schädlicher Inhalt verlangt? Bestehen alle Prüfungen, geht die Frage weiter; schlägt eine fehl, wird die Frage höflich abgelehnt, statt weitergeleitet zu werden.',
    },
    howItFits: {
      en: 'The question only reaches the knowledge-retrieval systems after it passes here — nothing unsafe gets that far.',
      de: 'Die Frage erreicht die Wissensrecherche-Systeme erst, nachdem sie diese Prüfung bestanden hat — nichts Unsicheres kommt so weit.',
    },
    talksTo: ['retrieval-service'],
    technicalDetails: [
      'backend/app/modules/guardrails/application/service.py — GuardrailsService',
      'Active validators: JailbreakValidator, ToxicLanguageValidator, ModerationValidator (OpenAI moderation, blocking)',
      'A GibberishValidator exists in code but is disabled (too many false positives on real research questions)',
      'If every validator is unavailable (e.g. an outage), this is now reported on GET /qa/health as a "degraded" status, instead of silently passing everything through unchecked',
    ],
  },
  {
    id: 'guardrails-output',
    title: { en: 'Output checks', de: 'Ausgabeprüfung' },
    slug: 'guardrails-output',
    categoryId: 'safety',
    icon: 'shield-check',
    summary: {
      en: 'Re-runs the same kind of checks on the answer the system is about to show you.',
      de: 'Führt dieselbe Art von Prüfung erneut durch — diesmal für die Antwort, die Ihnen gleich angezeigt wird.',
    },
    description: {
      en: 'A language model can occasionally produce something it shouldn\'t, even from a clean question. Before the final answer is shown, it goes through the same panel of checks one more time. A confirmed problem replaces the answer with a refusal; a milder concern is passed through with a visible warning attached instead of being silently hidden.',
      de: 'Ein Sprachmodell kann gelegentlich etwas Unerwünschtes erzeugen, selbst bei einer unbedenklichen Frage. Bevor die endgültige Antwort angezeigt wird, durchläuft sie dieselben Prüfungen noch einmal. Ein bestätigtes Problem ersetzt die Antwort durch eine Ablehnung; ein leichteres Bedenken wird mit einer sichtbaren Warnung durchgelassen, statt still verborgen zu werden.',
    },
    howItFits: {
      en: 'The last stop before an answer is saved and shown — nothing reaches the visitor unchecked.',
      de: 'Die letzte Station, bevor eine Antwort gespeichert und angezeigt wird — nichts erreicht den Besucher ungeprüft.',
    },
    talksTo: ['conversations-db', 'frontend-chat'],
    technicalDetails: [
      'backend/app/modules/guardrails/application/service.py — GuardrailsService.validate_output()',
      'Only ModerationValidator is "blocking" (replaces the answer); the others attach a warning instead',
    ],
  },

  // ----------------------------------------------------------- orchestration
  {
    id: 'retrieval-service',
    title: { en: 'Retrieval orchestrator', de: 'Retrieval-Orchestrator' },
    slug: 'retrieval-service',
    categoryId: 'orchestration',
    icon: 'git-branch',
    summary: {
      en: 'The central decision-maker: picks a knowledge source, gathers evidence, and hands it off to be written up.',
      de: 'Die zentrale Entscheidungsinstanz: wählt eine Wissensquelle, sammelt Belege und übergibt sie zur Ausformulierung.',
    },
    description: {
      en: 'Once a question passes the safety check, this is what actually runs it. It looks at which knowledge source you selected — ORKG (research contributions) or DBLP (publication search) — and routes the question down the matching path. Either path ends the same way: a set of retrieved facts ready to be turned into an answer.',
      de: 'Sobald eine Frage die Sicherheitsprüfung besteht, führt diese Komponente sie tatsächlich aus. Sie prüft, welche Wissensquelle ausgewählt wurde — ORKG (Forschungsbeiträge) oder DBLP (Publikationssuche) — und leitet die Frage auf den passenden Pfad. Beide Pfade enden gleich: mit einer Menge recherchierter Fakten, bereit zur Antwortformulierung.',
    },
    howItFits: {
      en: 'The hub everything else connects through — it is the one piece that knows both knowledge paths exist.',
      de: 'Der Knotenpunkt, über den alles andere läuft — die einzige Komponente, die beide Wissenspfade kennt.',
    },
    talksTo: ['graph-load', 'dblp-snapshot'],
    technicalDetails: [
      'backend/app/modules/qa/application/service.py — RetrievalService',
      'Composes HubLinkService (ORKG), DblpService (DBLP), and GuardrailsService directly',
      'POST /qa/ask and /qa/ask/stream (backend/app/modules/qa/api/router.py)',
    ],
  },

  // -------------------------------------------------------------------- orkg
  {
    id: 'graph-load',
    title: { en: 'ORKG graph loader', de: 'ORKG-Graph-Loader' },
    slug: 'graph-load',
    categoryId: 'orkg',
    icon: 'cloud-download',
    summary: {
      en: 'Loads the Open Research Knowledge Graph into memory once, so every question doesn\'t re-fetch it.',
      de: 'Lädt den Open Research Knowledge Graph einmalig in den Arbeitsspeicher, damit nicht jede Frage ihn erneut abrufen muss.',
    },
    description: {
      en: 'The Open Research Knowledge Graph (ORKG) is a public database of research contributions. Rather than call ORKG\'s servers on every single question, this loads a working copy into a local cache the first time it\'s needed, and keeps it warm for everyone after that.',
      de: 'Der Open Research Knowledge Graph (ORKG) ist eine öffentliche Datenbank mit Forschungsbeiträgen. Statt bei jeder einzelnen Frage die ORKG-Server anzufragen, wird beim ersten Bedarf eine Arbeitskopie in einen lokalen Cache geladen und danach für alle warmgehalten.',
    },
    howItFits: {
      en: 'The entry point of the ORKG path — everything else in this category reads from what this loads.',
      de: 'Der Einstiegspunkt des ORKG-Pfads — alles andere in dieser Kategorie liest aus dem, was hier geladen wird.',
    },
    talksTo: ['vector-store'],
    technicalDetails: [
      'backend/app/modules/graph_load/application/graph_load_service.py',
      'backend/app/modules/graph_load/infrastructure/orkg/graph_loader.py — local SQLite cache of the ORKG subgraph',
    ],
  },
  {
    id: 'vector-store',
    title: { en: 'Vector store (Chroma)', de: 'Vektor-Speicher (Chroma)' },
    slug: 'vector-store',
    categoryId: 'orkg',
    icon: 'layers',
    summary: {
      en: 'Turns contributions into searchable "meaning fingerprints" so a question can find relevant ones.',
      de: 'Verwandelt Beiträge in durchsuchbare „Bedeutungs-Fingerabdrücke“, damit eine Frage relevante davon finden kann.',
    },
    description: {
      en: 'Each contribution in ORKG is converted into an embedding — a numeric fingerprint of its meaning — and stored so that a question can be compared against thousands of contributions at once to find the closest matches, without reading every one individually.',
      de: 'Jeder Beitrag in ORKG wird in ein Embedding umgewandelt — einen numerischen Fingerabdruck seiner Bedeutung — und gespeichert, sodass eine Frage gleichzeitig mit Tausenden Beiträgen verglichen werden kann, um die nächstliegenden Treffer zu finden, ohne jeden einzeln zu lesen.',
    },
    howItFits: {
      en: 'Feeds the hub-by-hub retrieval engine its starting set of candidates.',
      de: 'Liefert der Hub-für-Hub-Retrieval-Engine ihre erste Menge an Kandidaten.',
    },
    talksTo: ['hublink-retriever'],
    technicalDetails: [
      'backend/app/modules/indexing/infrastructure/hublink/hub_store_service.py',
      'ChromaDB, rebuilt periodically by the background indexer',
    ],
  },
  {
    id: 'hublink-retriever',
    title: { en: 'HubLink retrieval engine', de: 'HubLink-Retrieval-Engine' },
    slug: 'hublink-retriever',
    categoryId: 'orkg',
    icon: 'share-2',
    summary: {
      en: 'Walks the knowledge graph hub by hub, deciding what\'s actually relevant to include.',
      de: 'Erschließt den Wissensgraphen Hub für Hub und entscheidet, was tatsächlich relevant ist.',
    },
    description: {
      en: 'Starting from the closest matches, this engine explores the graph outward — for each connected "hub" of information it finds, a separate judgment call decides whether to include it in the evidence or leave it out. This is also why the exact shape of the resulting graph can vary slightly between identical questions: each of those judgment calls is independent.',
      de: 'Ausgehend von den nächstliegenden Treffern erschließt diese Engine den Graphen nach außen — für jeden gefundenen, verbundenen Informations-„Hub“ entscheidet ein eigener Urteilsschritt, ob er in die Belege aufgenommen wird oder nicht. Deshalb kann die genaue Form des resultierenden Graphen bei identischen Fragen leicht variieren: Jeder dieser Urteilsschritte ist unabhängig.',
    },
    howItFits: {
      en: 'Produces the final evidence set that gets written up as an answer, plus the graph you see visualized.',
      de: 'Erzeugt die endgültigen Belege, aus denen die Antwort formuliert wird, sowie den visualisierten Graphen.',
    },
    talksTo: ['answer-generator'],
    technicalDetails: [
      'HublinkImplementation — a separately-packaged retrieval library',
      'CandidateHubFinder → per-hub include/drop decisions → final hub set',
      'backend/app/modules/qa/infrastructure/hublink/hublink_service.py',
    ],
  },

  // ------------------------------------------------------------------- dblp
  {
    id: 'dblp-snapshot',
    title: { en: 'DBLP local snapshot', de: 'Lokaler DBLP-Snapshot' },
    slug: 'dblp-snapshot',
    categoryId: 'dblp',
    icon: 'hard-drive',
    summary: {
      en: 'A full, pre-downloaded copy of DBLP — 8.77 million publications — stored locally, not queried live.',
      de: 'Eine vollständige, vorab heruntergeladene Kopie von DBLP — 8,77 Millionen Publikationen — lokal gespeichert, nicht live abgefragt.',
    },
    description: {
      en: 'DBLP is the standard bibliography of computer-science publications. Rather than depend on DBLP\'s live servers for every question, the whole thing is downloaded once into a local database and refreshed periodically, so lookups are fast and don\'t depend on an outside service being up.',
      de: 'DBLP ist die Standardbibliografie für Informatik-Publikationen. Statt bei jeder Frage auf die Live-Server von DBLP angewiesen zu sein, wird die gesamte Datenbank einmalig lokal heruntergeladen und regelmäßig aktualisiert, sodass Abfragen schnell sind und nicht von der Verfügbarkeit eines externen Dienstes abhängen.',
    },
    howItFits: {
      en: 'Where every DBLP-path question starts.',
      de: 'Hier beginnt jede Frage auf dem DBLP-Pfad.',
    },
    talksTo: ['dblp-query-planner'],
    technicalDetails: [
      'backend/app/modules/dblp/infrastructure/dblp_local_store.py — DblpLocalStore',
      'backend/app/modules/dblp/infrastructure/dblp_snapshot_builder.py — the rebuild job',
      'Local SQLite at /dblp-data/dblp.db — not a live SPARQL endpoint',
    ],
  },
  {
    id: 'dblp-query-planner',
    title: { en: 'Query planner', de: 'Abfrageplaner' },
    slug: 'dblp-query-planner',
    categoryId: 'dblp',
    icon: 'list-checks',
    summary: {
      en: 'Turns a plain-language question into a precise lookup against the publication database.',
      de: 'Verwandelt eine Frage in natürlicher Sprache in eine präzise Abfrage gegen die Publikationsdatenbank.',
    },
    description: {
      en: 'Figures out what the question is actually asking for — a specific author\'s papers, a venue, a topic, a date range — and turns that into a structured query the local database can run directly.',
      de: 'Ermittelt, wonach die Frage tatsächlich fragt — die Paper eines bestimmten Autors, ein Venue, ein Thema, einen Zeitraum — und erstellt daraus eine strukturierte Abfrage, die die lokale Datenbank direkt ausführen kann.',
    },
    howItFits: {
      en: 'The translation step between "what you asked" and "what gets looked up".',
      de: 'Der Übersetzungsschritt zwischen „was Sie gefragt haben“ und „was nachgeschlagen wird“.',
    },
    talksTo: ['dblp-graph-builder'],
    technicalDetails: ['backend/app/modules/dblp/application/query_planner.py — DblpQueryPlan'],
  },
  {
    id: 'dblp-graph-builder',
    title: { en: 'Graph builder', de: 'Graph-Builder' },
    slug: 'dblp-graph-builder',
    categoryId: 'dblp',
    icon: 'network',
    summary: {
      en: 'Turns the raw query results into a small knowledge graph of authors, papers, and venues.',
      de: 'Verwandelt die rohen Abfrageergebnisse in einen kleinen Wissensgraphen aus Autoren, Papers und Venues.',
    },
    description: {
      en: 'Takes the matching publications and connects them into a graph — who wrote what, where it was published — so the result can be visualized the same way an ORKG answer is, even though it came from a completely different source.',
      de: 'Nimmt die passenden Publikationen und verbindet sie zu einem Graphen — wer hat was geschrieben, wo wurde es veröffentlicht —, sodass das Ergebnis genauso visualisiert werden kann wie eine ORKG-Antwort, obwohl es aus einer völlig anderen Quelle stammt.',
    },
    howItFits: {
      en: 'The DBLP path\'s equivalent of the HubLink retrieval engine: it\'s what gets handed to the answer writer.',
      de: 'Das Gegenstück der HubLink-Retrieval-Engine auf dem DBLP-Pfad: Das wird an die Antworterstellung übergeben.',
    },
    talksTo: ['answer-generator'],
    technicalDetails: [
      'backend/app/modules/dblp/application/graph_builder.py',
      'backend/app/modules/dblp/application/publications.py — PublicationSummary',
      'backend/app/modules/dblp/application/conversation_answerer.py — ConversationAnswerer (handles DBLP follow-up questions)',
    ],
  },

  // ------------------------------------------------------------ generation
  {
    id: 'answer-generator',
    title: { en: 'Answer generator', de: 'Antwortgenerator' },
    slug: 'answer-generator',
    categoryId: 'generation',
    icon: 'pen-line',
    summary: {
      en: 'The language-model call that actually writes the final answer, with citations.',
      de: 'Der Sprachmodell-Aufruf, der die endgültige Antwort mit Quellenangaben tatsächlich verfasst.',
    },
    description: {
      en: 'Takes whichever evidence was gathered — from ORKG or DBLP — and asks a language model to write a clear, cited answer from it. For DBLP this is a single, focused call (part of why DBLP answers tend to stay very consistent between identical questions); for ORKG it builds on the many small relevance decisions made earlier in the HubLink engine.',
      de: 'Nimmt die gesammelten Belege — aus ORKG oder DBLP — und lässt ein Sprachmodell daraus eine klare Antwort mit Quellenangaben formulieren. Bei DBLP ist dies ein einzelner, fokussierter Aufruf (einer der Gründe, warum DBLP-Antworten bei identischen Fragen sehr konsistent bleiben); bei ORKG baut er auf den vielen kleinen Relevanzentscheidungen der HubLink-Engine auf.',
    },
    howItFits: {
      en: 'Where retrieved facts become the words you actually read.',
      de: 'Hier werden recherchierte Fakten zu den Worten, die Sie tatsächlich lesen.',
    },
    talksTo: ['llm-config', 'guardrails-output'],
    technicalDetails: [
      'backend/app/modules/dblp/application/answer_generator.py (DBLP) and the equivalent inside HublinkImplementation (ORKG)',
      'backend/app/modules/dblp/application/citation_footer.py — formats the citation list shown under an answer',
      'Model + reasoning effort are configurable per question',
    ],
  },
  {
    id: 'llm-config',
    title: { en: 'LLM model registry', de: 'LLM-Modellregister' },
    slug: 'llm-config',
    categoryId: 'generation',
    icon: 'cpu',
    summary: {
      en: 'The list of language models available to answer with, and their settings.',
      de: 'Die Liste der verfügbaren Sprachmodelle für Antworten sowie deren Einstellungen.',
    },
    description: {
      en: 'Keeps track of which language models are configured (e.g. different OpenAI models), what provider each comes from, and tuning settings like reasoning effort. The chat interface lets you pick a model from this list.',
      de: 'Verwaltet, welche Sprachmodelle konfiguriert sind (z. B. verschiedene OpenAI-Modelle), von welchem Anbieter sie stammen, und Feineinstellungen wie den Reasoning Effort. Die Chat-Oberfläche lässt Sie ein Modell aus dieser Liste wählen.',
    },
    howItFits: {
      en: 'Consulted by the answer generator to know which model to actually call, and how.',
      de: 'Wird vom Antwortgenerator befragt, welches Modell tatsächlich aufgerufen werden soll und wie.',
    },
    talksTo: [],
    technicalDetails: [
      'backend/app/config/llm/llm_config_registry.py',
      'backend/app/config/llm/llm_configs.json',
      'GET /qa/llm-models',
    ],
  },

  // ------------------------------------------------------------- visualize
  {
    id: 'graph-explore',
    title: { en: 'Graph explorer (backend)', de: 'Graph-Explorer (Backend)' },
    slug: 'graph-explore',
    categoryId: 'visualize',
    icon: 'search',
    summary: {
      en: 'Looks up a node\'s neighbors on demand, when you click to expand it in the graph view.',
      de: 'Sucht die Nachbarn eines Knotens bei Bedarf, wenn Sie ihn in der Graphansicht zum Erweitern anklicken.',
    },
    description: {
      en: 'The graph shown after an answer isn\'t always the whole picture — clicking a node to "expand" it asks the backend for that node\'s immediate neighbors in the ORKG graph, so you can explore outward from any point of interest.',
      de: 'Der nach einer Antwort gezeigte Graph ist nicht immer das vollständige Bild — das Anklicken eines Knotens zum „Erweitern“ fragt das Backend nach dessen unmittelbaren Nachbarn im ORKG-Graphen, sodass Sie von jedem interessanten Punkt aus weiter erkunden können.',
    },
    howItFits: {
      en: 'Powers the "expand a node" interaction in the graph view, separately from the original answer.',
      de: 'Treibt die „Knoten erweitern“-Interaktion in der Graphansicht an, unabhängig von der ursprünglichen Antwort.',
    },
    talksTo: [],
    technicalDetails: [
      'backend/app/modules/graph_explore/application/graph_explore_service.py',
      'GET /graph/node-neighbors',
    ],
  },
  {
    id: 'graph-view',
    title: { en: 'Graph / Table / Chart views', de: 'Graph-/Tabellen-/Diagrammansicht' },
    slug: 'graph-view',
    categoryId: 'visualize',
    icon: 'chart-column',
    summary: {
      en: 'Three different ways to look at the same evidence: a node graph, a sortable/filterable table, or charts.',
      de: 'Drei verschiedene Ansichten derselben Belege: ein Knotengraph, eine sortier-/filterbare Tabelle oder Diagramme.',
    },
    description: {
      en: 'The evidence behind an answer can be read as an interactive force-directed graph (drag, search, expand nodes), a table with logical AND/OR/NOT filters and sortable columns, or one of five chart types (bar, donut, bubble, line, stacked bar) for a more statistical view of the same data. All three stay in sync and can be exported as SVG or CSV.',
      de: 'Die Belege hinter einer Antwort lassen sich als interaktiver kräftebasierter Graph lesen (ziehen, suchen, Knoten erweitern), als Tabelle mit logischen UND/ODER/NICHT-Filtern und sortierbaren Spalten, oder als einer von fünf Diagrammtypen (Balken, Donut, Blasen, Linie, gestapelte Balken) für eine statistischere Sicht auf dieselben Daten. Alle drei bleiben synchron und lassen sich als SVG oder CSV exportieren.',
    },
    howItFits: {
      en: 'The visitor-facing payoff of everything upstream — this is what "seeing the evidence" actually looks like.',
      de: 'Der für Besucher sichtbare Ertrag von allem Vorherigen — so sieht „die Belege sehen“ konkret aus.',
    },
    talksTo: [],
    technicalDetails: [
      'frontend/src/components/graph/ — NodeGraphPanel, GraphTable, GraphChart',
      'D3 force simulation for the graph view; @xenova/transformers in a Web Worker for client-side semantic search',
    ],
  },

  // ------------------------------------------------------------------ data
  {
    id: 'conversations-db',
    title: { en: 'Conversation history', de: 'Gesprächsverlauf' },
    slug: 'conversations-db',
    categoryId: 'data',
    icon: 'database',
    summary: {
      en: 'Every question and answer, saved per visitor (or account, once signed in).',
      de: 'Jede Frage und Antwort, gespeichert pro Besucher (oder Konto, nach Anmeldung).',
    },
    description: {
      en: 'Each exchange is saved so a conversation can be continued later, revisited, or deleted. Scoped to the anonymous visitor id until login, then to the signed-in account.',
      de: 'Jeder Austausch wird gespeichert, damit eine Unterhaltung später fortgesetzt, erneut aufgerufen oder gelöscht werden kann. Bis zur Anmeldung an die anonyme Besucher-ID gebunden, danach an das angemeldete Konto.',
    },
    howItFits: {
      en: 'Where "your chat history" actually lives between visits.',
      de: 'Hier lebt „Ihr Chatverlauf“ tatsächlich zwischen den Besuchen.',
    },
    talksTo: [],
    technicalDetails: [
      'backend/app/modules/conversations/infrastructure/database/conversation_repo.py',
      'SQLite — backend/data/hublink.db',
      'GET/POST/DELETE /conversations',
    ],
  },
  {
    id: 'request-log',
    title: { en: 'Request log', de: 'Anfragenprotokoll' },
    slug: 'request-log',
    categoryId: 'data',
    icon: 'scroll-text',
    summary: {
      en: 'A record of every API call: which endpoint, how long it took, and whether it succeeded.',
      de: 'Ein Protokoll jedes API-Aufrufs: welcher Endpunkt, wie lange er dauerte und ob er erfolgreich war.',
    },
    description: {
      en: 'Every request to the backend is timed and recorded — which visitor, which endpoint, how long it took, what status code came back. This is pure operational data, not conversation content.',
      de: 'Jede Anfrage an das Backend wird zeitlich erfasst und protokolliert — welcher Besucher, welcher Endpunkt, wie lange es dauerte, welcher Statuscode zurückkam. Dies sind reine Betriebsdaten, kein Gesprächsinhalt.',
    },
    howItFits: {
      en: 'Quietly fed by every request; read back out by the admin stats endpoint.',
      de: 'Wird im Hintergrund von jeder Anfrage gespeist; wird vom Admin-Statistik-Endpunkt wieder ausgelesen.',
    },
    talksTo: ['stats'],
    technicalDetails: [
      'backend/app/modules/conversations/infrastructure/database/models.py — RequestLogModel',
      'Populated by a request-timing middleware in backend/app/main.py',
    ],
  },
  {
    id: 'stats',
    title: { en: 'Usage stats (admin)', de: 'Nutzungsstatistik (Admin)' },
    slug: 'stats',
    categoryId: 'data',
    icon: 'chart-bar',
    summary: {
      en: 'An admin-only dashboard of request volume and performance, built from the request log.',
      de: 'Ein nur für Administratoren zugängliches Dashboard zu Anfragevolumen und Performance, aufgebaut aus dem Anfragenprotokoll.',
    },
    description: {
      en: 'Aggregates the request log into a summary — how many requests, how fast, how many failed — for whoever administers the deployment. Protected by a secret key, not shown to regular visitors.',
      de: 'Fasst das Anfragenprotokoll zu einer Übersicht zusammen — wie viele Anfragen, wie schnell, wie viele fehlgeschlagen — für die Administration der Bereitstellung. Durch einen geheimen Schlüssel geschützt, normalen Besuchern nicht sichtbar.',
    },
    howItFits: {
      en: 'The one place all that quiet request-logging becomes visible to a human.',
      de: 'Der einzige Ort, an dem das stille Protokollieren von Anfragen für Menschen sichtbar wird.',
    },
    talksTo: [],
    technicalDetails: [
      'backend/app/modules/stats/infrastructure/repository.py — StatsRepository',
      'GET /stats, header X-Stats-Key',
    ],
  },

  // ------------------------------------------------------------ background
  {
    id: 'indexing-service',
    title: { en: 'Background indexer', de: 'Hintergrund-Indexer' },
    slug: 'indexing-service',
    categoryId: 'background',
    icon: 'refresh-cw',
    summary: {
      en: 'Periodically rebuilds the ORKG search index, so new contributions become findable without a restart.',
      de: 'Baut den ORKG-Suchindex regelmäßig neu auf, damit neue Beiträge auffindbar werden, ohne einen Neustart zu benötigen.',
    },
    description: {
      en: 'Runs on a timer in the background, independent of any one visitor\'s question: re-loads the latest ORKG graph data and refreshes the embeddings used for search, keeping answers from going stale as ORKG itself changes.',
      de: 'Läuft zeitgesteuert im Hintergrund, unabhängig von der Frage eines einzelnen Besuchers: lädt die neuesten ORKG-Graphdaten erneut und aktualisiert die für die Suche verwendeten Embeddings, damit Antworten nicht veralten, während sich ORKG selbst verändert.',
    },
    howItFits: {
      en: 'Keeps the ORKG path\'s graph loader and vector store up to date — invisible unless it falls behind.',
      de: 'Hält den Graph-Loader und Vektor-Speicher des ORKG-Pfads aktuell — unsichtbar, außer wenn er in Rückstand gerät.',
    },
    talksTo: ['graph-load', 'vector-store'],
    technicalDetails: [
      'backend/app/modules/indexing/application/service.py — IndexingService',
      'POST /indexing/trigger_run, GET /indexing/status',
    ],
  },

  // -------------------------------------------------------------- identity
  {
    id: 'auth-service',
    title: { en: 'ORCID / NFDI login', de: 'ORCID-/NFDI-Anmeldung' },
    slug: 'auth-service',
    categoryId: 'identity',
    icon: 'key-round',
    summary: {
      en: 'Lets a visitor sign in with an ORCID iD or an NFDI (Helmholtz AAI) account.',
      de: 'Ermöglicht die Anmeldung mit einer ORCID-iD oder einem NFDI-Konto (Helmholtz AAI).',
    },
    description: {
      en: 'Signing in links your research identity (ORCID) or institutional identity (NFDI) to a account on this app. If you had an anonymous conversation history before logging in, it\'s carried over to your new account automatically. You can link both providers to the same account.',
      de: 'Die Anmeldung verknüpft Ihre Forschungsidentität (ORCID) oder institutionelle Identität (NFDI) mit einem Konto in dieser App. Hatten Sie vor der Anmeldung bereits einen anonymen Gesprächsverlauf, wird dieser automatisch auf Ihr neues Konto übertragen. Beide Anbieter lassen sich mit demselben Konto verknüpfen.',
    },
    howItFits: {
      en: 'Upgrades an anonymous visitor into a recognized account, and claims their prior history.',
      de: 'Macht aus einem anonymen Besucher ein erkanntes Konto und übernimmt dessen bisherigen Verlauf.',
    },
    talksTo: ['conversations-db'],
    technicalDetails: [
      'backend/app/modules/auth/ — OrcidOAuthService, NfdiOAuthService, AccountService',
      'GET /auth/{provider}/login, /auth/{provider}/callback, /auth/me, POST /auth/logout',
      'Session: a signed cookie, 30-day expiry',
    ],
  },
];
