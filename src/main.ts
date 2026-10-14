import './style.css';
import { initTheme } from './render/theme';
import { initLanguage } from './render/language';
import { initDiagram } from './render/diagram';
import { initPanel } from './render/panel';
import { initStepper } from './render/stepper';
import { renderGlossary } from './render/glossary';
import { icon } from './render/icons';
import { nodes } from './data/nodes';
import { t, type Lang } from './data/types';
import { ui, APP_NAME } from './data/ui';

const app = document.querySelector<HTMLDivElement>('#app')!;

const { theme: initialTheme, toggle: toggleTheme } = initTheme();
let currentTheme = initialTheme;

const { lang: initialLang, setLang } = initLanguage();

// Deep-linking: the URL hash holds the currently selected node's `slug`
// (e.g. #answer-generator) — stable across languages and URL-safe already,
// unlike its (translated) title. Copying the address bar link reproduces
// the same selected box on load.
const nodeById = new Map(nodes.map((n) => [n.id, n]));
const nodeBySlug = new Map(nodes.map((n) => [n.slug, n.id]));

function slugFromHash(): string | null {
  const raw = window.location.hash.slice(1);
  return raw ? decodeURIComponent(raw) : null;
}

function renderApp(lang: Lang) {
  app.innerHTML = '';

  // ---- topbar (landmark: header) ----
  const topbar = document.createElement('header');
  topbar.className = 'topbar';

  const title = document.createElement('h1');
  title.className = 'topbar__title';
  const titleLink = document.createElement('a');
  titleLink.className = 'topbar__title-link';
  // Relative, not absolute — resolves to this page's own home address
  // (e.g. http://localhost:8080/ in local/Docker testing) regardless of
  // where it ends up deployed, and a plain navigation there also drops any
  // "#node-slug" deep-link hash, landing back on the empty start state.
  titleLink.href = './';
  titleLink.appendChild(icon('waypoints', 19));
  const brandText = document.createElement('span');
  brandText.textContent = APP_NAME;
  titleLink.appendChild(brandText);
  title.appendChild(titleLink);
  topbar.appendChild(title);

  const spacer = document.createElement('div');
  spacer.className = 'flex-1';
  topbar.appendChild(spacer);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn';
  resetBtn.appendChild(icon('rotate-ccw', 15));
  resetBtn.append(t(ui.resetLayout, lang));
  topbar.appendChild(resetBtn);

  const langToggle = document.createElement('div');
  langToggle.className = 'lang-toggle';
  langToggle.setAttribute('role', 'group');
  langToggle.setAttribute('aria-label', t(ui.languageSelectorLabel, lang));
  const langOptions: { value: Lang; label: string }[] = [
    { value: 'en', label: 'EN' },
    { value: 'de', label: 'DE' },
  ];
  for (const { value, label } of langOptions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-toggle__btn';
    btn.classList.toggle('is-active', value === lang);
    btn.setAttribute('aria-pressed', String(value === lang));
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (value === lang) return;
      setLang(value);
      renderApp(value);
    });
    langToggle.appendChild(btn);
  }
  topbar.appendChild(langToggle);

  const themeBtn = document.createElement('button');
  themeBtn.className = 'btn btn--icon';
  themeBtn.setAttribute('aria-label', t(ui.toggleDarkMode, lang));
  function renderThemeIcon(th: 'light' | 'dark') {
    themeBtn.innerHTML = '';
    themeBtn.appendChild(icon(th === 'dark' ? 'sun' : 'moon', 16));
  }
  renderThemeIcon(currentTheme);
  themeBtn.addEventListener('click', () => {
    currentTheme = toggleTheme();
    renderThemeIcon(currentTheme);
  });
  topbar.appendChild(themeBtn);

  app.appendChild(topbar);

  // ---- main content landmark ----
  const main = document.createElement('main');

  // ---- intro ----
  const intro = document.createElement('div');
  intro.className = 'intro';
  intro.innerHTML = `
    <div class="intro__inner">
      <h2 class="sr-only">${t(ui.aboutThisPage, lang)}</h2>
      <p>${t(ui.introP1, lang)}</p>
      <p>${t(ui.introP2, lang)}</p>
      <p>${t(ui.introP3, lang)}</p>
      <div class="intro__legend">
        <span class="intro__legend-item">
          <svg width="28" height="10" viewBox="0 0 28 10" aria-hidden="true"><line x1="1" y1="5" x2="27" y2="5" class="intro__legend-line"/></svg>
          ${t(ui.legendSolid, lang)}
        </span>
        <span class="intro__legend-item">
          <svg width="28" height="10" viewBox="0 0 28 10" aria-hidden="true"><line x1="1" y1="5" x2="27" y2="5" class="intro__legend-line intro__legend-line--dashed"/></svg>
          ${t(ui.legendDashed, lang)}
        </span>
      </div>
    </div>
  `;
  main.appendChild(intro);

  // ---- stepper ----
  const stepperBar = document.createElement('div');
  const stepCaption = document.createElement('div');
  main.appendChild(stepperBar);
  main.appendChild(stepCaption);

  // ---- stage: diagram + panel ----
  const stage = document.createElement('div');
  stage.className = 'stage';
  const diagramRoot = document.createElement('div');
  const panelRoot = document.createElement('div');
  stage.appendChild(diagramRoot);
  stage.appendChild(panelRoot);
  main.appendChild(stage);

  const diagram = initDiagram(diagramRoot, lang);
  const stepper = initStepper(
    stepperBar,
    stepCaption,
    (nodeIds) => {
      diagram.highlightStep(nodeIds);
      if (nodeIds) panel.clear();
    },
    lang,
  );
  const panel = initPanel(
    panelRoot,
    (nodeId) => {
      diagram.selectNode(nodeId || null);
    },
    lang,
  );

  diagram.onSelect((id) => {
    if (id) {
      stepper.clear();
      panel.show(id);
      const slug = nodeById.get(id)?.slug;
      if (slug) history.replaceState(null, '', `#${slug}`);
    } else {
      panel.clear();
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  });

  resetBtn.addEventListener('click', () => diagram.resetLayout());

  app.appendChild(main);

  // ---- glossary ----
  const glossarySection = document.createElement('section');
  glossarySection.id = 'glossary';
  glossarySection.setAttribute('aria-labelledby', 'glossary-title');
  app.appendChild(glossarySection);
  renderGlossary(
    glossarySection,
    (nodeId) => {
      // A glossary term linked to a real box: jump back up to the diagram and
      // select it, same as clicking the box itself or a panel cross-reference.
      diagram.selectNode(nodeId);
      diagramRoot.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    lang,
  );

  // Deep link: if the URL already names a node (from a shared link, or
  // carried over from before a language-toggle rebuild), select it now
  // that the diagram is attached to the page (so scrollIntoView works).
  const linkedId = nodeBySlug.get(slugFromHash() ?? '');
  if (linkedId) diagram.selectNode(linkedId);
}

renderApp(initialLang);
