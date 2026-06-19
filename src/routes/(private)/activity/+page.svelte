<script lang="ts">
	import IconInfoCircle from '@tabler/icons-svelte/icons/info-circle';
	import IconX from '@tabler/icons-svelte/icons/x';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let selectedEvent = $state<PageData['events'][number] | null>(null);

	const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/New_York',
		month: '2-digit',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
	const tooltipDateFormatter = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/New_York',
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		timeZoneName: 'short'
	});
	const numberFormatter = new Intl.NumberFormat('en-US');

	function actionLabel(action: string): string {
		if (action === 'auth.sign_in') return 'Signed in';
		if (action === 'forms.save_succeeded') return 'Saved form changes';
		if (action === 'forms.save_failed') return 'Failed to save form changes';
		return action.replace(/[._-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
	}

	function formatMetadata(metadata: Record<string, unknown> | null): string {
		if (!metadata || Object.keys(metadata).length === 0) return '';
		if (typeof metadata.summary === 'string') return metadata.summary;
		const parts: string[] = [];
		if (typeof metadata.type === 'string') {
			parts.push(metadata.type.charAt(0).toUpperCase() + metadata.type.slice(1));
		}
		if (typeof metadata.year === 'number') parts.push(`FY${metadata.year}`);
		if (typeof metadata.changeCount === 'number') parts.push(`${metadata.changeCount} changes`);
		if (typeof metadata.reason === 'string') parts.push(metadata.reason.replace(/_/g, ' '));
		return parts.join(' · ');
	}

	function eventDetailsLabel(event: PageData['events'][number]): string {
		if (event.action === 'auth.sign_in') return 'User signed in successfully';
		return formatMetadata(event.metadata) || event.entityId || 'View details';
	}

	function canOpenDetails(event: PageData['events'][number]): boolean {
		return event.action !== 'auth.sign_in';
	}

	function formatShortTime(value: string): string {
		const parts = shortDateFormatter.formatToParts(new Date(value));
		const month = parts.find((part) => part.type === 'month')?.value ?? '';
		const day = parts.find((part) => part.type === 'day')?.value.padStart(2, '0') ?? '';
		const hour = parts.find((part) => part.type === 'hour')?.value ?? '';
		const minute = parts.find((part) => part.type === 'minute')?.value ?? '';
		const dayPeriod = parts.find((part) => part.type === 'dayPeriod')?.value ?? '';
		return `${month}/${day} • ${hour}:${minute} ${dayPeriod}`;
	}

	function formatTooltipTime(value: string): string {
		return tooltipDateFormatter.format(new Date(value)).replace(',', ' •');
	}

	function formatUserTooltip(event: PageData['events'][number]): string {
		return event.userEmail
			? `${event.userDisplayName ?? 'Unknown'}\n${event.userEmail}`
			: (event.userDisplayName ?? 'Unknown');
	}

	function getChanges(event: PageData['events'][number]) {
		const changes = event.metadata?.changes;
		if (!Array.isArray(changes)) return [];
		return changes
			.filter((change): change is { field?: unknown; from?: unknown; to?: unknown } => {
				return Boolean(change && typeof change === 'object');
			})
			.filter((change) => typeof change.field === 'string');
	}

	function formatValue(value: unknown): string {
		if (value == null || value === '') return 'blank';
		if (typeof value === 'number') return numberFormatter.format(value);
		return String(value);
	}
</script>

<section class="flex min-h-0 flex-1 flex-col gap-4">
	<!-- <div class="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
		<h2 class="text-lg font-semibold text-[var(--text)]">Activity Log</h2>
		<p class="mt-1 text-sm text-[var(--text-muted)]">
			{#if data.selectedAgency}
				Recent activity for {data.selectedAgency}.
			{:else}
				Recent activity across available transit systems.
			{/if}
		</p>
	</div> -->

	<div
		class="min-h-0 flex-1 overflow-scroll rounded-lg border border-[var(--border)] bg-[var(--surface-1)]"
	>
		{#if data.events.length === 0}
			<div class="p-4 text-sm text-[var(--text-muted)]">No activity has been logged yet.</div>
		{:else}
			<div class="overflow-auto">
				<table class="min-w-full text-left text-sm">
					<thead
						class="sticky top-0 bg-[var(--surface-2)] text-xs text-[var(--text-muted)] uppercase"
					>
						<tr>
							<th class="px-4 py-3 font-semibold">Time</th>
							<th class="px-4 py-3 font-semibold">User</th>
							<th class="px-4 py-3 font-semibold">Action</th>
							{#if data.isSuperAdmin}
								<th class="px-4 py-3 font-semibold">Agency</th>
							{/if}
							<th class="px-4 py-3 font-semibold">Details</th>
						</tr>
					</thead>
					<tbody>
						{#each data.events as event}
							<tr class="border-t border-[var(--border)]">
								<td
									class="px-4 py-3 whitespace-nowrap text-[var(--text-muted)]"
									title={formatTooltipTime(event.createdAt)}
								>
									<div class="flex items-center gap-2">
										<time datetime={event.createdAt}>{formatShortTime(event.createdAt)}</time>
										<span>
											<IconInfoCircle
												class="h-4 w-4 shrink-0 text-[var(--text-muted)] opacity-70"
												aria-label="Full timestamp"
											/>
										</span>
									</div>
								</td>
								<td class="px-4 py-3 text-[var(--text)]" title={formatUserTooltip(event)}>
									<div class="flex items-center gap-2">
										<span>{event.userDisplayName ?? 'Unknown'}</span>
										<span>
											<IconInfoCircle
												class="h-4 w-4 shrink-0 text-[var(--text-muted)] opacity-70"
												aria-label="User details"
											/>
										</span>
									</div>
								</td>
								<td class="px-4 py-3 font-medium text-[var(--text)]">{actionLabel(event.action)}</td
								>
								{#if data.isSuperAdmin}
									<td class="px-4 py-3 text-[var(--text-muted)]">{event.agency ?? '—'}</td>
								{/if}
								<td class="px-4 py-3 text-[var(--text-muted)]">
									{#if canOpenDetails(event)}
										<button
											type="button"
											class="text-left text-[var(--theme-color)] underline-offset-2 hover:underline dark:text-[var(--accent-color)]"
											onclick={() => (selectedEvent = event)}
										>
											{eventDetailsLabel(event)}
										</button>
									{:else}
										<span>{eventDetailsLabel(event)}</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</section>

{#if selectedEvent}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/35 p-4 backdrop-blur-sm"
		role="presentation"
		onclick={() => (selectedEvent = null)}
	>
		<div
			class="relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl border-2 border-neutral-600/20 bg-white/70 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/80"
			role="dialog"
			aria-modal="true"
			aria-labelledby="activity-detail-title"
			tabindex="-1"
			onclick={(event) => event.stopPropagation()}
			onkeydown={(event) => {
				if (event.key === 'Escape') selectedEvent = null;
			}}
		>
			<div
				class="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/85 via-white/65 to-[color-mix(in_srgb,var(--theme-color)_14%,white)] dark:from-neutral-900/90 dark:via-neutral-900/75 dark:to-[color-mix(in_srgb,var(--theme-color)_22%,#171717)]"
			></div>
			<header
				class="relative z-10 flex items-start justify-between gap-4 border-b-2 border-neutral-600/10 px-6 py-5 dark:border-white/10"
			>
				<div>
					<h2
						id="activity-detail-title"
						class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white"
					>
						{actionLabel(selectedEvent.action)}
					</h2>
					<p class="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
						{formatTooltipTime(selectedEvent.createdAt)}
					</p>
				</div>
				<button
					type="button"
					class="rounded p-1 text-neutral-600 transition hover:bg-black/5 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
					aria-label="Close activity details"
					onclick={() => (selectedEvent = null)}
				>
					<IconX class="h-5 w-5" />
				</button>
			</header>

			<div class="relative z-10 max-h-[calc(85vh-6rem)] overflow-auto p-6">
				<div class="grid gap-3 text-sm sm:grid-cols-2">
					<div>
						<div class="text-xs font-semibold text-neutral-600 uppercase dark:text-neutral-300">
							User
						</div>
						<div class="mt-1 text-neutral-900 dark:text-neutral-100">
							{selectedEvent.userDisplayName ?? 'Unknown'}
							{#if selectedEvent.userEmail}
								<span class="text-neutral-600 dark:text-neutral-300"
									>({selectedEvent.userEmail})</span
								>
							{/if}
						</div>
					</div>
					<div>
						<div class="text-xs font-semibold text-neutral-600 uppercase dark:text-neutral-300">
							Agency
						</div>
						<div class="mt-1 text-neutral-900 dark:text-neutral-100">
							{selectedEvent.agency ?? '—'}
						</div>
					</div>
					<div>
						<div class="text-xs font-semibold text-neutral-600 uppercase dark:text-neutral-300">
							Entity
						</div>
						<div class="mt-1 text-neutral-900 dark:text-neutral-100">
							{selectedEvent.entityId ?? '—'}
						</div>
					</div>
					<div>
						<div class="text-xs font-semibold text-neutral-600 uppercase dark:text-neutral-300">
							Details
						</div>
						<div class="mt-1 text-neutral-900 dark:text-neutral-100">
							{formatMetadata(selectedEvent.metadata) || '—'}
						</div>
					</div>
				</div>

				<div class="mt-6">
					<h3 class="text-sm font-bold text-neutral-900 dark:text-white">Changes</h3>
					{#if getChanges(selectedEvent).length === 0}
						<p class="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
							No field-level diff was captured for this event.
						</p>
					{:else}
						<div
							class="mt-3 max-h-80 overflow-auto rounded-xl border-2 border-neutral-600/20 bg-white/65 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10"
						>
							<table class="min-w-full text-left text-sm">
								<thead
									class="sticky top-0 bg-neutral-200/90 text-xs text-neutral-600 uppercase backdrop-blur-sm dark:bg-neutral-900/90 dark:text-neutral-300"
								>
									<tr>
										<th class="px-3 py-2 font-semibold">Field</th>
										<th class="px-3 py-2 font-semibold">Before</th>
										<th class="px-3 py-2 font-semibold">After</th>
									</tr>
								</thead>
								<tbody>
									{#each getChanges(selectedEvent) as change}
										<tr class="border-t border-neutral-600/10 dark:border-white/10">
											<td class="px-3 py-2 font-medium text-neutral-900 dark:text-neutral-100">
												{change.field}
											</td>
											<td class="px-3 py-2 text-red-700 dark:text-red-300">
												{formatValue(change.from)}
											</td>
											<td class="px-3 py-2 text-green-700 dark:text-green-300">
												{formatValue(change.to)}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
