import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
import type { LocalFormSlices } from './formsReport.types';

const liveSnapshots = new Map<string, unknown>();
const remoteSnapshots = new Map<string, unknown>();
const touchedSnapshots = new Map<string, Set<string>>();
export const formSnapshotRevision = writable(0);
const TOUCH_META_SUFFIX = ':touched:v1';

function bumpRevision(): void {
	if (!browser) return;
	formSnapshotRevision.update((value) => value + 1);
}

function draftContextKey(type: FormType, year: number): string {
	return `${type}:${year}`;
}

export function setFormDraftSnapshot(key: string, value: unknown): void {
	if (!browser) return;
	const previous = liveSnapshots.get(key);
	liveSnapshots.set(key, cloneSnapshot(value));
	if (previous !== undefined) {
		const touched = readTouchedSnapshot(key);
		const remote = getFormRemoteSnapshot(key);
		updateTouchedSnapshotFromChange(touched, previous, value, remote);
		writeTouchedSnapshot(key, touched);
	}
	bumpRevision();
}

export function clearFormDraftSnapshot(key: string): void {
	if (!browser) return;
	liveSnapshots.delete(key);
	bumpRevision();
}

export function getFormDraftSnapshot(key: string): unknown | undefined {
	if (!browser) return undefined;
	return liveSnapshots.get(key);
}

export function setFormRemoteSnapshot(key: string, value: unknown): void {
	if (!browser) return;
	remoteSnapshots.set(key, cloneSnapshot(value));
	bumpRevision();
}

export function clearFormRemoteSnapshot(key: string): void {
	if (!browser) return;
	remoteSnapshots.delete(key);
	bumpRevision();
}

export function getFormRemoteSnapshot(key: string): unknown | undefined {
	if (!browser) return undefined;
	return remoteSnapshots.get(key);
}

function safeParse(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function cloneSnapshot<T>(value: T): T {
	if (typeof structuredClone === 'function') {
		try {
			return structuredClone(value);
		} catch {
			// fall through
		}
	}
	if (value == null || typeof value !== 'object') return value;
	return JSON.parse(JSON.stringify(value)) as T;
}

function touchMetaKey(key: string): string {
	return `${key}${TOUCH_META_SUFFIX}`;
}

function encodePath(path: Array<string | number>): string {
	return JSON.stringify(path);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isMeaningfulLegacyValue(value: unknown): boolean {
	if (value == null) return false;
	if (typeof value === 'string') return value.trim() !== '';
	if (typeof value === 'number') return Number.isFinite(value);
	if (typeof value === 'boolean') return true;
	if (Array.isArray(value)) return value.some((entry) => isMeaningfulLegacyValue(entry));
	if (isPlainObject(value)) return Object.values(value).some((entry) => isMeaningfulLegacyValue(entry));
	return true;
}

function readTouchedSnapshot(key: string): Set<string> {
	const live = touchedSnapshots.get(key);
	if (live) return new Set(live);

	if (!browser) return new Set();
	try {
		const raw = localStorage.getItem(touchMetaKey(key));
		if (!raw) return new Set();
		const parsed = safeParse(raw);
		if (!Array.isArray(parsed)) return new Set();
		return new Set(parsed.filter((entry): entry is string => typeof entry === 'string'));
	} catch {
		return new Set();
	}
}

function writeTouchedSnapshot(key: string, touched: Set<string>): void {
	touchedSnapshots.set(key, new Set(touched));
	if (!browser) return;
	try {
		if (touched.size === 0) localStorage.removeItem(touchMetaKey(key));
		else localStorage.setItem(touchMetaKey(key), JSON.stringify([...touched]));
	} catch {
		// ignore storage failures; touched state only affects the current session
	}
}

function markTouch(touched: Set<string>, path: Array<string | number>): void {
	touched.add(encodePath(path));
}

function clearTouch(touched: Set<string>, path: Array<string | number>): void {
	touched.delete(encodePath(path));
}

function isTouchMarked(touched: Set<string>, path: Array<string | number>): boolean {
	return touched.has(encodePath(path));
}

function isSpecialSelectedModesPath(path: Array<string | number>): boolean {
	return path[path.length - 1] === 'selectedModes';
}

function hasAnyLegacyMetadata(key: string): boolean {
	if (!browser) return false;
	try {
		return localStorage.getItem(touchMetaKey(key)) !== null;
	} catch {
		return false;
	}
}

function inferTouchedSnapshot(
	remote: unknown,
	local: unknown,
	path: Array<string | number> = []
): Set<string> {
	const touched = new Set<string>();

	if (isSpecialSelectedModesPath(path)) {
		if (!deepEqual(remote, local) && isMeaningfulLegacyValue(local)) markTouch(touched, path);
		return touched;
	}

	if (Array.isArray(remote) || Array.isArray(local)) {
		if (!Array.isArray(remote) || !Array.isArray(local)) {
			if (!deepEqual(remote, local) && isMeaningfulLegacyValue(local)) markTouch(touched, path);
			return touched;
		}

		const maxLength = Math.max(remote.length, local.length);
		for (let index = 0; index < maxLength; index++) {
			const childTouched = inferTouchedSnapshot(remote[index], local[index], [...path, index]);
			for (const childPath of childTouched) touched.add(childPath);
		}

		if (touched.size === 0 && !deepEqual(remote, local) && isMeaningfulLegacyValue(local)) {
			markTouch(touched, path);
		}

		return touched;
	}

	if (isPlainObject(remote) || isPlainObject(local)) {
		const remoteRecord = isPlainObject(remote) ? remote : {};
		const localRecord = isPlainObject(local) ? local : {};
		const keys = new Set([...Object.keys(remoteRecord), ...Object.keys(localRecord)]);
		for (const key of keys) {
			const childTouched = inferTouchedSnapshot(remoteRecord[key], localRecord[key], [...path, key]);
			for (const childPath of childTouched) touched.add(childPath);
		}
		return touched;
	}

	if (!deepEqual(remote, local) && isMeaningfulLegacyValue(local)) markTouch(touched, path);
	return touched;
}

function updateTouchedSnapshotFromChange(
	touched: Set<string>,
	previous: unknown,
	next: unknown,
	remote: unknown,
	path: Array<string | number> = []
): void {
	if (isSpecialSelectedModesPath(path)) {
		if (deepEqual(next, remote)) clearTouch(touched, path);
		else if (!deepEqual(previous, next)) markTouch(touched, path);
		return;
	}

	if (Array.isArray(previous) || Array.isArray(next)) {
		if (!Array.isArray(previous) || !Array.isArray(next)) {
			if (deepEqual(next, remote)) clearTouch(touched, path);
			else if (!deepEqual(previous, next)) markTouch(touched, path);
			return;
		}

		const maxLength = Math.max(previous.length, next.length);
		for (let index = 0; index < maxLength; index++) {
			updateTouchedSnapshotFromChange(
				touched,
				previous[index],
				next[index],
				Array.isArray(remote) ? remote[index] : undefined,
				[...path, index]
			);
		}
		if (deepEqual(next, remote)) clearTouch(touched, path);
		return;
	}

	if (isPlainObject(previous) || isPlainObject(next)) {
		const previousRecord = isPlainObject(previous) ? previous : {};
		const nextRecord = isPlainObject(next) ? next : {};
		const remoteRecord = isPlainObject(remote) ? remote : {};
		const keys = new Set([...Object.keys(previousRecord), ...Object.keys(nextRecord)]);
		for (const key of keys) {
			updateTouchedSnapshotFromChange(
				touched,
				previousRecord[key],
				nextRecord[key],
				remoteRecord[key],
				[...path, key]
			);
		}
		return;
	}

	if (deepEqual(next, remote)) clearTouch(touched, path);
	else if (!deepEqual(previous, next)) markTouch(touched, path);
}

function mergeSnapshotValue(
	remote: unknown,
	local: unknown,
	touched: Set<string>,
	path: Array<string | number> = []
): unknown {
	if (isSpecialSelectedModesPath(path)) {
		return isTouchMarked(touched, path) || deepEqual(remote, local)
			? local
			: remote;
	}

	if (Array.isArray(remote) || Array.isArray(local)) {
		if (!Array.isArray(remote) || !Array.isArray(local)) {
			return isTouchMarked(touched, path) || isMeaningfulLegacyValue(local) ? local : remote;
		}

		const maxLength = Math.max(remote.length, local.length);
		return Array.from({ length: maxLength }, (_, index) =>
			mergeSnapshotValue(remote[index], local[index], touched, [...path, index])
		);
	}

	if (isPlainObject(remote) || isPlainObject(local)) {
		const remoteRecord = isPlainObject(remote) ? remote : {};
		const localRecord = isPlainObject(local) ? local : {};
		const keys = new Set([...Object.keys(remoteRecord), ...Object.keys(localRecord)]);
		const merged: Record<string, unknown> = {};
		for (const key of keys) {
			merged[key] = mergeSnapshotValue(remoteRecord[key], localRecord[key], touched, [...path, key]);
		}
		return merged;
	}

	if (isTouchMarked(touched, path)) return local;
	if (!deepEqual(remote, local) && isMeaningfulLegacyValue(local)) return local;
	return remote;
}

export function resolveFormDraftSnapshot(
	key: string,
	remote: unknown,
	local: unknown
): unknown {
	if (!browser) return remote;
	const hasMeta = hasAnyLegacyMetadata(key);
	const touched = hasMeta ? readTouchedSnapshot(key) : inferTouchedSnapshot(remote, local);
	const merged = mergeSnapshotValue(remote, local, touched);
	writeTouchedSnapshot(key, touched);
	liveSnapshots.set(key, cloneSnapshot(merged));
	remoteSnapshots.set(key, cloneSnapshot(remote));
	bumpRevision();
	return merged;
}

export function loadResolvedFormDraftSnapshot<T>(
	key: string,
	remote: unknown,
	normalize: (value: unknown) => T = (value) => value as T
): T {
	if (!browser) return remote as T;

	try {
		const liveSnapshot = getFormDraftSnapshot(key);
		const raw = localStorage.getItem(key);
		const parsed = raw ? safeParse(raw) : undefined;
		const source = liveSnapshot ?? parsed ?? remote;
		return resolveFormDraftSnapshot(key, remote, normalize(source)) as T;
	} catch {
		return resolveFormDraftSnapshot(key, remote, normalize(remote)) as T;
	}
}

export function listFormTouchStorageKeys(type: FormType, year: number): string[] {
	return listFormStorageKeys(type, year).map((key) => touchMetaKey(key));
}

export function clearFormDraftTouchState(key: string): void {
	if (!browser) return;
	touchedSnapshots.delete(key);
	try {
		localStorage.removeItem(touchMetaKey(key));
	} catch {
		// ignore
	}
	bumpRevision();
}

export function listFormStorageKeys(type: FormType, year: number): string[] {
	return [
		`capabilities:${type}:${year}`,
		`grid:${type}:${year}:weekday`,
		`grid:${type}:${year}:saturday`,
		`grid:${type}:${year}:sunday`,
		`finance:${type}:${year}:urban-financial`,
		`finance:${type}:${year}:rural-financial:descriptions`,
		`completion:${type}:${year}:rural`,
		`reconciliation:${type}:${year}:urban`,
		`assaults:${type}:${year}:physical-assaults`,
		`assaults:${type}:${year}:non-physical-assaults`,
		`annual-statistics:${type}:${year}`,
		`other-safety-security:${type}:${year}:v2`
	];
}

export function buildCurrentFormDraft(type: FormType, year: number): LocalFormSlices {
	if (!browser) return {};

	const slices: LocalFormSlices = {};
	for (const key of listFormStorageKeys(type, year)) {
		const liveSnapshot = getFormDraftSnapshot(key);
		if (liveSnapshot !== undefined) {
			slices[key] = liveSnapshot;
			continue;
		}

		const raw = localStorage.getItem(key);
		if (!raw) continue;
		slices[key] = safeParse(raw);
	}

	return slices;
}

export function clearFormDraftSnapshotsForContext(type: FormType, year: number): void {
	if (!browser) return;
	const prefix = `${draftContextKey(type, year)}:`;
	let changed = false;
	for (const key of [...liveSnapshots.keys()]) {
		if (key.startsWith(prefix)) {
			liveSnapshots.delete(key);
			changed = true;
		}
	}
	for (const key of [...remoteSnapshots.keys()]) {
		if (key.startsWith(prefix)) {
			remoteSnapshots.delete(key);
			changed = true;
		}
	}
	for (const key of [...touchedSnapshots.keys()]) {
		if (key.startsWith(prefix)) {
			touchedSnapshots.delete(key);
			try {
				localStorage.removeItem(touchMetaKey(key));
			} catch {
				// ignore
			}
			changed = true;
		}
	}
	if (changed) bumpRevision();
}

function hasSelectedMode(value: unknown, modeId: string): boolean {
	if (!isPlainObject(value)) return false;
	const selectedModes = value.selectedModes;
	if (!Array.isArray(selectedModes)) return false;
	const normalizedModeId = modeId.trim().toLowerCase();
	return selectedModes.some((entry) => String(entry).trim().toLowerCase() === normalizedModeId);
}

export function getSnapshotPath(value: unknown, path: Array<string | number> = []): unknown {
	let current = value;
	for (const segment of path) {
		if (current == null) return undefined;
		if (Array.isArray(current) && typeof segment === 'number') {
			current = current[segment];
			continue;
		}
		if (isPlainObject(current)) {
			current = current[String(segment)];
			continue;
		}
		return undefined;
	}
	return current;
}

export function isSnapshotDirty(
	key: string,
	path: Array<string | number> = []
): boolean | null {
	if (!browser) return null;
	const current = getFormDraftSnapshot(key);
	const remote = getFormRemoteSnapshot(key);
	if (current === undefined && remote === undefined) return null;
	return !deepEqual(getSnapshotPath(remote, path), getSnapshotPath(current, path));
}

export function isSnapshotTouched(
	key: string,
	path: Array<string | number> = []
): boolean | null {
	if (!browser) return null;
	const current = getFormDraftSnapshot(key);
	const remote = getFormRemoteSnapshot(key);
	if (current === undefined && remote === undefined) return null;
	return isTouchMarked(readTouchedSnapshot(key), path);
}

export function isSelectedModeDirty(key: string, modeId: string): boolean | null {
	if (!browser) return null;
	const current = getFormDraftSnapshot(key);
	const remote = getFormRemoteSnapshot(key);
	if (current === undefined && remote === undefined) return null;
	return hasSelectedMode(current, modeId) !== hasSelectedMode(remote, modeId);
}

export function hasAnyDirtyFormChanges(type: FormType, year: number): boolean {
	if (!browser) return false;
	return listFormStorageKeys(type, year).some((key) => isSnapshotDirty(key) === true);
}

export function deepEqual(left: unknown, right: unknown): boolean {
	if (Object.is(left, right)) return true;
	if (typeof left !== typeof right) return false;
	if (left == null || right == null) return false;
	if (typeof left !== 'object' || typeof right !== 'object') return false;

	if (Array.isArray(left) || Array.isArray(right)) {
		if (!Array.isArray(left) || !Array.isArray(right)) return false;
		if (left.length !== right.length) return false;
		for (let index = 0; index < left.length; index++) {
			if (!deepEqual(left[index], right[index])) return false;
		}
		return true;
	}

	const leftKeys = Object.keys(left as Record<string, unknown>);
	const rightKeys = Object.keys(right as Record<string, unknown>);
	if (leftKeys.length !== rightKeys.length) return false;

	for (const key of leftKeys) {
		if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
		if (!deepEqual((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]))
			return false;
	}

	return true;
}
