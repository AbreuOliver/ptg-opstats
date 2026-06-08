<script lang="ts">
	import { page } from '$app/state';
	import IconLock from '@tabler/icons-svelte/icons/lock';
	import {
		fromAgencyPathSegment,
		toAgencyPathSegment
	} from '$lib/features/forms/persistence/agency';

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? 'An unexpected error occurred.');
	const isForbidden = $derived(status === 403);
	const requestedAgency = $derived.by(() => {
		const segments = page.url.pathname.split('/').filter(Boolean);
		if (segments[0] !== 'forms' || !segments[1]) return null;
		return fromAgencyPathSegment(segments[1]);
	});
	const assignedAgency = $derived.by(() => {
		const value = page.data?.rbac?.selectedAgency ?? page.data?.userScope?.transitSystem;
		return typeof value === 'string' && value.length > 0 ? value : null;
	});
	const formsHref = $derived(
		assignedAgency ? `/forms/${toAgencyPathSegment(assignedAgency)}` : '/forms'
	);
</script>

{#if isForbidden}
	<section class="grid min-h-full w-full place-items-center p-6">
		<div
			class="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-8 text-center shadow-[var(--shadow)]"
		>
			<div
				class="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--theme-color)]"
			>
				<IconLock class="h-6 w-6" />
			</div>
			<h1 class="mt-5 text-2xl font-semibold text-[var(--text)]">Access not available</h1>
			<p class="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
				{#if requestedAgency}
					Your account is not assigned to {requestedAgency}. If you need access, contact your NC
					OpStats administrator.
				{:else}
					{message}
				{/if}
			</p>
			<div class="mt-6 flex flex-wrap justify-center gap-3">
				<a
					href={formsHref}
					class="inline-flex h-10 items-center justify-center rounded-sm border border-[var(--theme-color)] bg-[var(--theme-color)] px-4 text-sm font-semibold text-white transition hover:bg-[color-mix(in_srgb,var(--theme-color)_88%,black_12%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
				>
					Go to My Forms
				</a>
				<a
					href="/dashboard"
					class="inline-flex h-10 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm font-semibold text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--surface-2)_82%,black_8%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
				>
					Back to Dashboard
				</a>
			</div>
			<p class="mt-5 text-xs font-medium text-[var(--text-muted)]">Error 403</p>
		</div>
	</section>
{:else}
	<section class="p-4">
		<h1 class="text-xl font-semibold text-[var(--text)]">{status}</h1>
		<p class="mt-1 text-base font-semibold text-[var(--text)]">{message}</p>
	</section>
{/if}
