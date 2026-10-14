import type { Category } from './types';

export const categories: Category[] = [
  {
    id: 'access',
    title: { en: 'Access', de: 'Zugang' },
    description: { en: 'How a visitor reaches the system', de: 'Wie ein Besucher das System erreicht' },
    icon: 'door-open',
    color: '#2563eb',
  },
  {
    id: 'safety',
    title: { en: 'Safety checks', de: 'Sicherheitsprüfungen' },
    description: {
      en: 'Screens questions and answers for harmful content',
      de: 'Prüft Fragen und Antworten auf schädliche Inhalte',
    },
    icon: 'shield-check',
    color: '#e11d48',
  },
  {
    id: 'orchestration',
    title: { en: 'Question orchestration', de: 'Fragen-Orchestrierung' },
    description: {
      en: 'Decides where to look for the answer',
      de: 'Entscheidet, wo nach der Antwort gesucht wird',
    },
    icon: 'git-branch',
    color: '#d97706',
  },
  {
    id: 'orkg',
    title: { en: 'ORKG knowledge path', de: 'ORKG-Wissenspfad' },
    description: {
      en: 'Finds contributions in the Open Research Knowledge Graph',
      de: 'Findet Beiträge im Open Research Knowledge Graph',
    },
    icon: 'network',
    color: '#9333ea',
  },
  {
    id: 'dblp',
    title: { en: 'DBLP knowledge path', de: 'DBLP-Wissenspfad' },
    description: {
      en: 'Finds publications in the DBLP computer-science bibliography',
      de: 'Findet Publikationen in der DBLP-Bibliografie für Informatik',
    },
    icon: 'book-open',
    color: '#059669',
  },
  {
    id: 'generation',
    title: { en: 'Answer generation', de: 'Antwortgenerierung' },
    description: {
      en: 'Turns retrieved facts into a written answer with citations',
      de: 'Verwandelt recherchierte Fakten in eine schriftliche Antwort mit Quellenangaben',
    },
    icon: 'sparkles',
    color: '#db2777',
  },
  {
    id: 'visualize',
    title: { en: 'Visualize the graph', de: 'Den Graphen visualisieren' },
    description: {
      en: 'Lets the visitor explore the graph behind the answer',
      de: 'Lässt Besucher den Graphen hinter der Antwort erkunden',
    },
    icon: 'waypoints',
    color: '#0891b2',
  },
  {
    id: 'data',
    title: { en: 'Data & history', de: 'Daten & Verlauf' },
    description: {
      en: 'Where conversations and usage stats are stored',
      de: 'Wo Unterhaltungen und Nutzungsstatistiken gespeichert werden',
    },
    icon: 'database',
    color: '#64748b',
  },
  {
    id: 'background',
    title: { en: 'Keeping the index fresh', de: 'Den Index aktuell halten' },
    description: {
      en: 'A background job that keeps the knowledge graph searchable',
      de: 'Ein Hintergrundjob, der den Wissensgraphen durchsuchbar hält',
    },
    icon: 'refresh-cw',
    color: '#b45309',
  },
  {
    id: 'identity',
    title: { en: 'Sign-in & accounts', de: 'Anmeldung & Konten' },
    description: {
      en: 'ORCID / NFDI login and linking accounts',
      de: 'ORCID-/NFDI-Anmeldung und das Verknüpfen von Konten',
    },
    icon: 'key-round',
    color: '#4f46e5',
  },
];
