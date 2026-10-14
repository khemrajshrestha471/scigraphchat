import { glossary } from '../data/glossary';
import { t, type Lang } from '../data/types';
import { ui } from '../data/ui';
import { icon } from './icons';

export function renderGlossary(root: HTMLElement, onLink: (nodeId: string) => void, lang: Lang) {
  root.classList.add('glossary');

  const title = document.createElement('h2');
  title.id = 'glossary-title';
  title.className = 'glossary__title';
  title.textContent = t(ui.glossaryTitle, lang);
  root.appendChild(title);

  const intro = document.createElement('p');
  intro.className = 'glossary__intro';
  intro.textContent = t(ui.glossaryIntro, lang);
  root.appendChild(intro);

  // <dl> is the semantically correct element for a list of term/definition
  // pairs (WCAG 1.3.1) — each pair is still wrapped in its own bordered
  // card via a <div>, which the dl/dt/dd content model explicitly allows.
  const grid = document.createElement('dl');
  grid.className = 'glossary__grid';

  for (const { term, definition, relatedNodeId, externalUrl } of glossary) {
    const card = document.createElement('div');
    card.className = 'glossary__card';

    const dt = document.createElement('dt');
    if (relatedNodeId) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'glossary__term glossary__card--linked';
      const label = document.createElement('span');
      label.textContent = t(term, lang);
      const hint = document.createElement('span');
      hint.className = 'glossary__link-hint';
      hint.append(icon('waypoints', 11), document.createTextNode(' ' + t(ui.glossaryShowInDiagram, lang)));
      btn.append(label, hint);
      btn.addEventListener('click', () => onLink(relatedNodeId));
      dt.appendChild(btn);
    } else {
      dt.className = 'glossary__term';
      dt.textContent = t(term, lang);
    }
    card.appendChild(dt);

    const dd = document.createElement('dd');
    dd.className = 'glossary__def';
    dd.textContent = t(definition, lang);
    card.appendChild(dd);

    if (externalUrl) {
      const extLink = document.createElement('a');
      extLink.className = 'glossary__external-link';
      extLink.href = externalUrl;
      extLink.target = '_blank';
      extLink.rel = 'noopener noreferrer';
      extLink.append(
        document.createTextNode(externalUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')),
        icon('external-link', 11)
      );
      card.appendChild(extLink);
    }

    grid.appendChild(card);
  }
  root.appendChild(grid);
}
