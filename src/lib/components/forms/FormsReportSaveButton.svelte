<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
	import { loadFormsReport, saveFormsReport } from '$lib/features/forms/persistence/formsReport.client';
	import {
		applyLocalFormDraft,
		buildLocalFormDraft,
		hasAnyLocalFormDraft,
		resolveAgencyForContext
	} from '$lib/features/forms/persistence/localFormDraft.client';

	type SyncContext = { type: FormType; year: number } | null;

	let loadState = $state<'idle' | 'loading' | 'loaded' | 'skipped' | 'error'>('idle');
	let saveState = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let statusMessage = $state('');
	let remoteUpdatedAt = $state<string | null>(null);
	let autoLoadKey = $state('');
	let loadController: AbortController | null = null;

	const context = $derived.by<SyncContext>(() => {
		const match = page.url.pathname.match(/^\/forms\/(urban|rural)\/(\d{4})(?:\/|$)/i);
		if (!match) return null;
		return {
			type: match[1].toLowerCase() as FormType,
			year: Number(match[2])
		};
	});

	const visible = $derived(context !== null);
	const agency = $derived.by<string | null>(() => {
		if (!context) return null;
		return resolveAgencyForContext(context.type, context.year, page.url.searchParams.get('agency'));
	});

	const saveDisabled = $derived(!visible || !agency || saveState === 'saving');
	const saveLabel = $derived.by(() => {
		if (saveState === 'saving') return 'Saving...';
		if (saveState === 'saved') return 'Saved';
		return 'Save Changes';
	});

	function buildContextKey(ctx: { type: FormType; year: number }, agencyName: string | null): string {
		return `${ctx.type}:${ctx.year}:${agencyName ?? 'none'}`;
	}

	async function autoLoadRemote(ctx: { type: FormType; year: number }, agencyName: string) {
		loadController?.abort();
		loadController = new AbortController();

		try {
			loadState = 'loading';
			statusMessage = '';

			const hadLocalDraft = hasAnyLocalFormDraft(ctx.type, ctx.year);
			if (hadLocalDraft) {
				loadState = 'skipped';
				return;
			}

			const report = await loadFormsReport({
				agency: agencyName,
				type: ctx.type,
				year: ctx.year,
				signal: loadController.signal
			});

			if (!report) {
				loadState = 'idle';
				return;
			}

			applyLocalFormDraft(ctx.type, ctx.year, report.slices);
			remoteUpdatedAt = report.updatedAt;
			loadState = 'loaded';

			await goto(`${page.url.pathname}${page.url.search}${page.url.hash}`, {
				replaceState: true,
				invalidateAll: true
			});
		} catch (error) {
			if ((error as Error).name === 'AbortError') return;
			loadState = 'error';
			statusMessage = 'Failed to load saved data';
		}
	}

	$effect(() => {
		if (!browser || !context) return;
		const key = buildContextKey(context, agency);
		if (autoLoadKey === key) return;
		autoLoadKey = key;

		if (!agency) {
			loadState = 'idle';
			return;
		}

		void autoLoadRemote(context, agency);
	});

	onDestroy(() => {
		loadController?.abort();
	});

	async function handleSave() {
		if (!context || !agency || saveState === 'saving') return;

		try {
			saveState = 'saving';
			statusMessage = '';
			const slices = buildLocalFormDraft(context.type, context.year);
			const report = await saveFormsReport({
				agency,
				type: context.type,
				year: context.year,
				slices
			});

			remoteUpdatedAt = report.updatedAt;
			saveState = 'saved';
		} catch {
			saveState = 'error';
			statusMessage = 'Failed to save changes';
		}
	}
</script>

{#if visible}
	<div class="flex items-center gap-3">
		{#if statusMessage}
			<span class="text-xs text-red-600 dark:text-red-300">{statusMessage}</span>
		{:else if loadState === 'loaded' && remoteUpdatedAt}
			<span class="text-xs text-zinc-600 dark:text-zinc-300">Loaded from cloud</span>
		{/if}
		<button
			type="button"
			class="h-9 min-w-[112px] rounded-sm border border-[var(--theme-color)] bg-[var(--theme-color)] px-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/25 dark:bg-transparent dark:font-medium dark:hover:bg-white/10"
			onclick={handleSave}
			disabled={saveDisabled}
			title={!agency ? 'Enter CTP Grantee Legal Name in Overview to enable cloud save.' : undefined}
		>
			{saveLabel}
		</button>
	</div>
{/if}
