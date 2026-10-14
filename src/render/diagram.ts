import * as d3 from 'd3';
import { categories } from '../data/categories';
import { nodes } from '../data/nodes';
import { DASHED_EDGES } from '../data/edgeStyles';
import {
  computeDefaultLayout,
  measureCategoryHeaderHeights,
  CARD_WIDTH,
  CARD_HEIGHT,
  type NodePosition,
} from './layout';
import { borderPoint, type Rect } from './geometry';
import { icon } from './icons';
import { t, type Lang } from '../data/types';

const POSITIONS_KEY = 'sciflowdiagram-positions-v1';
/** Below this width there's no room for a free-form drag canvas, so the
 * diagram switches to a plain stacked list instead (see buildStacked). */
const STACKED_BREAKPOINT = '(max-width: 860px)';

type Point = { x: number; y: number };

interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface DiagramHandle {
  selectNode: (id: string | null) => void;
  highlightStep: (nodeIds: string[] | null) => void;
  resetLayout: () => void;
  onSelect: (cb: (id: string | null) => void) => void;
}

interface ModeHandle {
  selectNode: (id: string | null) => void;
  highlightStep: (nodeIds: string[] | null) => void;
  resetLayout: () => void;
  getSelected: () => string | null;
  /** Releases anything that outlives this mode's own DOM subtree — e.g. a
   * window-level resize listener — before switching to the other mode. */
  destroy: () => void;
}

const categoryById = new Map(categories.map((c) => [c.id, c]));
const nodeById = new Map(nodes.map((n) => [n.id, n]));

const edges: Edge[] = nodes.flatMap((n) =>
  n.talksTo.map((targetId) => ({ id: `${n.id}->${targetId}`, source: n.id, target: targetId }))
);

/** True when an edge's two ends live in the same category box — these stay
 * permanently visible (unlike the hidden-until-hover cross-category edges)
 * since they're a short, local flow within a single box, same as the
 * always-on connector in the ArDoCo SANDMAN reference this page is modeled
 * on, rather than part of the wider cross-box tangle that opacity-0-by-
 * default was added to tame. */
function isIntraCategory(e: Edge): boolean {
  return nodeById.get(e.source)?.categoryId === nodeById.get(e.target)?.categoryId;
}

function edgeClass(e: Edge): string {
  const classes = ['edge'];
  if (DASHED_EDGES.has(e.id)) classes.push('edge--dashed');
  if (isIntraCategory(e)) classes.push('edge--intra');
  return classes.join(' ');
}

function neighborsOf(id: string): Set<string> {
  const set = new Set<string>();
  for (const e of edges) {
    if (e.source === id) set.add(e.target);
    if (e.target === id) set.add(e.source);
  }
  return set;
}

function loadSavedPositions(): Record<string, Point> {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePositions(positions: Map<string, Point>) {
  try {
    const plain: Record<string, Point> = {};
    positions.forEach((v, k) => (plain[k] = v));
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(plain));
  } catch {
    // localStorage can throw in private-browsing contexts — a dropped save
    // just means the layout resets next visit, not worth surfacing.
  }
}

/** A gentle single-curve arc between two rectangle borders, bowed away from
 * the straight line by an amount proportional to distance (capped) — reads
 * as "smooth flow" regardless of the two boxes' relative position, instead
 * of a straight line or an orthogonal (90°) elbow. */
function curvedPath(p1: Point, p2: Point): string {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy) || 1;
  const bow = Math.min(36, dist * 0.18);
  const mx = (p1.x + p2.x) / 2 + (-dy / dist) * bow;
  const my = (p1.y + p2.y) / 2 + (dx / dist) * bow;
  return `M${p1.x},${p1.y} Q${mx},${my} ${p2.x},${p2.y}`;
}

/** Side-hugging bracket curve for edges between two nodes stacked in the
 * same category column (always-on, see .edge--intra). Runs out from the
 * *right* edge of the source card, bulges further right, and comes back in
 * to the right edge of the target card — like a vertical flow indicator in
 * the box's own margin, rather than a line squeezed through the narrow gap
 * directly between two stacked cards (which the generic curvedPath, built
 * for the open space *between* separate boxes, would draw there instead).
 * Never crosses the cards' own text since both ends sit on their border. */
function sideBracketPath(sRect: Rect, tRect: Rect): string {
  const BOW = 14;
  const p1 = { x: sRect.x + sRect.width, y: sRect.y + sRect.height / 2 };
  const p2 = { x: tRect.x + tRect.width, y: tRect.y + tRect.height / 2 };
  const c1 = { x: p1.x + BOW, y: p1.y };
  const c2 = { x: p2.x + BOW, y: p2.y };
  return `M${p1.x},${p1.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
}

/** Desktop: a free-form draggable canvas with curved SVG edges. */
function buildCanvas(root: HTMLElement, fireSelect: (id: string | null) => void, lang: Lang): ModeHandle {
  const { categoryBoxes, nodePositions } = computeDefaultLayout(measureCategoryHeaderHeights(lang));
  const nodeSizeById = new Map(nodePositions.map((p) => [p.id, { width: p.width, height: p.height }]));

  const saved = loadSavedPositions();
  const positions = new Map<string, Point>(nodePositions.map((p) => [p.id, saved[p.id] ?? { x: p.x, y: p.y }]));

  const CANVAS_MARGIN = 20;
  const maxX =
    Math.max(...categoryBoxes.map((b) => b.x + b.width), ...[...positions.values()].map((p) => p.x + CARD_WIDTH)) +
    CANVAS_MARGIN;
  const maxY =
    Math.max(...categoryBoxes.map((b) => b.y + b.height), ...[...positions.values()].map((p) => p.y + CARD_HEIGHT)) +
    CANVAS_MARGIN;

  const wrap = d3.select(root).attr('class', 'canvas-wrap');
  const canvas = wrap
    .append('div')
    .attr('class', 'canvas')
    .style('width', `${maxX}px`)
    .style('height', `${maxY}px`)
    .on('click', () => select(null));

  const svg = canvas.append('svg').attr('class', 'edges').attr('width', maxX).attr('height', maxY);

  const defs = svg.append('defs');
  for (const kind of ['default', 'highlight'] as const) {
    defs
      .append('marker')
      .attr('id', `arrow-${kind}`)
      .attr('viewBox', '0 0 12 12')
      .attr('refX', 10.5)
      .attr('refY', 6)
      .attr('markerWidth', 9)
      .attr('markerHeight', 9)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M1,1 L11,6 L1,11 L4,6 z')
      .attr('fill', kind === 'highlight' ? 'var(--edge-highlight)' : 'var(--edge-default)');
  }

  const edgeSel = svg
    .selectAll<SVGPathElement, Edge>('path.edge')
    .data(edges, (d) => d.id)
    .join('path')
    .attr('class', edgeClass)
    .attr('marker-end', 'url(#arrow-default)');

  function edgePath(e: Edge): string {
    const sPos = positions.get(e.source);
    const tPos = positions.get(e.target);
    const sSize = nodeSizeById.get(e.source);
    const tSize = nodeSizeById.get(e.target);
    if (!sPos || !tPos || !sSize || !tSize) return '';
    const sRect = { x: sPos.x, y: sPos.y, width: sSize.width, height: sSize.height };
    const tRect = { x: tPos.x, y: tPos.y, width: tSize.width, height: tSize.height };
    if (isIntraCategory(e)) return sideBracketPath(sRect, tRect);
    const tCenter = { x: tRect.x + tRect.width / 2, y: tRect.y + tRect.height / 2 };
    const sCenter = { x: sRect.x + sRect.width / 2, y: sRect.y + sRect.height / 2 };
    const p1 = borderPoint(sRect, tCenter.x, tCenter.y);
    const p2 = borderPoint(tRect, sCenter.x, sCenter.y);
    return curvedPath(p1, p2);
  }

  function updateEdgesFor(nodeId: string) {
    edgeSel.filter((d) => d.source === nodeId || d.target === nodeId).attr('d', edgePath);
  }
  edgeSel.attr('d', edgePath);

  canvas
    .selectAll<HTMLDivElement, (typeof categoryBoxes)[number]>('div.category-box')
    .data(categoryBoxes, (d) => d.id)
    .join('div')
    .attr('class', 'category-box')
    .style('left', (d) => `${d.x}px`)
    .style('top', (d) => `${d.y}px`)
    .style('width', (d) => `${d.width}px`)
    .style('height', (d) => `${d.height}px`)
    .style('--cat-color', (d) => categoryById.get(d.id)?.color ?? 'var(--color-gray-400)')
    .attr('data-category', (d) => d.id)
    .each(function (d) {
      const cat = categoryById.get(d.id)!;
      const el = d3.select(this);
      const header = el.append('div').attr('class', 'category-box__header');
      header.node()!.appendChild(icon(cat.icon, 17));
      const textWrap = header.append('div');
      textWrap.append('h2').attr('class', 'category-box__title').text(t(cat.title, lang));
      textWrap.append('div').attr('class', 'category-box__desc').text(t(cat.description, lang));
    });

  let selectedId: string | null = null;
  let stepHighlight: Set<string> | null = null;

  function applyHighlight() {
    const active = stepHighlight ?? (selectedId ? new Set([selectedId, ...neighborsOf(selectedId)]) : null);
    canvas.node()!.classList.toggle('has-focus', !!active);

    canvas.selectAll<HTMLDivElement, NodePosition>('div.node-card').each(function (d) {
      const el = d3.select(this);
      el.classed('is-selected', d.id === selectedId && !stepHighlight);
      el.classed('is-connected', !!active && active.has(d.id) && d.id !== selectedId);
    });

    canvas.selectAll<HTMLDivElement, (typeof categoryBoxes)[number]>('div.category-box').each(function (d) {
      const members = nodes.filter((n) => n.categoryId === d.id).map((n) => n.id);
      const hasActive = !!active && members.some((id) => active.has(id));
      d3.select(this).classed('has-active-node', hasActive);
    });

    edgeSel.classed('edge--highlight', (e) => {
      if (!active) return false;
      if (stepHighlight) return stepHighlight.has(e.source) && stepHighlight.has(e.target);
      return e.source === selectedId || e.target === selectedId;
    });
    edgeSel.attr('marker-end', function () {
      const isHi = d3.select(this).classed('edge--highlight');
      return `url(#arrow-${isHi ? 'highlight' : 'default'})`;
    });
  }

  const drag = d3
    .drag<HTMLDivElement, NodePosition>()
    .on('start', function () {
      d3.select(this).raise();
    })
    .on('drag', function (event, d) {
      // Clamp to non-negative coordinates — the canvas only ever grows to
      // fit the *maximum* extent of dragged nodes, so a node dragged into
      // negative space would end up permanently unreachable: nothing
      // reserves scrollable room to the left/above the canvas's own origin.
      const next = { x: Math.max(0, event.x), y: Math.max(0, event.y) };
      positions.set(d.id, next);
      this.style.left = `${next.x}px`;
      this.style.top = `${next.y}px`;
      updateEdgesFor(d.id);
    })
    .on('end', () => savePositions(positions));

  const nodeSel = canvas
    .selectAll<HTMLDivElement, NodePosition>('div.node-card')
    .data(nodePositions, (d) => d.id)
    .join('div')
    .attr('class', 'node-card')
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('data-node-id', (d) => d.id)
    .attr('aria-label', (d) => t(nodeById.get(d.id)!.title, lang))
    .style('--cat-color', (d) => categoryById.get(nodeById.get(d.id)!.categoryId)?.color ?? 'var(--color-gray-400)')
    .style('left', (d) => `${positions.get(d.id)!.x}px`)
    .style('top', (d) => `${positions.get(d.id)!.y}px`)
    .style('width', (d) => `${d.width}px`)
    .style('height', (d) => `${d.height}px`)
    .each(function (d) {
      const n = nodeById.get(d.id)!;
      const el = d3.select(this);
      el.node()!.appendChild(icon(n.icon, 17));
      const textWrap = el.append('div').attr('class', 'node-card__text');
      textWrap.append('div').attr('class', 'node-card__title').text(t(n.title, lang));
      textWrap.append('div').attr('class', 'node-card__slug').text(n.slug);
    })
    .on('click', (event: MouseEvent, d) => {
      event.stopPropagation();
      select(selectedId === d.id ? null : d.id);
    })
    .on('keydown', (event: KeyboardEvent, d) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select(d.id);
      }
    })
    .on('mouseenter', (_event, d) => {
      if (!selectedId) previewHighlight(d.id);
    })
    .on('mouseleave', () => {
      if (!selectedId) previewHighlight(null);
    })
    .on('focus', (_event, d) => previewHighlight(d.id))
    .call(drag);

  function previewHighlight(id: string | null) {
    stepHighlight = id ? new Set([id, ...neighborsOf(id)]) : null;
    applyHighlight();
  }

  function select(id: string | null) {
    selectedId = id;
    stepHighlight = null;
    applyHighlight();
    fireSelect(id);
    if (id) {
      const el = root.querySelector<HTMLDivElement>(`.node-card[data-node-id="${id}"]`);
      el?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  return {
    selectNode: select,
    highlightStep: (ids) => {
      if (ids) selectedId = null;
      stepHighlight = ids ? new Set(ids) : null;
      applyHighlight();
    },
    resetLayout: () => {
      positions.clear();
      nodePositions.forEach((p) => positions.set(p.id, { x: p.x, y: p.y }));
      localStorage.removeItem(POSITIONS_KEY);
      nodeSel.style('left', (d) => `${positions.get(d.id)!.x}px`).style('top', (d) => `${positions.get(d.id)!.y}px`);
      edgeSel.attr('d', edgePath);
    },
    getSelected: () => selectedId,
    destroy: () => {
      /* nothing outlives this mode's own DOM subtree — drag listeners are
       * attached to the node elements themselves and go with them. */
    },
  };
}

/** Narrow screens: a plain stacked list, grouped by category, in document
 * flow — no canvas, no drag, no absolute positioning, no SVG. Each node
 * shows a short inline "→ talks to" hint instead of a drawn line, since
 * there's no shared 2D space left for lines to usefully cross. */
function buildStacked(root: HTMLElement, fireSelect: (id: string | null) => void, lang: Lang): ModeHandle {
  const wrap = d3.select(root).attr('class', 'stacked');
  let selectedId: string | null = null;
  let stepSet: Set<string> | null = null;

  const svg = wrap.insert('svg', ':first-child').attr('class', 'stacked-edges');
  const defs = svg.append('defs');
  for (const kind of ['default', 'highlight'] as const) {
    defs
      .append('marker')
      .attr('id', `stacked-arrow-${kind}`)
      .attr('viewBox', '0 0 12 12')
      .attr('refX', 10.5)
      .attr('refY', 6)
      .attr('markerWidth', 9)
      .attr('markerHeight', 9)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M1,1 L11,6 L1,11 L4,6 z')
      .attr('fill', kind === 'highlight' ? 'var(--edge-highlight)' : 'var(--edge-default)');
  }

  const cardByNodeId = new Map<string, HTMLButtonElement>();

  for (const cat of categories) {
    const members = nodes.filter((n) => n.categoryId === cat.id);
    if (members.length === 0) continue;

    const section = wrap.append('div').attr('class', 'stacked-category').style('--cat-color', cat.color);
    const header = section.append('div').attr('class', 'stacked-category__header');
    header.node()!.appendChild(icon(cat.icon, 18));
    const textWrap = header.append('div');
    textWrap.append('h2').attr('class', 'stacked-category__title').text(t(cat.title, lang));
    textWrap.append('div').attr('class', 'stacked-category__desc').text(t(cat.description, lang));

    const list = section.append('div').attr('class', 'stacked-node-list');
    for (const n of members) {
      const btn = list
        .append('button')
        .attr('class', 'stacked-node')
        .attr('type', 'button')
        .attr('data-node-id', n.id)
        .on('click', () => select(selectedId === n.id ? null : n.id));
      btn.node()!.appendChild(icon(n.icon, 18));
      const tw = btn.append('div').attr('class', 'min-w-0 flex-1');
      tw.append('div').attr('class', 'stacked-node__title').text(t(n.title, lang));
      tw.append('div').attr('class', 'stacked-node__slug').text(n.slug);
      if (n.talksTo.length > 0) {
        const hint = tw.append('div').attr('class', 'stacked-node__arrow-hint');
        hint.append('span').text('→');
        hint
          .append('span')
          .text(
            n.talksTo
              .map((id) => nodeById.get(id))
              .filter((target): target is NonNullable<typeof target> => !!target)
              .map((target) => t(target.title, lang))
              .join(', ')
          );
      }
      cardByNodeId.set(n.id, btn.node()!);
    }
  }

  function relevantEdges(): Edge[] {
    if (stepSet) return edges.filter((e) => stepSet!.has(e.source) && stepSet!.has(e.target));
    if (selectedId) return edges.filter((e) => e.source === selectedId || e.target === selectedId);
    return [];
  }

  function redrawStackedEdges() {
    svg.selectAll('path.edge').remove();
    const toDraw = relevantEdges();
    if (toDraw.length === 0) {
      svg.attr('height', 0);
      return;
    }
    // offsetTop/offsetLeft are relative to `root` (the nearest positioned
    // ancestor, since .stacked is position:relative and nothing between a
    // button and root sets its own position) — exactly the coordinate
    // space this SVG overlay, also positioned at root's origin, needs.
    svg.attr('height', root.scrollHeight).attr('width', root.clientWidth);
    for (const e of toDraw) {
      const sEl = cardByNodeId.get(e.source);
      const tEl = cardByNodeId.get(e.target);
      if (!sEl || !tEl) continue;
      const sRect = { x: sEl.offsetLeft, y: sEl.offsetTop, width: sEl.offsetWidth, height: sEl.offsetHeight };
      const tRect = { x: tEl.offsetLeft, y: tEl.offsetTop, width: tEl.offsetWidth, height: tEl.offsetHeight };
      const sCenter = { x: sRect.x + sRect.width / 2, y: sRect.y + sRect.height / 2 };
      const tCenter = { x: tRect.x + tRect.width / 2, y: tRect.y + tRect.height / 2 };
      const p1 = borderPoint(sRect, tCenter.x, tCenter.y);
      const p2 = borderPoint(tRect, sCenter.x, sCenter.y);
      svg
        .append('path')
        .attr('class', DASHED_EDGES.has(e.id) ? 'edge edge--dashed edge--highlight' : 'edge edge--highlight')
        .attr('d', curvedPath(p1, p2))
        .attr('marker-end', 'url(#stacked-arrow-highlight)');
    }
  }

  function applyHighlight() {
    const active = stepSet ?? (selectedId ? new Set([selectedId, ...neighborsOf(selectedId)]) : null);
    cardByNodeId.forEach((el, id) => {
      el.classList.toggle('is-selected', id === selectedId && !stepSet);
      el.classList.toggle('is-connected', !!active && active.has(id) && id !== selectedId);
    });
    redrawStackedEdges();
  }

  function select(id: string | null) {
    selectedId = id;
    stepSet = null;
    applyHighlight();
    fireSelect(id);
    if (id) cardByNodeId.get(id)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }

  // Row positions shift on resize/orientation-change (text reflows to a
  // different number of lines etc.) — redraw so arrows stay attached.
  const onResize = () => {
    if (selectedId || stepSet) redrawStackedEdges();
  };
  window.addEventListener('resize', onResize);

  return {
    selectNode: select,
    highlightStep: (ids) => {
      if (ids) selectedId = null;
      stepSet = ids ? new Set(ids) : null;
      applyHighlight();
      if (ids && ids[0]) cardByNodeId.get(ids[0])?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    },
    resetLayout: () => {
      /* nothing to reset in stacked mode — nothing is draggable */
    },
    getSelected: () => selectedId,
    destroy: () => window.removeEventListener('resize', onResize),
  };
}

export function initDiagram(root: HTMLElement, lang: Lang): DiagramHandle {
  const mql = window.matchMedia(STACKED_BREAKPOINT);
  let selectCallback: ((id: string | null) => void) | null = null;
  let current: ModeHandle | null = null;

  function fireSelect(id: string | null) {
    selectCallback?.(id);
  }

  function build() {
    const prevSelected = current?.getSelected() ?? null;
    current?.destroy();
    root.innerHTML = '';
    current = mql.matches ? buildStacked(root, fireSelect, lang) : buildCanvas(root, fireSelect, lang);
    if (prevSelected) current.selectNode(prevSelected);
  }

  mql.addEventListener('change', build);
  build();

  return {
    selectNode: (id) => current?.selectNode(id),
    highlightStep: (ids) => current?.highlightStep(ids),
    resetLayout: () => current?.resetLayout(),
    onSelect: (cb) => {
      selectCallback = cb;
    },
  };
}
