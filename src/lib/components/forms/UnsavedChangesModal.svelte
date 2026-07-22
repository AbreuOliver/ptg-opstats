<!-- <script lang="ts">
	import IconAlertTriangle from '@tabler/icons-svelte/icons/alert-triangle';
	import IconX from '@tabler/icons-svelte/icons/x';

	let {
		open = false,
		onStay,
		onLeave
	}: {
		open?: boolean;
		onStay?: () => void;
		onLeave?: () => void;
	} = $props();

	function close() {
		onStay?.();
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/35 p-4 backdrop-blur-sm"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) close();
		}}
	>
		<div
			class="relative w-full max-w-lg overflow-hidden rounded-xl border-2 border-neutral-600/20 bg-white/75 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/85"
			role="dialog"
			aria-modal="true"
			aria-labelledby="unsaved-changes-title"
		>
			<div
				class="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/90 via-white/70 to-[color-mix(in_srgb,var(--theme-color)_14%,white)] dark:from-neutral-900/90 dark:via-neutral-900/75 dark:to-[color-mix(in_srgb,var(--theme-color)_22%,#171717)]"
			></div>

			<div class="relative z-10 p-6">
				<div class="mb-4 flex items-start justify-between gap-4">
					<div class="flex items-start gap-3">
						<span
							class="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
						>
							<IconAlertTriangle class="h-5 w-5" />
						</span>
						<div>
							<h2
								id="unsaved-changes-title"
								class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white"
							>
								Unsaved changes
							</h2>
							<p class="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
								You have unsaved form changes. Leave this page and your local edits may be lost.
							</p>
						</div>
					</div>
					<button
						type="button"
						class="rounded p-1 text-neutral-600 transition hover:bg-black/5 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
						aria-label="Close unsaved changes dialog"
						onclick={close}
					>
						<IconX class="h-5 w-5" />
					</button>
				</div>

				<div
					class="rounded-xl border-2 border-neutral-600/20 bg-white/70 p-4 text-sm shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10"
				>
					<div class="font-semibold text-neutral-900 dark:text-neutral-100">
						Save your changes before leaving.
					</div>
					<div class="mt-1 text-neutral-600 dark:text-neutral-300">
						If you leave now, any unsaved edits remain only in local storage until you return.
					</div>
				</div>

				<div class="mt-5 flex justify-end gap-2">
					<button
						type="button"
						class="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-xl bg-neutral-200 px-5 font-mono text-sm font-medium tracking-tighter text-black transition disabled:cursor-not-allowed disabled:opacity-50"
						onclick={close}
					>
						<span
							class="absolute h-0 w-0 rounded-full bg-gradient-to-r from-neutral-300 to-neutral-500 transition-all duration-500 ease-out group-hover:h-[120%] group-hover:w-[120%]"
						></span>
						<span
							class="absolute inset-0 -mt-1 h-full w-full rounded-xl bg-gradient-to-b from-transparent via-transparent to-neutral-400 opacity-30"
						></span>
						<span class="relative z-10">Stay on page</span>
					</button>
					<button
						type="button"
						class="group relative inline-flex h-11 min-w-[112px] items-center justify-center overflow-hidden rounded-xl bg-neutral-900 px-5 font-mono text-sm font-medium tracking-tighter text-white transition disabled:cursor-not-allowed disabled:opacity-50"
						onclick={onLeave}
					>
						<span
							class="absolute h-0 w-0 rounded-full bg-gradient-to-r from-[var(--theme-color)] to-neutral-900 transition-all duration-500 ease-out group-hover:h-[120%] group-hover:w-[120%]"
						></span>
						<span
							class="absolute inset-0 -mt-1 h-full w-full rounded-xl bg-gradient-to-b from-transparent via-transparent to-black opacity-35"
						></span>
						<span class="relative z-10">Leave page</span>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if} -->
