import type { LocalizedString } from './types';

/** The product name — identical in both languages (a proper noun, not
 * translated), so it's a plain constant rather than a LocalizedString. */
export const APP_NAME = 'SciGraphChat';

/** Every piece of hardcoded UI chrome text (not diagram content) — topbar,
 * buttons, panel section labels, empty states, the glossary header. */
export const ui = {
  resetLayout: { en: 'Reset layout', de: 'Layout zurücksetzen' },
  toggleDarkMode: { en: 'Toggle dark mode', de: 'Dunkelmodus umschalten' },
  languageSelectorLabel: { en: 'Language', de: 'Sprache' },

  introP1: {
    en: '<strong>SciGraphChat</strong> answers research questions by retrieving real evidence first, then asking a language model to write the answer from that evidence — not from memory alone. This page is a map of that process: every box below is a real, running part of the system, not a simplified stand-in.',
    de: '<strong>SciGraphChat</strong> beantwortet Forschungsfragen, indem zuerst echte Belege recherchiert werden und anschließend ein Sprachmodell die Antwort aus diesen Belegen formuliert — nicht allein aus seinem Gedächtnis. Diese Seite zeigt genau diesen Ablauf: Jeder Kasten unten ist ein echter, laufender Teil des Systems, kein vereinfachtes Platzhalterbild.',
  },
  introP2: {
    en: 'Two independent knowledge sources feed into the same pipeline: the <strong><a href="https://orkg.org/" target="_blank" rel="noopener noreferrer">Open Research Knowledge Graph (ORKG)</a></strong> for research contributions, and <strong><a href="https://dblp.org/" target="_blank" rel="noopener noreferrer">DataBase systems &amp; Logic Programming (DBLP)</a></strong> for publication search. A question is routed to whichever one you\'ve selected, and both paths converge back into the same answer-writing and safety-checking steps.',
    de: 'Zwei unabhängige Wissensquellen speisen dieselbe Pipeline: der <strong><a href="https://orkg.org/" target="_blank" rel="noopener noreferrer">Open Research Knowledge Graph (ORKG)</a></strong> für Forschungsbeiträge und <strong><a href="https://dblp.org/" target="_blank" rel="noopener noreferrer">DataBase systems &amp; Logic Programming (DBLP)</a></strong> für die Publikationssuche. Eine Frage wird an die jeweils ausgewählte Quelle weitergeleitet, und beide Wege münden anschließend in dieselben Schritte zur Antworterstellung und Sicherheitsprüfung.',
  },
  introP3: {
    en: 'Pick a step below to follow one question end to end, or click any box to see exactly what it does, what it depends on, and what depends on it (hovering or focusing a box also previews its connections, drawn as arrows). Boxes can be dragged to rearrange them — your layout is remembered. Unfamiliar term? Check the <a href="#glossary">glossary</a> at the bottom.',
    de: 'Wählen Sie unten einen Schritt, um eine Frage vollständig zu verfolgen, oder klicken Sie auf einen Kasten, um genau zu sehen, was er tut, wovon er abhängt und was von ihm abhängt (Überfahren mit der Maus oder Fokussieren zeigt die Verbindungen als Pfeile in der Vorschau). Kästen lassen sich per Drag &amp; Drop anordnen — Ihr Layout wird gespeichert. Unbekannter Begriff? Im <a href="#glossary">Glossar</a> unten nachschlagen.',
  },
  legendSolid: {
    en: 'Solid — a direct call, as part of handling one request',
    de: 'Durchgezogen — ein direkter Aufruf, Teil der Bearbeitung einer Anfrage',
  },
  legendDashed: {
    en: 'Dashed — a background or cross-cutting relationship, not tied to one request',
    de: 'Gestrichelt — eine Hintergrund- oder übergreifende Beziehung, nicht an eine Anfrage gebunden',
  },

  stepperAriaLabel: {
    en: 'Follow a question through the system, step by step',
    de: 'Eine Frage Schritt für Schritt durch das System verfolgen',
  },

  panelRegionLabel: { en: 'Box details', de: 'Kastendetails' },
  panelEmpty: {
    en: 'Click any box to see what it does, what it talks to, and what depends on it.',
    de: 'Klicken Sie auf einen Kasten, um zu sehen, was er tut, womit er kommuniziert und was von ihm abhängt.',
  },
  panelClose: { en: 'Close details', de: 'Details schließen' },
  panelHowItFits: { en: 'How it fits in the flow', de: 'Rolle im Ablauf' },
  panelTalksTo: { en: 'Talks to / needs', de: 'Kommuniziert mit / benötigt' },
  panelUsedBy: { en: 'Used by', de: 'Wird verwendet von' },
  panelTechnicalDetails: { en: 'Technical details', de: 'Technische Details' },

  glossaryTitle: { en: 'Glossary', de: 'Glossar' },
  glossaryIntro: {
    en: 'Terms used throughout the boxes above, in plain language. Terms with a "→ show in diagram" link jump back up to that box.',
    de: 'Begriffe, die in den Kästen oben verwendet werden, einfach erklärt. Begriffe mit dem Link „→ im Diagramm zeigen“ springen zurück zu diesem Kasten.',
  },
  glossaryShowInDiagram: { en: 'show in diagram', de: 'im Diagramm zeigen' },

  aboutThisPage: { en: 'About this page', de: 'Über diese Seite' },
} satisfies Record<string, LocalizedString>;
