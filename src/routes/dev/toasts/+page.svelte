<script lang="ts">
	import { dev } from '$app/environment';
	import TemporaryToast from '$lib/components/TemporaryToast.svelte';

	type ToastVariant = 'success' | 'error' | 'info' | 'warning';

	let open = $state(true);
	let variant = $state<ToastVariant>('success');

	const variants: ToastVariant[] = ['success', 'error', 'info', 'warning'];
	const copy: Record<ToastVariant, { title: string; message: string }> = {
		success: {
			title: 'Saved',
			message: 'Your changes were saved successfully.'
		},
		error: {
			title: 'Save failed',
			message: 'Your changes could not be saved. Local draft data was preserved.'
		},
		info: {
			title: 'Information',
			message: 'This is a development preview of the reusable toast component.'
		},
		warning: {
			title: 'Warning',
			message: 'This preview route is available only while running in development mode.'
		}
	};

	function show(nextVariant = variant) {
		variant = nextVariant;
		open = false;
		setTimeout(() => {
			open = true;
		});
	}
</script>

{#if dev}
	<section class="flex min-h-screen flex-col gap-6 bg-zinc-100 p-8 text-zinc-950">
		<div>
			<h1 class="text-2xl font-bold">TemporaryToast Preview</h1>
			<p class="mt-1 text-sm text-zinc-600">
				Use this dev-only page to style the fixed top-right toast without triggering saves.
			</p>
		</div>

		<div class="flex flex-wrap gap-2">
			{#each variants as item}
				<button
					type="button"
					class="rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
					onclick={() => show(item)}
				>
					Show {item}
				</button>
			{/each}
			<button
				type="button"
				class="rounded bg-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-400"
				onclick={() => (open = false)}
			>
				Hide
			</button>
		</div>

		<div class="rounded border border-zinc-300 bg-white p-6">
			<p class="text-sm text-zinc-700">
				Current variant: <span class="font-semibold">{variant}</span>
			</p>
			<p class="mt-2 text-sm text-zinc-500">
				The duration is intentionally long so the component remains visible while editing styles.
			</p>
		</div>

		<TemporaryToast
			{open}
			{variant}
			title={copy[variant].title}
			message={copy[variant].message}
			linkHref="/activity"
			linkLabel="View activity"
			durationMs={999999}
			onClose={() => (open = false)}
		/>
	</section>
{:else}
	<section class="p-8">
		<h1 class="text-xl font-semibold">Not available</h1>
		<p class="mt-2 text-sm">This preview route is only available in development mode.</p>
	</section>
{/if}
