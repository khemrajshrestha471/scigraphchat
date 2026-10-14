import { categories } from '../data/categories';
import { nodes } from '../data/nodes';
import { t, type FlowNode, type Lang } from '../data/types';
import { ui } from '../data/ui';
import { icon } from './icons';

const categoryById = new Map(categories.map((c) => [c.id, c]));
const nodeById = new Map(nodes.map((n) => [n.id, n]));

/** Nodes that list `id` in their own talksTo — i.e. the reverse direction,
 * computed once rather than hand-maintained in the data file. */
function usedByOf(id: string): FlowNode[] {
  return nodes.filter((n) => n.talksTo.includes(id));
}

export interface PanelHandle {
  show: (nodeId: string) => void;
  clear: () => void;
}

export function initPanel(
  root: HTMLElement,
  onNavigate: (nodeId: string) => void,
  lang: Lang,
): PanelHandle {
  root.classList.add('panel');
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', t(ui.panelRegionLabel, lang));
  // Announces content swaps to screen reader users without needing focus to
  // move there — important since most selections happen via mouse/touch on
  // the diagram, not by tabbing into the panel itself.
  root.setAttribute('aria-live', 'polite');

  function renderEmpty() {
    root.innerHTML = '';
    root.classList.remove('is-open');
    const p = document.createElement('p');
    p.className = 'panel__empty';
    p.textContent = t(ui.panelEmpty, lang);
    root.appendChild(p);
  }

  function renderNode(nodeId: string) {
    const n = nodeById.get(nodeId);
    if (!n) return;
    const cat = categoryById.get(n.categoryId)!;
    const usedBy = usedByOf(nodeId);

    root.innerHTML = '';
    root.classList.add('is-open');
    root.style.setProperty('--cat-color', cat.color);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'panel__close';
    closeBtn.setAttribute('aria-label', t(ui.panelClose, lang));
    closeBtn.appendChild(icon('x', 16));
    closeBtn.addEventListener('click', () => onNavigate(''));
    root.appendChild(closeBtn);

    const header = document.createElement('div');
    header.className = 'panel__header';
    header.appendChild(icon(n.icon, 22));
    const titleWrap = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'panel__title';
    title.textContent = t(n.title, lang);
    // Programmatically focusable (not in tab order otherwise) so keyboard
    // users who just activated a box land directly on its details instead
    // of having to tab all the way across the canvas to reach the panel.
    title.tabIndex = -1;
    titleWrap.appendChild(title);
    header.appendChild(titleWrap);
    root.appendChild(header);

    const slug = document.createElement('div');
    slug.className = 'panel__slug';
    slug.textContent = n.slug;
    root.appendChild(slug);

    const catBadge = document.createElement('div');
    catBadge.className = 'panel__category';
    catBadge.appendChild(icon(cat.icon, 12));
    const catLabel = document.createElement('span');
    catLabel.textContent = t(cat.title, lang);
    catBadge.appendChild(catLabel);
    root.appendChild(catBadge);

    const summary = document.createElement('p');
    summary.className = 'panel__summary';
    summary.textContent = t(n.summary, lang);
    root.appendChild(summary);

    const desc = document.createElement('p');
    desc.className = 'panel__desc';
    desc.textContent = t(n.description, lang);
    root.appendChild(desc);

    const fitsTitle = document.createElement('div');
    fitsTitle.className = 'panel__section-title';
    fitsTitle.textContent = t(ui.panelHowItFits, lang);
    root.appendChild(fitsTitle);
    const fits = document.createElement('p');
    fits.className = 'panel__fits';
    fits.textContent = t(n.howItFits, lang);
    root.appendChild(fits);

    appendLinkList(t(ui.panelTalksTo, lang), n.talksTo);
    appendLinkList(t(ui.panelUsedBy, lang), usedBy.map((u) => u.id));

    if (n.technicalDetails.length > 0) {
      const tech = document.createElement('div');
      tech.className = 'panel__tech';
      const toggle = document.createElement('button');
      toggle.className = 'panel__tech-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      const chev = icon('chevron-down', 14);
      toggle.append(t(ui.panelTechnicalDetails, lang), chev);
      const list = document.createElement('ul');
      list.className = 'panel__tech-list';
      for (const detail of n.technicalDetails) {
        const li = document.createElement('li');
        li.textContent = detail;
        list.appendChild(li);
      }
      toggle.addEventListener('click', () => {
        const open = list.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      });
      tech.appendChild(toggle);
      tech.appendChild(list);
      root.appendChild(tech);
    }

    // preventScroll: the diagram already scrolls the *clicked node* into
    // view on selection — focusing the panel title too (so keyboard/screen
    // reader users land on it immediately) shouldn't also yank the page
    // toward the sidebar and fight that.
    title.focus({ preventScroll: true });

    function appendLinkList(sectionTitle: string, ids: string[]) {
      if (ids.length === 0) return;
      const sectionTitleEl = document.createElement('div');
      sectionTitleEl.className = 'panel__section-title';
      sectionTitleEl.textContent = sectionTitle;
      root.appendChild(sectionTitleEl);
      const ul = document.createElement('ul');
      ul.className = 'panel__list';
      for (const targetId of ids) {
        const target = nodeById.get(targetId);
        if (!target) continue;
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.textContent = t(target.title, lang);
        btn.addEventListener('click', () => onNavigate(targetId));
        li.appendChild(btn);
        ul.appendChild(li);
      }
      root.appendChild(ul);
    }
  }

  renderEmpty();

  return {
    show: renderNode,
    clear: renderEmpty,
  };
}
