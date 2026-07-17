<!-- <script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();

	let type = $derived(() => page.params.type);
	let year = $derived(() => page.params.year);
	let agency = $derived(() => page.params.agency);
	let path = $derived(() => page.url.pathname);

	const currentTabs = ['overview', 'weekday', 'saturday', 'sunday', 'finance'];

	function isActiveTab(tab: string) {
		const segments = path().split('/').filter(Boolean);
		return segments.at(-1) === tab;
	}
</script>


<div class="flex flex-col min-h-[75vh] max-w-screen min-w-[85vw] overflow-hidden rounded-b-xl rounded-tr-xl bg-transparent pt-0 shadow-none justify-center mt-10"
style="box-shadow: -6px 8px 16px rgba(0,0,0,0.04);">
	<div class="flex items-center gap-0.25 border-b border-neutral-300 bg-transparent px-0 pt-2">
		{#each currentTabs as tab}
			<a
				href={`/forms/${agency()}/${year()}/${type()}/${tab}`}
				class={`text-md min-w-40 rounded-t-xl border px-4 pt-2.5 pb-2 -mt-2 font-semibold capitalize border-b -mb-0.5
              ${
					isActiveTab(tab)
					? 'border-b-0 border-neutral-300 bg-white text-indigo-700 '
					: 'border-b-0 border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-00'
				}
            `}
				aria-current={isActiveTab(tab) ? 'page' : undefined}
			>
				{tab.replace('-', ' ')}
			</a>
		{/each}
	</div>

	<div class="flex flex-col flex-grow w-full border-t-0 bg-white border-2 border-l border-r border-b border-neutral-300 rounded-b-xl">
		<div class="min-w-full flex flex-col grow-1 justify-start p-8 items-start bg-white rounded-b-xl">
		{@render children()}
		</div>
	  </div>
</div> -->

<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import UnsavedChangesModal from '$lib/components/forms/UnsavedChangesModal.svelte';
	import { formSnapshotRevision, hasAnyDirtyFormChanges } from '$lib/features/forms/persistence/formDraftRegistry';
	import { isEditableFiscalYear } from '$lib/features/forms/shared/fiscalYearAccess';
	import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
	import { onDestroy } from 'svelte';

	let { children } = $props();
	const currentFiscalYear = $derived.by(() => {
		const now = new Date();
		return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
	});
	const readonlyYear = $derived.by(() => {
		const year = Number(page.params.year);
		if (!Number.isFinite(year)) return false;
		return !isEditableFiscalYear(year, currentFiscalYear);
	});
	const hasDirtyChanges = $derived.by(() => {
		$formSnapshotRevision;
		const year = Number(page.params.year);
		if (!Number.isFinite(year)) return false;
		if (!page.params.type) return false;
		if (!isEditableFiscalYear(year, currentFiscalYear)) return false;
		return hasAnyDirtyFormChanges(page.params.type as FormType, year);
	});
	let unsavedChangesModalOpen = $state(false);
	let pendingNavigationHref = $state<string | null>(null);
	let allowNextNavigation = false;

	beforeNavigate((navigation) => {
		if (!browser || allowNextNavigation || !hasDirtyChanges) return;
		if (!navigation.to) return;
		if (navigation.to.url.href === page.url.href) return;

		if (navigation.willUnload) {
			return;
		}

		navigation.cancel();
		pendingNavigationHref = navigation.to.url.href;
		unsavedChangesModalOpen = true;
	});

	$effect(() => {
		if (!browser || !hasDirtyChanges) return;

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!hasDirtyChanges) return;
			event.preventDefault();
			event.returnValue = '';
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	});

	function closeUnsavedChangesModal() {
		unsavedChangesModalOpen = false;
		pendingNavigationHref = null;
	}

	async function leaveUnsavedChanges() {
		if (!pendingNavigationHref) return;
		const target = pendingNavigationHref;
		closeUnsavedChangesModal();
		allowNextNavigation = true;
		try {
			await goto(target, { invalidateAll: true });
		} finally {
			queueMicrotask(() => {
				allowNextNavigation = false;
			});
		}
	}
</script>

<div class="forms-theme-values" class:readonly-year={readonlyYear}>
	{@render children()}
</div>

<UnsavedChangesModal
	open={unsavedChangesModalOpen}
	onStay={closeUnsavedChangesModal}
	onLeave={leaveUnsavedChanges}
/>

<style>
	:global(.readonly-year input),
	:global(.readonly-year textarea),
	:global(.readonly-year select) {
		pointer-events: none;
	}
</style>
