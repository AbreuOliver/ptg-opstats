// src/lib/theme.ts
export type Theme = 'light' | 'dark';

export function getTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
export function setTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', t === 'dark');
  root.style.colorScheme = t;
  localStorage.setItem('theme', t);
}
export function toggleTheme() {
    const root = document.documentElement;
    const next = root.classList.contains('dark') ? 'light' : 'dark';
    root.classList.toggle('dark', next === 'dark');  // <-- critical
    root.style.colorScheme = next;
    localStorage.setItem('theme', next);
}
