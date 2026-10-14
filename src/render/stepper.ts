import { steps } from '../data/steps';
import { t, type Lang } from '../data/types';
import { ui } from '../data/ui';

export interface StepperHandle {
  clear: () => void;
}

export function initStepper(
  barRoot: HTMLElement,
  captionRoot: HTMLElement,
  onStep: (nodeIds: string[] | null) => void,
  lang: Lang,
): StepperHandle {
  barRoot.classList.add('stepper');
  barRoot.setAttribute('role', 'group');
  barRoot.setAttribute('aria-label', t(ui.stepperAriaLabel, lang));
  captionRoot.classList.add('step-caption');
  captionRoot.setAttribute('aria-live', 'polite');

  let activeId: string | null = null;
  const buttons = new Map<string, HTMLButtonElement>();

  function setActive(id: string | null) {
    activeId = id;
    buttons.forEach((btn, btnId) => {
      const isActive = btnId === id;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
    if (id) {
      const step = steps.find((s) => s.id === id)!;
      captionRoot.textContent = t(step.caption, lang);
      captionRoot.classList.add('is-visible');
      onStep(step.nodeIds);
    } else {
      captionRoot.classList.remove('is-visible');
      captionRoot.textContent = '';
      onStep(null);
    }
  }

  for (const step of steps) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'step-btn';
    btn.textContent = t(step.title, lang);
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => setActive(activeId === step.id ? null : step.id));
    buttons.set(step.id, btn);
    barRoot.appendChild(btn);
  }

  return {
    clear: () => setActive(null),
  };
}
