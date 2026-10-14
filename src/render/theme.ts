export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'sciflowdiagram-theme';

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(STORAGE_KEY, theme);
}

export function initTheme(): { theme: Theme; toggle: () => Theme } {
  let theme = getInitialTheme();
  applyTheme(theme);
  return {
    theme,
    toggle: () => {
      theme = theme === 'light' ? 'dark' : 'light';
      applyTheme(theme);
      return theme;
    },
  };
}
