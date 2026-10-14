// Headless DOM smoke test — not a permanent part of the project (not wired
// into package.json), just a one-off check since no visual browser tool is
// available in this environment. Run with: npx tsx smoke-test.ts
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
// jsdom advertises PointerEvent support but its synthetic pointer events
// don't fully propagate the way d3-drag expects; deleting this makes d3
// fall back to its mouse-event path, which jsdom handles correctly.
delete (dom.window as any).onpointerdown;
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).localStorage = dom.window.localStorage;
(globalThis as any).SVGElement = dom.window.SVGElement;
// jsdom doesn't implement matchMedia at all; stub it directly on dom.window
// (not just globalThis) since app code calls it as `window.matchMedia(...)`,
// and here `window` IS dom.window, a distinct object from globalThis.
// `matches: false` keeps the diagram in desktop/canvas mode for this test.
const matchMediaStub = (query: string) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent() {
    return false;
  },
});
(dom.window as any).matchMedia = matchMediaStub;
(globalThis as any).matchMedia = matchMediaStub;

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) {
    console.log(`  ok  - ${label}`);
  } else {
    console.log(`FAIL  - ${label}`);
    failures++;
  }
}

async function main() {
  console.log('--- 1. Data integrity ---');
  const { nodes } = await import('./src/data/nodes.ts');
  const { categories } = await import('./src/data/categories.ts');
  const { steps } = await import('./src/data/steps.ts');
  const { DASHED_EDGES } = await import('./src/data/edgeStyles.ts');

  const nodeIds = new Set(nodes.map((n: any) => n.id));
  const catIds = new Set(categories.map((c: any) => c.id));

  check('every node has a unique id', nodeIds.size === nodes.length);
  check(
    'every node.categoryId refers to a real category',
    nodes.every((n: any) => catIds.has(n.categoryId))
  );
  const badTalksTo: string[] = [];
  for (const n of nodes) {
    for (const t of n.talksTo) {
      if (!nodeIds.has(t)) badTalksTo.push(`${n.id} -> ${t}`);
    }
  }
  check('every talksTo id refers to a real node', badTalksTo.length === 0);
  if (badTalksTo.length) console.log('    bad refs:', badTalksTo);

  const edgeIds = new Set(nodes.flatMap((n: any) => n.talksTo.map((t: string) => `${n.id}->${t}`)));
  const badDashed = [...DASHED_EDGES].filter((id) => !edgeIds.has(id));
  check('every DASHED_EDGES entry matches a real edge', badDashed.length === 0);
  if (badDashed.length) console.log('    stale dashed entries:', badDashed);

  const badStepRefs: string[] = [];
  for (const s of steps) {
    for (const id of s.nodeIds) {
      if (!nodeIds.has(id)) badStepRefs.push(`${s.id}: ${id}`);
    }
  }
  check('every step.nodeIds entry refers to a real node', badStepRefs.length === 0);

  // every category actually has at least one node (an empty category box would be a dead end)
  const emptyCats = categories.filter((c: any) => !nodes.some((n: any) => n.categoryId === c.id));
  check('no category is empty', emptyCats.length === 0);
  if (emptyCats.length) console.log('    empty categories:', emptyCats.map((c: any) => c.id));

  console.log('\n--- 2. Layout computation ---');
  const { computeDefaultLayout } = await import('./src/render/layout.ts');
  const { categoryBoxes, nodePositions } = computeDefaultLayout();
  check('a category box exists for every category with nodes', categoryBoxes.length === categories.length - emptyCats.length);
  check('a position exists for every node', nodePositions.length === nodes.length);
  check(
    'no NaN coordinates',
    nodePositions.every((p: any) => Number.isFinite(p.x) && Number.isFinite(p.y)) &&
      categoryBoxes.every((b: any) => Number.isFinite(b.x) && Number.isFinite(b.y))
  );
  // every node's default position should fall within its own category box
  let outOfBox = 0;
  for (const p of nodePositions) {
    const n = nodes.find((x: any) => x.id === p.id)!;
    const box = categoryBoxes.find((b: any) => b.id === n.categoryId)!;
    const within = p.x >= box.x && p.y >= box.y && p.x + p.width <= box.x + box.width + 1 && p.y + p.height <= box.y + box.height + 1;
    if (!within) outOfBox++;
  }
  check('every node starts inside its own category box', outOfBox === 0);

  console.log('\n--- 3. Rendering + interaction (diagram, panel, stepper) ---');
  const { initDiagram } = await import('./src/render/diagram.ts');
  const { initPanel } = await import('./src/render/panel.ts');
  const { initStepper } = await import('./src/render/stepper.ts');

  const diagramRoot = document.createElement('div');
  const panelRoot = document.createElement('div');
  const stepperBar = document.createElement('div');
  const stepCaption = document.createElement('div');
  document.body.append(diagramRoot, panelRoot, stepperBar, stepCaption);

  const diagram = initDiagram(diagramRoot, 'en');
  const panel = initPanel(panelRoot, (id: string) => diagram.selectNode(id || null), 'en');
  const stepper = initStepper(
    stepperBar,
    stepCaption,
    (ids: string[] | null) => {
      diagram.highlightStep(ids);
      if (ids) panel.clear();
    },
    'en',
  );
  diagram.onSelect((id: string | null) => {
    if (id) {
      stepper.clear();
      panel.show(id);
    } else {
      panel.clear();
    }
  });

  const cards = diagramRoot.querySelectorAll('.node-card');
  check('renders one card per node', cards.length === nodes.length);
  const boxes = diagramRoot.querySelectorAll('.category-box');
  check('renders one box per non-empty category', boxes.length === categoryBoxes.length);
  const edgePaths = diagramRoot.querySelectorAll('path.edge');
  const totalEdges = nodes.reduce((sum: number, n: any) => sum + n.talksTo.length, 0);
  check('renders one SVG path per edge', edgePaths.length === totalEdges);
  check(
    'no edge is highlighted before any hover/click (edges are hidden-by-default via CSS opacity 0)',
    diagramRoot.querySelectorAll('path.edge--highlight').length === 0
  );

  // --- edges within the same category box stay visible at rest (unlike
  // the hidden-until-hover cross-category edges) ---
  const nodeCategoryById = new Map(nodes.map((n: any) => [n.id, n.categoryId]));
  let expectedIntraCount = 0;
  for (const n of nodes) {
    for (const targetId of n.talksTo) {
      if (nodeCategoryById.get(targetId) === n.categoryId) expectedIntraCount++;
    }
  }
  check('at least one same-category edge exists in the data', expectedIntraCount > 0);
  check(
    'renders path.edge--intra for exactly the same-category edges',
    diagramRoot.querySelectorAll('path.edge--intra').length === expectedIntraCount
  );
  const crossCategoryEdgeExists = nodes.some((n: any) =>
    n.talksTo.some((targetId: string) => nodeCategoryById.get(targetId) !== n.categoryId)
  );
  check('at least one cross-category edge exists in the data', crossCategoryEdgeExists);

  // --- intra-category edges draw as a side-hugging bracket (cubic 'C',
  // anchored exactly on each card's right-edge midpoint), never a straight
  // line/curve through the cards' own text; cross-category edges keep the
  // original border-to-border quadratic curve ('Q') ---
  const glCard = diagramRoot.querySelector<HTMLElement>('[data-node-id="graph-load"]')!;
  const glRight = parseFloat(glCard.style.left) + parseFloat(glCard.style.width);
  const glMidY = parseFloat(glCard.style.top) + parseFloat(glCard.style.height) / 2;
  const vsCard = diagramRoot.querySelector<HTMLElement>('[data-node-id="vector-store"]')!;
  const vsRight = parseFloat(vsCard.style.left) + parseFloat(vsCard.style.width);
  const vsMidY = parseFloat(vsCard.style.top) + parseFloat(vsCard.style.height) / 2;
  const intraPaths = [...diagramRoot.querySelectorAll<SVGPathElement>('path.edge--intra')];
  const bracket = intraPaths.find((p) => p.getAttribute('d')?.startsWith(`M${glRight},${glMidY} C`));
  check(
    'an intra-category edge (graph-load -> vector-store) starts exactly at its source card\'s right-edge midpoint',
    !!bracket
  );
  check(
    'that same bracket ends exactly at its target card\'s right-edge midpoint',
    !!bracket && bracket.getAttribute('d')!.trim().endsWith(`${vsRight},${vsMidY}`)
  );

  // a genuine cross-category edge (access -> safety) keeps the original
  // border-to-border quadratic curve, not the intra-category bracket shape
  const crossEdgeIsBracket = [...diagramRoot.querySelectorAll<SVGPathElement>('path.edge:not(.edge--intra)')].some(
    (p) => p.getAttribute('d')?.includes(' C')
  );
  check('cross-category edges still use the quadratic border-to-border curve, not the bracket shape', !crossEdgeIsBracket);

  // --- click a node: selection, highlight classes, panel content ---
  const target = diagramRoot.querySelector<HTMLElement>('[data-node-id="retrieval-service"]')!;
  check('target node found in DOM', !!target);
  target.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

  check('clicked node gets is-selected', target.classList.contains('is-selected'));
  check('canvas gets has-focus', diagramRoot.querySelector('.canvas')!.classList.contains('has-focus'));
  const connected = diagramRoot.querySelector<HTMLElement>('[data-node-id="graph-load"]')!;
  check('a real neighbor (graph-load) gets is-connected', connected.classList.contains('is-connected'));
  const unrelated = diagramRoot.querySelector<HTMLElement>('[data-node-id="stats"]')!;
  check('an unrelated node (stats) does NOT get is-connected', !unrelated.classList.contains('is-connected'));

  check('panel shows the selected node title', panelRoot.querySelector('.panel__title')?.textContent === 'Retrieval orchestrator');
  const talksToLinks = panelRoot.querySelectorAll('.panel__list button');
  check('panel renders talksTo/usedBy link buttons', talksToLinks.length > 0);

  // click a talksTo link inside the panel -> should navigate the diagram selection
  const firstLink = talksToLinks[0] as HTMLButtonElement;
  const firstLinkLabel = firstLink.textContent;
  firstLink.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check(
    `clicking a panel link ("${firstLinkLabel}") updates the panel title`,
    panelRoot.querySelector('.panel__title')?.textContent === firstLinkLabel
  );

  // --- click same node again: should deselect ---
  const nowSelectedId = diagramRoot.querySelector('.node-card.is-selected')?.getAttribute('data-node-id');
  const selectedEl = diagramRoot.querySelector<HTMLElement>(`[data-node-id="${nowSelectedId}"]`)!;
  selectedEl.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('clicking the selected node again clears selection', !selectedEl.classList.contains('is-selected'));
  check('panel goes back to empty state', !!panelRoot.querySelector('.panel__empty'));

  // --- technical details toggle ---
  target.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  const techToggle = panelRoot.querySelector<HTMLButtonElement>('.panel__tech-toggle');
  if (techToggle) {
    const list = panelRoot.querySelector('.panel__tech-list')!;
    check('technical details starts collapsed', !list.classList.contains('is-open'));
    techToggle.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    check('technical details opens on click', list.classList.contains('is-open'));
  } else {
    check('technical details toggle exists', false);
  }

  // --- close ('X') button: always rendered now, not just on the mobile
  // bottom sheet, and deselects the same way re-clicking the node does ---
  const closeBtn = panelRoot.querySelector<HTMLButtonElement>('.panel__close');
  check('panel close button is rendered', !!closeBtn);
  closeBtn?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('clicking the close button deselects the node', !target.classList.contains('is-selected'));
  check('clicking the close button returns the panel to its empty state', !!panelRoot.querySelector('.panel__empty'));

  // --- stepper ---
  const stepButtons = stepperBar.querySelectorAll('.step-btn');
  check('renders one button per step', stepButtons.length === steps.length);
  (stepButtons[0] as HTMLButtonElement).dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('step button becomes active', stepButtons[0].classList.contains('is-active'));
  check('step caption becomes visible', stepCaption.classList.contains('is-visible'));
  const step0NodeId = steps[0].nodeIds[0];
  const step0Card = diagramRoot.querySelector<HTMLElement>(`[data-node-id="${step0NodeId}"]`)!;
  check('a node in the active step gets is-connected', step0Card.classList.contains('is-connected'));
  check('clicking a step clears any open panel', !!panelRoot.querySelector('.panel__empty'));

  // deactivate the step
  (stepButtons[0] as HTMLButtonElement).dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('clicking the active step again deactivates it', !stepButtons[0].classList.contains('is-active'));

  // --- reset layout doesn't throw ---
  try {
    diagram.resetLayout();
    check('resetLayout() runs without throwing', true);
  } catch (e) {
    console.log(e);
    check('resetLayout() runs without throwing', false);
  }

  console.log('\n--- 4. Stacked mode (narrow-screen layout) ---');
  // Tested *before* the drag section below: d3-drag arms a one-shot
  // "swallow the very next click" listener after any drag gesture (real,
  // intentional behavior — stops a drag's final mouseup from also
  // registering as a click-select). Testing clicks here first avoids that
  // one-shot suppression, which a synthetic same-tick test script can hit
  // but a real user never would (their drag and their next click are two
  // genuinely separate physical gestures, not back-to-back dispatchEvent calls).
  const stackedMatchMedia = (query: string) => ({
    matches: true,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  });
  (dom.window as any).matchMedia = stackedMatchMedia;
  (globalThis as any).matchMedia = stackedMatchMedia;

  const stackedDiagramRoot = document.createElement('div');
  const stackedPanelRoot = document.createElement('div');
  document.body.append(stackedDiagramRoot, stackedPanelRoot);
  const stackedDiagram = initDiagram(stackedDiagramRoot, 'en');
  const stackedPanel = initPanel(stackedPanelRoot, (id: string) => stackedDiagram.selectNode(id || null), 'en');
  stackedDiagram.onSelect((id: string | null) => (id ? stackedPanel.show(id) : stackedPanel.clear()));

  check('stacked mode renders no draggable canvas', !stackedDiagramRoot.querySelector('.canvas'));
  check(
    'stacked mode renders one row per node',
    stackedDiagramRoot.querySelectorAll('.stacked-node').length === nodes.length
  );
  check(
    'stacked mode renders one section per non-empty category',
    stackedDiagramRoot.querySelectorAll('.stacked-category').length === categoryBoxes.length
  );

  const stackedTarget = stackedDiagramRoot.querySelector<HTMLButtonElement>('[data-node-id="retrieval-service"]')!;
  stackedTarget.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, view: dom.window as any }));
  check('clicking a stacked row selects it', stackedTarget.classList.contains('is-selected'));
  check(
    'stacked panel shows the right node',
    stackedPanelRoot.querySelector('.panel__title')?.textContent === 'Retrieval orchestrator'
  );
  const stackedNeighbor = stackedDiagramRoot.querySelector<HTMLButtonElement>('[data-node-id="graph-load"]')!;
  check('a real neighbor gets is-connected in stacked mode too', stackedNeighbor.classList.contains('is-connected'));
  check(
    'each stacked row with outgoing links shows an inline talks-to hint',
    !!stackedTarget.querySelector('.stacked-node__arrow-hint')
  );
  const stackedArrowPaths = stackedDiagramRoot.querySelectorAll('svg.stacked-edges path.edge');
  check('selecting a stacked row draws at least one SVG arrow', stackedArrowPaths.length > 0);
  check(
    'every drawn stacked arrow has a visible marker-end (arrowhead)',
    [...stackedArrowPaths].every((p) => !!p.getAttribute('marker-end'))
  );
  stackedTarget.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, view: dom.window as any }));
  check(
    'deselecting the stacked row removes the drawn arrows',
    stackedDiagramRoot.querySelectorAll('svg.stacked-edges path.edge').length === 0
  );

  // restore canvas-mode matchMedia for the rest of the script
  (dom.window as any).matchMedia = matchMediaStub;
  (globalThis as any).matchMedia = matchMediaStub;

  console.log('\n--- 5. Drag (simulated mouse events) ---');
  const dragTarget = diagramRoot.querySelector<HTMLElement>('[data-node-id="frontend-chat"]')!;
  const allEdges = [...diagramRoot.querySelectorAll<SVGPathElement>('path.edge')];
  const beforeLeft = dragTarget.style.left;
  const beforeDs = allEdges.map((e) => e.getAttribute('d'));
  const mouseOpts = { view: dom.window as any };
  dragTarget.dispatchEvent(new dom.window.MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10, button: 0, ...mouseOpts }));
  dom.window.dispatchEvent(new dom.window.MouseEvent('mousemove', { bubbles: true, clientX: 150, clientY: 80, ...mouseOpts }));
  dom.window.dispatchEvent(new dom.window.MouseEvent('mouseup', { bubbles: true, clientX: 150, clientY: 80, ...mouseOpts }));
  const afterLeft = dragTarget.style.left;
  const afterDs = allEdges.map((e) => e.getAttribute('d'));
  const anyEdgeChanged = beforeDs.some((d, i) => d !== afterDs[i]);
  check('drag moved the node (style.left changed)', beforeLeft !== afterLeft);
  check('at least one connected edge was redrawn (d attribute changed)', anyEdgeChanged);
  if (beforeLeft === afterLeft) {
    console.log('    NOTE: this must still be confirmed by hand in a real browser before publishing.');
  }

  // --- dragging far past the canvas's own extent is clamped, not left to
  // overflow into where the (separate, sibling) detail panel sits ---
  const canvasEl = diagramRoot.querySelector<HTMLElement>('.canvas')!;
  const canvasMaxX = parseFloat(canvasEl.style.width);
  const canvasMaxY = parseFloat(canvasEl.style.height);
  const dragWidth = parseFloat(dragTarget.style.width);
  const dragHeight = parseFloat(dragTarget.style.height);
  dragTarget.dispatchEvent(
    new dom.window.MouseEvent('mousedown', { bubbles: true, clientX: 150, clientY: 80, button: 0, ...mouseOpts })
  );
  dom.window.dispatchEvent(
    new dom.window.MouseEvent('mousemove', { bubbles: true, clientX: 999999, clientY: 999999, ...mouseOpts })
  );
  dom.window.dispatchEvent(
    new dom.window.MouseEvent('mouseup', { bubbles: true, clientX: 999999, clientY: 999999, ...mouseOpts })
  );
  const clampedLeft = parseFloat(dragTarget.style.left);
  const clampedTop = parseFloat(dragTarget.style.top);
  check(
    "dragging far past the canvas clamps x to the canvas's own right edge, never beyond it",
    clampedLeft === canvasMaxX - dragWidth
  );
  check(
    "dragging far past the canvas clamps y to the canvas's own bottom edge, never beyond it",
    clampedTop === canvasMaxY - dragHeight
  );

  // --- a second drag gesture on an already-moved card continues from its
  // actual current position, not its original default-layout position
  // (regression test for a real bug: d3-drag's default "subject" is the
  // bound datum, whose x/y never get updated after a drag, so a second
  // drag would restart its math from stale original coordinates and the
  // card would visibly snap back before following the pointer again) ---
  const secondDragTarget = diagramRoot.querySelector<HTMLElement>('[data-node-id="rate-limiter"]')!;
  const originalLeft = parseFloat(secondDragTarget.style.left);
  const originalTop = parseFloat(secondDragTarget.style.top);
  secondDragTarget.dispatchEvent(
    new dom.window.MouseEvent('mousedown', { bubbles: true, clientX: 20, clientY: 20, button: 0, ...mouseOpts })
  );
  dom.window.dispatchEvent(
    new dom.window.MouseEvent('mousemove', { bubbles: true, clientX: 320, clientY: 220, ...mouseOpts })
  );
  dom.window.dispatchEvent(
    new dom.window.MouseEvent('mouseup', { bubbles: true, clientX: 320, clientY: 220, ...mouseOpts })
  );
  const afterFirstLeft = parseFloat(secondDragTarget.style.left);
  const afterFirstTop = parseFloat(secondDragTarget.style.top);
  check('first drag actually moved the node away from its original position', afterFirstLeft !== originalLeft || afterFirstTop !== originalTop);

  // mousedown starts from a totally different absolute pointer location this
  // time, moved by only a small (+5,+5) delta
  secondDragTarget.dispatchEvent(
    new dom.window.MouseEvent('mousedown', { bubbles: true, clientX: 900, clientY: 700, button: 0, ...mouseOpts })
  );
  dom.window.dispatchEvent(
    new dom.window.MouseEvent('mousemove', { bubbles: true, clientX: 905, clientY: 705, ...mouseOpts })
  );
  dom.window.dispatchEvent(
    new dom.window.MouseEvent('mouseup', { bubbles: true, clientX: 905, clientY: 705, ...mouseOpts })
  );
  const afterSecondLeft = parseFloat(secondDragTarget.style.left);
  const afterSecondTop = parseFloat(secondDragTarget.style.top);
  check(
    'a second drag gesture moves the card by exactly its own small delta from where it already was (continuous)',
    afterSecondLeft === afterFirstLeft + 5 && afterSecondTop === afterFirstTop + 5
  );
  check(
    "that result is clearly not the original pre-drag position plus the small delta (the bug this guards against)",
    afterSecondLeft !== originalLeft + 5 || afterSecondTop !== originalTop + 5
  );

  console.log('\n--- 6. Dragged position persists across re-init (localStorage) ---');
  const draggedLeft = dragTarget.style.left;
  const diagramRoot2 = document.createElement('div');
  document.body.append(diagramRoot2);
  initDiagram(diagramRoot2, 'en'); // simulates a page reload reading the same localStorage
  const reinitCard = diagramRoot2.querySelector<HTMLElement>('[data-node-id="frontend-chat"]')!;
  check('dragged position survives a fresh initDiagram() call', reinitCard.style.left === draggedLeft);

  console.log('\n--- 7. Glossary ---');
  const { glossary } = await import('./src/data/glossary.ts');
  const { renderGlossary } = await import('./src/render/glossary.ts');

  const badGlossaryRefs = glossary.filter((g: any) => g.relatedNodeId && !nodeIds.has(g.relatedNodeId));
  check('every glossary.relatedNodeId refers to a real node', badGlossaryRefs.length === 0);
  if (badGlossaryRefs.length) console.log('    bad refs:', badGlossaryRefs.map((g: any) => `${g.term.en} -> ${g.relatedNodeId}`));

  const glossaryRoot = document.createElement('section');
  document.body.appendChild(glossaryRoot);
  let linkedId: string | null = null;
  renderGlossary(
    glossaryRoot,
    (id: string) => {
      linkedId = id;
    },
    'en',
  );

  check('renders a <dl> (semantically correct term/definition list)', !!glossaryRoot.querySelector('dl.glossary__grid'));
  check('renders one dt+dd pair per term', glossaryRoot.querySelectorAll('dt').length === glossary.length);
  const linkedCount = glossary.filter((g: any) => g.relatedNodeId).length;
  check(
    'renders a clickable button for every term with a relatedNodeId',
    glossaryRoot.querySelectorAll('dt button.glossary__card--linked').length === linkedCount
  );
  const unlinkedCount = glossary.length - linkedCount;
  const plainDtCount = [...glossaryRoot.querySelectorAll('dt')].filter((dt) => !dt.querySelector('button')).length;
  check('renders a plain (non-button) dt for every term without one', plainDtCount === unlinkedCount);

  const orkgBtn = [...glossaryRoot.querySelectorAll<HTMLButtonElement>('dt button')].find((b) =>
    b.textContent?.includes('ORKG')
  );
  check('found the ORKG glossary button', !!orkgBtn);
  orkgBtn?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('clicking a linked glossary term fires onLink with its relatedNodeId', linkedId === 'graph-load');

  const extLinksCount = glossary.filter((g: any) => g.externalUrl).length;
  const extLinkEls = [...glossaryRoot.querySelectorAll<HTMLAnchorElement>('a.glossary__external-link')];
  check('renders one external link per glossary entry that has externalUrl', extLinkEls.length === extLinksCount);
  check(
    'every glossary external link opens in a new tab safely (target=_blank, rel=noopener noreferrer)',
    extLinkEls.every((a) => a.target === '_blank' && a.rel.includes('noopener') && a.rel.includes('noreferrer'))
  );
  const orkgExtLink = extLinkEls.find((a) => a.href === 'https://orkg.org/');
  check('ORKG external link points to https://orkg.org/', !!orkgExtLink);
  const dblpExtLink = extLinkEls.find((a) => a.href === 'https://dblp.org/');
  check('DBLP external link points to https://dblp.org/', !!dblpExtLink);
  const dblpTerm = glossary.find((g: any) => g.term.en === 'DBLP');
  check(
    'DBLP glossary definition states its full form',
    !!dblpTerm?.definition.en.includes('DataBase systems & Logic Programming')
  );

  console.log('\n--- 8. Full page assembly — structure & accessibility ---');
  // Mirrors main.ts's own wiring (topbar/main/glossary landmarks + module
  // hookup), minus its `import './style.css'` — a Vite-only convention
  // plain Node/tsx can't resolve outside Vite's own build pipeline. The
  // CSS itself isn't logic, so nothing here goes untested by skipping it.
  const appEl = document.getElementById('app')!;
  appEl.innerHTML = '';
  const fpHeader = document.createElement('header');
  fpHeader.className = 'topbar';
  const fpH1 = document.createElement('h1');
  fpH1.textContent = 'SciGraphChat';
  fpHeader.appendChild(fpH1);
  appEl.appendChild(fpHeader);
  const fpMain = document.createElement('main');
  const fpStage = document.createElement('div');
  fpStage.className = 'stage';
  const fpDiagramRoot = document.createElement('div');
  const fpPanelRoot = document.createElement('div');
  fpStage.append(fpDiagramRoot, fpPanelRoot);
  fpMain.appendChild(fpStage);
  appEl.appendChild(fpMain);
  const fpDiagram = initDiagram(fpDiagramRoot, 'en');
  const fpPanel = initPanel(fpPanelRoot, (id: string) => fpDiagram.selectNode(id || null), 'en');
  fpDiagram.onSelect((id: string | null) => (id ? fpPanel.show(id) : fpPanel.clear()));
  const fpStepperBar = document.createElement('div');
  const fpStepCaption = document.createElement('div');
  fpMain.append(fpStepperBar, fpStepCaption);
  initStepper(fpStepperBar, fpStepCaption, (ids: string[] | null) => fpDiagram.highlightStep(ids), 'en');
  const fpGlossarySection = document.createElement('section');
  fpGlossarySection.id = 'glossary';
  fpGlossarySection.setAttribute('aria-labelledby', 'glossary-title');
  appEl.appendChild(fpGlossarySection);
  renderGlossary(fpGlossarySection, (id: string) => fpDiagram.selectNode(id), 'en');

  check('exactly one <h1> on the page', appEl.querySelectorAll('h1').length === 1);
  check('topbar is a <header> landmark', !!appEl.querySelector('header.topbar'));
  check('primary content is a <main> landmark', !!appEl.querySelector('main'));
  check('glossary is a <section> landmark with aria-labelledby', !!appEl.querySelector('section#glossary[aria-labelledby]'));
  check(
    'one <h2> category heading per non-empty category (canvas mode)',
    appEl.querySelectorAll('.category-box h2.category-box__title').length === categoryBoxes.length
  );

  const panelEl = appEl.querySelector<HTMLElement>('.panel')!;
  check('panel has role=region', panelEl.getAttribute('role') === 'region');
  check('panel has aria-live=polite', panelEl.getAttribute('aria-live') === 'polite');

  const fullPageTarget = appEl.querySelector<HTMLElement>('[data-node-id="auth-service"]')!;
  fullPageTarget.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, view: dom.window as any }));
  const panelH2 = panelEl.querySelector<HTMLElement>('h2.panel__title');
  check('selecting a node renders its detail panel heading as an <h2>', !!panelH2);
  check('that panel heading is focusable (tabindex=-1)', panelH2?.getAttribute('tabindex') === '-1');
  check('selecting a node moves focus to the panel heading', document.activeElement === panelH2);

  const stepBtn = appEl.querySelector<HTMLButtonElement>('.step-btn')!;
  check('step button starts aria-pressed=false', stepBtn.getAttribute('aria-pressed') === 'false');
  stepBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, view: dom.window as any }));
  check('step button reflects aria-pressed=true once active', stepBtn.getAttribute('aria-pressed') === 'true');

  console.log('\n--- 9. Language toggle (i18n) ---');
  const deDiagramRoot = document.createElement('div');
  document.body.appendChild(deDiagramRoot);
  const deDiagram = initDiagram(deDiagramRoot, 'de');
  const deCategoryTitle = deDiagramRoot.querySelector('.category-box__title')?.textContent ?? '';
  check(
    'initDiagram("de") renders a German category title (not the English one)',
    deCategoryTitle.length > 0 && deCategoryTitle !== deDiagramRoot.querySelector('.category-box__desc')?.textContent
  );

  const dePanelRoot = document.createElement('div');
  document.body.appendChild(dePanelRoot);
  const dePanel = initPanel(dePanelRoot, (id: string) => deDiagram.selectNode(id || null), 'de');
  check('initPanel("de") empty state is in German', !!dePanelRoot.querySelector('.panel__empty')?.textContent?.includes('Klicken'));
  deDiagram.onSelect((id: string | null) => (id ? dePanel.show(id) : dePanel.clear()));
  const deTarget = deDiagramRoot.querySelector<HTMLElement>('[data-node-id="retrieval-service"]')!;
  deTarget.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check(
    'selecting a node with lang="de" renders its German title',
    dePanelRoot.querySelector('.panel__title')?.textContent === 'Retrieval-Orchestrator'
  );
  check(
    'panel section labels render in German ("How it fits" -> "Rolle im Ablauf")',
    [...dePanelRoot.querySelectorAll('.panel__section-title')].some((el) => el.textContent === 'Rolle im Ablauf')
  );

  const deStepperBar = document.createElement('div');
  const deStepCaption = document.createElement('div');
  document.body.append(deStepperBar, deStepCaption);
  initStepper(deStepperBar, deStepCaption, () => {}, 'de');
  check(
    'initStepper("de") renders German step titles',
    deStepperBar.querySelector('.step-btn')?.textContent === steps[0].title.de
  );

  const deGlossaryRoot = document.createElement('section');
  document.body.appendChild(deGlossaryRoot);
  renderGlossary(deGlossaryRoot, () => {}, 'de');
  check('renderGlossary("de") renders the German title "Glossar"', deGlossaryRoot.querySelector('.glossary__title')?.textContent === 'Glossar');

  console.log('\n--- 10. URL hash deep-linking ---');
  // Mirrors main.ts's deep-link wiring: selecting a node writes its `slug`
  // to the URL hash (shareable/bookmarkable), and a hash present on load
  // re-selects the matching node once the diagram is built.
  const dlNodeById = new Map(nodes.map((n: any) => [n.id, n]));
  const dlNodeBySlug = new Map(nodes.map((n: any) => [n.slug, n.id]));

  const dlDiagramRoot = document.createElement('div');
  document.body.appendChild(dlDiagramRoot);
  const dlDiagram = initDiagram(dlDiagramRoot, 'en');
  dlDiagram.onSelect((id: string | null) => {
    if (id) {
      const slug = dlNodeById.get(id)?.slug;
      if (slug) dom.window.history.replaceState(null, '', `#${slug}`);
    } else if (dom.window.location.hash) {
      dom.window.history.replaceState(null, '', dom.window.location.pathname + dom.window.location.search);
    }
  });

  const dlTarget = dlDiagramRoot.querySelector<HTMLElement>('[data-node-id="answer-generator"]')!;
  dlTarget.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('selecting a node sets the URL hash to its slug', dom.window.location.hash === '#answer-generator');

  dlTarget.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('deselecting the node clears the URL hash', dom.window.location.hash === '');

  // simulate a page load that arrives with a hash already in the URL
  dom.window.history.replaceState(null, '', '#graph-load');
  const dlReloadRoot = document.createElement('div');
  document.body.appendChild(dlReloadRoot);
  const dlReloadDiagram = initDiagram(dlReloadRoot, 'en');
  const dlLinkedId = dlNodeBySlug.get((dom.window.location.hash || '').slice(1));
  check('hash "#graph-load" resolves to the right node id', dlLinkedId === 'graph-load');
  if (dlLinkedId) dlReloadDiagram.selectNode(dlLinkedId);
  check(
    'restoring selection from the URL hash selects the right card',
    dlReloadRoot.querySelector('[data-node-id="graph-load"]')?.classList.contains('is-selected')
  );

  // reset the hash so it doesn't bleed into any later check
  dom.window.history.replaceState(null, '', dom.window.location.pathname);

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
