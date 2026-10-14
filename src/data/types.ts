export type Lang = 'en' | 'de';

/** Any user-facing text that needs both languages. Structural/relational
 * fields (ids, categoryId, talksTo, icon names, technicalDetails) stay as
 * plain strings — translating them would risk the id ↔ reference integrity
 * every other part of this app (edges, the glossary's relatedNodeId links,
 * the step-through narrator) depends on. */
export type LocalizedString = Record<Lang, string>;

/** A functional grouping of nodes, rendered as a bordered box with its own
 * accent color and icon — e.g. "Safety checks" or "Answer generation". */
export interface Category {
  id: string;
  title: LocalizedString;
  /** One short sentence shown under the category title. */
  description: LocalizedString;
  /** Lucide icon name (see src/render/icons.ts for the subset we ship). */
  icon: string;
  /** Accent color for this category's border/icon (a CSS color value). */
  color: string;
}

/** A single component in the flow. */
export interface FlowNode {
  id: string;
  title: LocalizedString;
  /** Short technical identifier shown under the title, e.g. "retrieval-service" —
   * a code-level name, deliberately not translated. */
  slug: string;
  categoryId: string;
  /** Lucide icon name. */
  icon: string;
  /** One bold sentence — the first thing a reader sees in the detail panel. */
  summary: LocalizedString;
  /** 2-4 sentences explaining what this does, in plain language. */
  description: LocalizedString;
  /** 1-3 sentences on how this fits into the overall request flow. */
  howItFits: LocalizedString;
  /** IDs of nodes this one calls / depends on. "usedBy" (the reverse) is
   * derived automatically — never entered twice. */
  talksTo: string[];
  /** Grounded, concrete implementation facts — file paths, real class names.
   * Shown only when the reader expands "Technical details". Deliberately
   * not translated: these are literal code references. */
  technicalDetails: string[];
}

/** One stop in the guided "follow a question" walkthrough. */
export interface FlowStep {
  id: string;
  title: LocalizedString;
  caption: LocalizedString;
  /** Node ids highlighted for this step, in the order the data moves through them. */
  nodeIds: string[];
}

export interface GlossaryTerm {
  term: LocalizedString;
  definition: LocalizedString;
  /** If this concept is also a box in the flow diagram above, its node id —
   * clicking the glossary card jumps to and selects that box. */
  relatedNodeId?: string;
  /** The term's own official site, if it has one (e.g. the real ORKG/DBLP
   * homepage) — rendered as a separate external link below the definition,
   * distinct from relatedNodeId's in-page jump. */
  externalUrl?: string;
}

/** Looks up the current language's text, falling back to English if a
 * translation is somehow missing rather than rendering a blank string. */
export function t(ls: LocalizedString, lang: Lang): string {
  return ls[lang] ?? ls.en;
}
