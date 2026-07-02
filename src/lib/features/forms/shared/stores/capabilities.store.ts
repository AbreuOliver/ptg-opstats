import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { Capabilities, FormType } from '../types/capabilities.types';
import { assertCapabilities } from '../guards/capabilities.guard';
import { rememberActiveAgency } from '$lib/features/forms/persistence/localFormDraft.client';
import { setFormDraftSnapshot } from '$lib/features/forms/persistence/formDraftRegistry';

export const capabilitiesRevision = writable(0);

export function capabilitiesKey(type: FormType, year: number) {
	return `capabilities:${type}:${year}`;
}

export function loadCapabilities(type: FormType, year: number): Capabilities | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(capabilitiesKey(type, year));
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return assertCapabilities(parsed);
	} catch {
		return null;
	}
}

export function saveCapabilities(type: FormType, year: number, model: Capabilities) {
	if (!browser) return;
	try {
		const key = capabilitiesKey(type, year);
		localStorage.setItem(key, JSON.stringify(model));
		setFormDraftSnapshot(key, model);
		rememberActiveAgency(model.ctpGranteeLegalName ?? '');
		capabilitiesRevision.update((value) => value + 1);
	} catch {
		// ignore
	}
}

export function updateCapabilities(
	type: FormType,
	year: number,
	patchFn: (current: Capabilities) => Capabilities
) {
	const current = loadCapabilities(type, year);
	if (!current) return;
	saveCapabilities(type, year, patchFn(current));
}
