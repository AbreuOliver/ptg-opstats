// src/lib/theme.ts
export type Theme = 'light' | 'dark';
export const DEFAULT_THEME_COLOR = '#0f5645';
export const THEME_COLORS = [
	'#368df9',
	DEFAULT_THEME_COLOR,
	'#5d60c1',
	'#0040e7',
	'#1965f7',
	'#d40212',
	'#083d47',
	'#17434d'
] as const;
export type ThemeColor = (typeof THEME_COLORS)[number];

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
	root.classList.toggle('dark', next === 'dark'); // <-- critical
	root.style.colorScheme = next;
	localStorage.setItem('theme', next);
}

export function isThemeColor(value: string | null): value is ThemeColor {
	return THEME_COLORS.some((color) => color === value);
}

export function getThemeColor(): ThemeColor {
	const stored = localStorage.getItem('theme-color');
	return isThemeColor(stored) ? stored : DEFAULT_THEME_COLOR;
}

export function setThemeColor(color: ThemeColor) {
	document.documentElement.style.setProperty('--theme-color', color);
	localStorage.setItem('theme-color', color);
}
