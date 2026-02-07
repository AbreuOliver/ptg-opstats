import { browser } from '$app/environment';
import type { GridValues } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';
import type { DaySlug, FormType } from '$lib/features/forms/shared/types/capabilities.types';

export function gridDraftKey(type: FormType, year: number, slug: DaySlug) {
	return `grid:${type}:${year}:${slug}`;
}

export function loadGridDraft(key: string): GridValues | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return null;
		return parsed as GridValues;
	} catch {
		return null;
	}
}

export function saveGridDraft(key: string, values: GridValues) {
	if (!browser) return;
	try {
		localStorage.setItem(key, JSON.stringify(values));
	} catch {
		// ignore
	}
}

export function createGridDraftSaver(key: string) {
	let timer: ReturnType<typeof setTimeout> | null = null;
	return (values: GridValues) => {
		if (!browser) return;
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => saveGridDraft(key, values), 300);
	};
}
