<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import IconLock from '@tabler/icons-svelte/icons/lock';
	import TemporaryToast from '$lib/components/TemporaryToast.svelte';
	import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
	import { isEditableFiscalYear } from '$lib/features/forms/shared/fiscalYearAccess';
	import {
		buildLocalFormDraft,
		clearLocalFormDraft,
		resolveAgencyForContext
	} from '$lib/features/forms/persistence/localFormDraft.client';
	import { saveFormsReport } from '$lib/features/forms/persistence/formsReport.client';

	type SyncContext = { type: FormType; year: number } | null;

	let saveState = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let toast = $state<{
		open: boolean;
		variant: 'success' | 'error';
		title: string;
		message: string;
	} | null>(null);

	const context = $derived.by<SyncContext>(() => {
		const match = page.url.pathname.match(/^\/forms\/[^/]+\/(\d{4})\/(urban|rural)(?:\/|$)/i);
		if (!match) return null;
		return {
			type: match[2].toLowerCase() as FormType,
			year: Number(match[1])
		};
	});

	const visible = $derived(context !== null);
	const currentFiscalYear = $derived.by(() => {
		const now = new Date();
		return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
	});
	const isEditableYear = $derived.by(() => {
		if (!context) return false;
		return isEditableFiscalYear(context.year, currentFiscalYear);
	});
	const scopedAgency = $derived.by<string | null>(() => {
		const value = page.data?.rbac?.selectedAgency;
		return typeof value === 'string' && value.length > 0 ? value : null;
	});
	const agency = $derived.by<string | null>(() => {
		if (!context) return null;
		if (scopedAgency) return scopedAgency;
		return resolveAgencyForContext(context.type, context.year, page.url.searchParams.get('agency'));
	});

	const saveDisabled = $derived(!visible || !agency || !isEditableYear || saveState === 'saving');
	const saveLabel = $derived.by(() => {
		if (saveState === 'saving') return 'Saving...';
		if (saveState === 'saved') return 'Saved';
		return 'Save Changes';
	});
	const activityHref = $derived.by(() => {
		if (!agency) return '/activity';
		return page.data?.userScope?.isSuperAdmin
			? `/activity?agency=${encodeURIComponent(agency)}`
			: '/activity';
	});

	$effect(() => {
		// No cloud snapshot auto-load. Historical pages read from OpStats tables via server loaders.
		if (!browser || !context || !agency) return;
	});

	async function handleSave() {
		if (!context || !agency || saveState === 'saving') return;

		try {
			saveState = 'saving';

			const { type, year } = context;
			await new Promise((resolve) => setTimeout(resolve, 350));
			const slices = buildLocalFormDraft(type, year);
			await saveFormsReport({ agency, type, year, slices });
			clearLocalFormDraft(type, year);

			saveState = 'saved';
			toast = {
				open: true,
				variant: 'success',
				title: 'Saved',
				message: 'Your changes were saved successfully.'
			};
			setTimeout(() => {
				if (saveState === 'saved') saveState = 'idle';
			}, 1200);
		} catch (error) {
			console.error('Failed to save forms report', error);
			saveState = 'error';
			toast = {
				open: true,
				variant: 'error',
				title: 'Save failed',
				message: 'Your changes could not be saved. Local draft data was preserved.'
			};
		}
	}
</script>

{#if visible}
	<div class="flex items-center gap-3">
		{#if !isEditableYear}
			<button
				type="button"
				class="inline-flex h-9 min-w-[112px] items-center justify-center gap-2 rounded-sm bg-amber-300/90 px-3 text-sm font-semibold text-amber-950 opacity-95"
				disabled={true}
				title="Historical fiscal years are read-only."
			>
				<IconLock class="h-4 w-4" />
				Read Only
			</button>
		{:else}
			<button
				type="button"
				class="h-9 min-w-[112px] rounded-sm border border-[var(--theme-color)] bg-[var(--theme-color)] px-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/25 dark:bg-transparent dark:font-medium dark:hover:bg-white/10"
				onclick={handleSave}
				disabled={saveDisabled}
				title={!agency
					? 'Enter CTP Grantee Legal Name in Overview to enable cloud save.'
					: undefined}
			>
				{saveLabel}
			</button>
		{/if}
	</div>
{/if}

{#if toast}
	<TemporaryToast
		open={toast.open}
		variant={toast.variant}
		title={toast.title}
		message={toast.message}
		linkHref={activityHref}
		linkLabel="View activity"
		durationMs={6000}
		onClose={() => (toast = null)}
	/>
{/if}
