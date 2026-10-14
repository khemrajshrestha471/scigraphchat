import type { GlossaryTerm } from './types';

export const glossary: GlossaryTerm[] = [
  {
    term: { en: 'ORKG', de: 'ORKG' },
    definition: {
      en: 'The Open Research Knowledge Graph — a public database that describes research contributions (claims, methods, results) as structured, connected data, not just PDF text.',
      de: 'Der Open Research Knowledge Graph — eine öffentliche Datenbank, die Forschungsbeiträge (Thesen, Methoden, Ergebnisse) als strukturierte, vernetzte Daten beschreibt, nicht nur als PDF-Text.',
    },
    relatedNodeId: 'graph-load',
    externalUrl: 'https://orkg.org/',
  },
  {
    term: { en: 'DBLP', de: 'DBLP' },
    definition: {
      en: 'DataBase systems & Logic Programming — the standard bibliography of computer-science publications: who wrote what, published where, and when.',
      de: 'DataBase systems & Logic Programming — die Standardbibliografie für Informatik-Publikationen: wer was geschrieben hat, wo und wann veröffentlicht.',
    },
    relatedNodeId: 'dblp-snapshot',
    externalUrl: 'https://dblp.org/',
  },
  {
    term: { en: 'Knowledge graph', de: 'Wissensgraph' },
    definition: {
      en: 'Facts stored as connected nodes (e.g. a paper, an author, a method) and edges between them, rather than plain text — lets you ask "what connects to this?" directly.',
      de: 'Fakten, gespeichert als verbundene Knoten (z. B. ein Paper, ein Autor, eine Methode) mit Kanten dazwischen, statt als reiner Text — erlaubt direkt die Frage „Was ist damit verbunden?“.',
    },
    relatedNodeId: 'dblp-graph-builder',
  },
  {
    term: { en: 'Embedding / vector', de: 'Embedding / Vektor' },
    definition: {
      en: 'A numeric fingerprint of a piece of text\'s meaning. Comparing fingerprints lets a computer find "similar" text quickly, without reading everything.',
      de: 'Ein numerischer Fingerabdruck der Bedeutung eines Textes. Der Vergleich solcher Fingerabdrücke lässt einen Computer schnell „ähnlichen“ Text finden, ohne alles zu lesen.',
    },
    relatedNodeId: 'vector-store',
  },
  {
    term: { en: 'LLM', de: 'LLM' },
    definition: {
      en: 'Large Language Model — the kind of AI model (e.g. GPT) that reads retrieved evidence and writes the final answer in plain language.',
      de: 'Large Language Model — die Art von KI-Modell (z. B. GPT), das recherchierte Belege liest und die endgültige Antwort in natürlicher Sprache formuliert.',
    },
    relatedNodeId: 'llm-config',
  },
  {
    term: { en: 'Guardrails', de: 'Guardrails (Schutzmechanismen)' },
    definition: {
      en: 'Automated checks that screen a question or an answer for unsafe or abusive content before it goes any further.',
      de: 'Automatisierte Prüfungen, die eine Frage oder Antwort auf unsichere oder missbräuchliche Inhalte untersuchen, bevor es weitergeht.',
    },
    relatedNodeId: 'guardrails-input',
  },
  {
    term: { en: 'Retrieval', de: 'Retrieval (Recherche)' },
    definition: {
      en: 'The step of finding the actual facts relevant to a question, before any answer is written — "look it up" rather than "make it up".',
      de: 'Der Schritt, bei dem die tatsächlich relevanten Fakten zu einer Frage gefunden werden, bevor eine Antwort geschrieben wird — nachschlagen statt erfinden.',
    },
    relatedNodeId: 'retrieval-service',
  },
  {
    term: { en: 'HubLink', de: 'HubLink' },
    definition: {
      en: 'This project\'s own retrieval engine for ORKG — walks the knowledge graph outward from the closest matches, hub by hub.',
      de: 'Die projekteigene Retrieval-Engine für ORKG — erschließt den Wissensgraphen ausgehend von den nächstliegenden Treffern Hub für Hub.',
    },
    relatedNodeId: 'hublink-retriever',
  },
  {
    term: { en: 'Citation', de: 'Zitation' },
    definition: {
      en: 'A reference back to the original source (a paper, a DBLP record) that supports a sentence in the answer, so you can verify it yourself.',
      de: 'Ein Verweis auf die Originalquelle (ein Paper, ein DBLP-Eintrag), der einen Satz der Antwort belegt, sodass Sie ihn selbst überprüfen können.',
    },
    relatedNodeId: 'answer-generator',
  },
  {
    term: { en: 'OAuth', de: 'OAuth' },
    definition: {
      en: 'A standard way to sign in using an account you already have elsewhere (here: ORCID or NFDI) without sharing your password with this app.',
      de: 'Ein Standardverfahren zur Anmeldung mit einem bereits bestehenden Konto (hier: ORCID oder NFDI), ohne dieser App das Passwort mitzuteilen.',
    },
    relatedNodeId: 'auth-service',
  },
  {
    term: { en: 'ORCID', de: 'ORCID' },
    definition: {
      en: 'A free, unique identifier for researchers — like a permanent username for your publication record, usable to sign in here.',
      de: 'Eine kostenlose, eindeutige Kennung für Forschende — wie ein dauerhafter Benutzername für die eigene Publikationshistorie, auch zur Anmeldung hier nutzbar.',
    },
    relatedNodeId: 'auth-service',
  },
  {
    term: { en: 'NFDI', de: 'NFDI' },
    definition: {
      en: 'Nationale Forschungsdateninfrastruktur — a German research-data infrastructure initiative; its Helmholtz AAI login is the other supported sign-in option.',
      de: 'Nationale Forschungsdateninfrastruktur — eine deutsche Initiative für Forschungsdateninfrastruktur; ihre Helmholtz-AAI-Anmeldung ist die andere unterstützte Anmeldeoption.',
    },
    relatedNodeId: 'auth-service',
  },
  {
    term: { en: 'Session cookie', de: 'Sitzungs-Cookie' },
    definition: {
      en: 'A small signed piece of data your browser holds onto so the server recognizes you on your next request, without asking you to log in again every time.',
      de: 'Ein kleines, signiertes Datenstück, das Ihr Browser aufbewahrt, damit der Server Sie bei der nächsten Anfrage wiedererkennt, ohne Sie jedes Mal erneut anzumelden.',
    },
    relatedNodeId: 'anonymous-session',
  },
  {
    term: { en: 'Rate limiting', de: 'Rate Limiting (Anfragenbegrenzung)' },
    definition: {
      en: 'Capping how many requests one visitor can make in a short time, so one visitor can\'t run up the cost (or load) for everyone else.',
      de: 'Begrenzt, wie viele Anfragen ein Besucher in kurzer Zeit stellen kann, damit ein einzelner Besucher nicht die Kosten (oder Last) für alle anderen in die Höhe treibt.',
    },
    relatedNodeId: 'rate-limiter',
  },
  {
    term: { en: 'API', de: 'API' },
    definition: {
      en: 'Application Programming Interface — the defined set of requests the frontend is allowed to send to the backend (e.g. "ask a question", "get my history").',
      de: 'Application Programming Interface — die definierte Menge an Anfragen, die das Frontend an das Backend senden darf (z. B. „eine Frage stellen“, „meinen Verlauf abrufen“).',
    },
  },
];
