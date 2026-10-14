import { categories } from '../data/categories';
import { nodes } from '../data/nodes';
import { t, type Lang } from '../data/types';
import { icon } from './icons';

/** Where each category box sits in a logical grid (col, row) — roughly
 * following the story order: entry → the two parallel knowledge paths →
 * writing the answer → showing it → supporting systems underneath. */
const GRID: Record<string, { col: number; row: number }> = {
  access: { col: 0, row: 0 },
  safety: { col: 1, row: 0 },
  orchestration: { col: 2, row: 0 },
  identity: { col: 3, row: 0 },

  orkg: { col: 0, row: 1 },
  dblp: { col: 1, row: 1 },
  generation: { col: 2, row: 1 },
  visualize: { col: 3, row: 1 },

  data: { col: 0, row: 2 },
  background: { col: 1, row: 2 },
};

// Compact-but-not-cramped sizing: fits a typical laptop viewport (minus the
// detail panel) with little to no horizontal scrolling, while using a bit
// more of the available width on larger screens than the tightest possible
// fit would (see the (max-width: 860px) breakpoint in style.css for the
// separate, much-smaller-screen stacked layout instead).
export const CARD_WIDTH = 215;
export const CARD_HEIGHT = 46;
export const CARD_GAP = 6;
/** Fallback only — real header height is measured per category by
 * measureCategoryHeaderHeights() below, since descriptions of different
 * lengths wrap to different numbers of lines and a single fixed height
 * either clips long ones or wastes space on short ones. */
export const CATEGORY_HEADER_H = 46;
export const CATEGORY_PAD = 10;
export const COL_WIDTH = 245;
export const COL_GAP = 20;
export const ROW_GAP = 26;

export interface CategoryBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Renders each category's header (icon + title + description) off-screen
 * using the exact same markup/classes as the real render, measures its
 * actual height once the browser has applied the real CSS and wrapped the
 * text, then removes it. Returns {categoryId: measuredHeightPx}, so a long
 * description that wraps to 3 lines gets 3 lines' worth of room instead of
 * overlapping the node card below it (and a short one-line description
 * doesn't waste vertical space it doesn't need). Must run in a browser
 * (needs layout/measurement), not in computeDefaultLayout itself, which
 * stays a plain function so it's still easy to unit-test. */
export function measureCategoryHeaderHeights(lang: Lang): Record<string, number> {
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  probe.style.left = '-9999px';
  probe.style.top = '0';
  probe.className = 'category-box';
  probe.style.width = `${COL_WIDTH}px`;
  probe.style.height = 'auto';
  document.body.appendChild(probe);

  const heights: Record<string, number> = {};
  for (const cat of categories) {
    probe.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'category-box__header';
    header.appendChild(icon(cat.icon, 17));
    const textWrap = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'category-box__title';
    title.textContent = t(cat.title, lang);
    const desc = document.createElement('div');
    desc.className = 'category-box__desc';
    desc.textContent = t(cat.description, lang);
    textWrap.append(title, desc);
    header.appendChild(textWrap);
    probe.appendChild(header);
    // header's own height + the category-box's own top padding + the
    // header's bottom margin — i.e. exactly how far down this category's
    // first node card needs to start, matching .category-box's p-2 and
    // .category-box__header's mb-1.5 in src/style.css.
    const PAD_TOP = 8;
    const HEADER_MARGIN_BOTTOM = 6;
    heights[cat.id] = header.offsetHeight + PAD_TOP + HEADER_MARGIN_BOTTOM;
  }

  document.body.removeChild(probe);
  return heights;
}

/** Computes the default (non-dragged) layout: each category's box size from
 * its node count and measured header height, then category boxes placed on
 * the logical grid with each row's height set by its tallest category.
 * Returns absolute pixel positions for every category box and every node
 * card within it. */
export function computeDefaultLayout(headerHeights: Record<string, number> = {}): {
  categoryBoxes: CategoryBox[];
  nodePositions: NodePosition[];
} {
  const nodesByCategory = new Map<string, typeof nodes>();
  for (const n of nodes) {
    const list = nodesByCategory.get(n.categoryId) ?? [];
    list.push(n);
    nodesByCategory.set(n.categoryId, list);
  }

  const headerHeightOf = (categoryId: string) => headerHeights[categoryId] ?? CATEGORY_HEADER_H;

  const rowHeights = new Map<number, number>();
  const heightOf = (categoryId: string) => {
    const count = nodesByCategory.get(categoryId)?.length ?? 0;
    return headerHeightOf(categoryId) + CATEGORY_PAD + count * (CARD_HEIGHT + CARD_GAP);
  };

  for (const cat of categories) {
    const pos = GRID[cat.id];
    if (!pos) continue;
    const h = heightOf(cat.id);
    rowHeights.set(pos.row, Math.max(rowHeights.get(pos.row) ?? 0, h));
  }

  const rowYOffsets = new Map<number, number>();
  let yCursor = 0;
  const sortedRows = [...rowHeights.keys()].sort((a, b) => a - b);
  for (const row of sortedRows) {
    rowYOffsets.set(row, yCursor);
    yCursor += (rowHeights.get(row) ?? 0) + ROW_GAP;
  }

  const categoryBoxes: CategoryBox[] = [];
  const nodePositions: NodePosition[] = [];

  for (const cat of categories) {
    const pos = GRID[cat.id];
    if (!pos) continue;
    const x = pos.col * (COL_WIDTH + COL_GAP);
    const y = rowYOffsets.get(pos.row) ?? 0;
    const height = heightOf(cat.id);
    categoryBoxes.push({ id: cat.id, x, y, width: COL_WIDTH, height });

    const members = nodesByCategory.get(cat.id) ?? [];
    members.forEach((n, i) => {
      nodePositions.push({
        id: n.id,
        x: x + CATEGORY_PAD,
        y: y + headerHeightOf(cat.id) + i * (CARD_HEIGHT + CARD_GAP),
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      });
    });
  }

  return { categoryBoxes, nodePositions };
}
