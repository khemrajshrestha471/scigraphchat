import type { FlowStep } from './types';

export const steps: FlowStep[] = [
  {
    id: 'ask',
    title: { en: '1. Ask a question', de: '1. Eine Frage stellen' },
    caption: {
      en: 'You type a question. Before anything else runs, the rate limiter checks you haven\'t asked too many questions too fast.',
      de: 'Sie geben eine Frage ein. Bevor irgendetwas anderes passiert, prüft der Rate-Limiter, ob nicht zu viele Fragen zu schnell gestellt wurden.',
    },
    nodeIds: ['frontend-chat', 'rate-limiter'],
  },
  {
    id: 'check-input',
    title: { en: '2. Check the question is safe', de: '2. Frage auf Sicherheit prüfen' },
    caption: {
      en: 'The question is screened for jailbreak attempts, toxic language, or clearly harmful requests.',
      de: 'Die Frage wird auf Jailbreak-Versuche, toxische Sprache oder eindeutig schädliche Anfragen geprüft.',
    },
    nodeIds: ['rate-limiter', 'guardrails-input'],
  },
  {
    id: 'decide',
    title: { en: '3. Decide where to look', de: '3. Entscheiden, wo gesucht wird' },
    caption: {
      en: 'The orchestrator routes your question down one of two knowledge paths, based on which source you picked.',
      de: 'Der Orchestrator leitet Ihre Frage je nach gewählter Quelle auf einen von zwei Wissenspfaden.',
    },
    nodeIds: ['guardrails-input', 'retrieval-service'],
  },
  {
    id: 'search-orkg',
    title: { en: '4a. Search ORKG', de: '4a. ORKG durchsuchen' },
    caption: {
      en: 'For research-contribution questions: load the graph, find the closest matches, and walk outward hub by hub.',
      de: 'Für Fragen zu Forschungsbeiträgen: Graph laden, nächstliegende Treffer finden und Hub für Hub nach außen erschließen.',
    },
    nodeIds: ['retrieval-service', 'graph-load', 'vector-store', 'hublink-retriever'],
  },
  {
    id: 'search-dblp',
    title: { en: '4b. Search DBLP', de: '4b. DBLP durchsuchen' },
    caption: {
      en: 'For publication-search questions: plan a precise query against the local DBLP snapshot and build a small graph from the results.',
      de: 'Für Publikationssuchen: eine präzise Abfrage gegen den lokalen DBLP-Snapshot planen und aus den Ergebnissen einen kleinen Graphen erstellen.',
    },
    nodeIds: ['retrieval-service', 'dblp-snapshot', 'dblp-query-planner', 'dblp-graph-builder'],
  },
  {
    id: 'write',
    title: { en: '5. Write the answer', de: '5. Die Antwort verfassen' },
    caption: {
      en: 'Whichever path ran, the gathered evidence is handed to a language model to write a cited answer.',
      de: 'Unabhängig vom gewählten Pfad werden die gesammelten Belege an ein Sprachmodell übergeben, das eine Antwort mit Quellenangaben verfasst.',
    },
    nodeIds: ['hublink-retriever', 'dblp-graph-builder', 'answer-generator', 'llm-config'],
  },
  {
    id: 'check-output',
    title: { en: '6. Check the answer is safe', de: '6. Antwort auf Sicherheit prüfen' },
    caption: {
      en: 'The generated answer is screened one more time before anyone sees it.',
      de: 'Die generierte Antwort wird ein weiteres Mal geprüft, bevor sie jemand zu sehen bekommt.',
    },
    nodeIds: ['answer-generator', 'guardrails-output'],
  },
  {
    id: 'deliver',
    title: { en: '7. Save & show the result', de: '7. Speichern & Ergebnis anzeigen' },
    caption: {
      en: 'The exchange is saved to your conversation history, and the answer appears in the chat.',
      de: 'Der Austausch wird im Gesprächsverlauf gespeichert, und die Antwort erscheint im Chat.',
    },
    nodeIds: ['guardrails-output', 'conversations-db', 'frontend-chat'],
  },
  {
    id: 'explore',
    title: { en: '8. Explore the graph', de: '8. Den Graphen erkunden' },
    caption: {
      en: 'The evidence behind the answer can be explored as a graph, a table, or charts — and expanded node by node.',
      de: 'Die Belege hinter der Antwort lassen sich als Graph, Tabelle oder Diagramm erkunden — und Knoten für Knoten erweitern.',
    },
    nodeIds: ['frontend-chat', 'graph-view', 'graph-explore'],
  },
];
