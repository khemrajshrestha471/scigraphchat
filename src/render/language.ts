import type { Lang } from '../data/types';

const STORAGE_KEY = 'sciflowdiagram-lang';

function getInitialLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved === 'en' || saved === 'de') return saved;
  // Default to German only for visitors whose browser is actually set to
  // German; everyone else gets English, matching the main SciGraphChat
  // app's own language-detection behavior.
  return navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export function initLanguage(): { lang: Lang; setLang: (lang: Lang) => Lang } {
  let lang = getInitialLang();
  return {
    lang,
    setLang: (next: Lang) => {
      lang = next;
      localStorage.setItem(STORAGE_KEY, lang);
      return lang;
    },
  };
}
