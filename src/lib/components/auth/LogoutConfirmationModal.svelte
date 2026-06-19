<script lang="ts">
	import { goto } from '$app/navigation';
	import IconLogout from '@tabler/icons-svelte/icons/logout';
	import IconX from '@tabler/icons-svelte/icons/x';

	let {
		open = false,
		displayName = '',
		email = null,
		onClose
	}: {
		open?: boolean;
		displayName?: string;
		email?: string | null;
		onClose?: () => void;
	} = $props();

	let loggingOut = $state(false);
	let logoutError = $state('');

	$effect(() => {
		if (open) return;
		loggingOut = false;
		logoutError = '';
	});

	function close() {
		if (loggingOut) return;
		logoutError = '';
		onClose?.();
	}

	async function confirmLogout() {
		if (loggingOut) return;
		loggingOut = true;
		logoutError = '';

		try {
			const response = await fetch('/api/auth/logout', {
				method: 'POST',
				headers: { accept: 'application/json' }
			});
			const payload = (await response.json().catch(() => ({}))) as { redirectTo?: string };
			if (!response.ok) throw new Error('Logout request failed.');
			onClose?.();
			await goto(payload.redirectTo ?? '/', { invalidateAll: true });
		} catch (error) {
			console.error('[auth] failed to log out', error);
			logoutError = 'Unable to log out. Please try again.';
			loggingOut = false;
		}
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
			class="relative w-full max-w-lg overflow-hidden rounded-xl border-2 border-neutral-600/20 bg-white/70 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/80"
			role="dialog"
			aria-modal="true"
			aria-labelledby="logout-title"
		>
			<div
				class="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/85 via-white/65 to-[color-mix(in_srgb,var(--theme-color)_14%,white)] dark:from-neutral-900/90 dark:via-neutral-900/75 dark:to-[color-mix(in_srgb,var(--theme-color)_22%,#171717)]"
			></div>

			<div class="relative z-10 p-6">
				<div class="mb-4 flex items-start justify-between gap-4">
					<div>
						<h2
							id="logout-title"
							class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white"
						>
							Log out?
						</h2>
						<p class="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
							You will need to sign in again to view protected NC OpStats pages.
						</p>
					</div>
					<button
						type="button"
						class="rounded p-1 text-neutral-600 transition hover:bg-black/5 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
						aria-label="Close logout confirmation"
						onclick={close}
						disabled={loggingOut}
					>
						<IconX class="h-5 w-5" />
					</button>
				</div>

				<div
					class="rounded-xl border-2 border-neutral-600/20 bg-white/65 p-4 text-sm shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10"
				>
					<div class="font-semibold text-neutral-900 dark:text-neutral-100">
						{displayName || email || 'Current user'}
					</div>
					{#if email}
						<div class="mt-1 text-neutral-600 dark:text-neutral-300">{email}</div>
					{/if}
				</div>

				{#if logoutError}
					<p class="mt-4 text-sm font-medium text-red-700 dark:text-red-300">{logoutError}</p>
				{/if}

				<div class="mt-5 flex justify-end gap-2">
					<button
						type="button"
						class="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-xl bg-neutral-200 px-5 font-mono text-sm font-medium tracking-tighter text-black transition disabled:cursor-not-allowed disabled:opacity-50"
						onclick={close}
						disabled={loggingOut}
					>
						<span
							class="absolute h-0 w-0 rounded-full bg-gradient-to-r from-neutral-300 to-neutral-500 transition-all duration-500 ease-out group-hover:h-[120%] group-hover:w-[120%]"
						></span>
						<span
							class="absolute inset-0 -mt-1 h-full w-full rounded-xl bg-gradient-to-b from-transparent via-transparent to-neutral-400 opacity-30"
						></span>
						<span class="relative z-10">Cancel</span>
					</button>
					<button
						type="button"
						class="group relative inline-flex h-11 min-w-[112px] items-center justify-center overflow-hidden rounded-xl bg-neutral-900 px-5 font-mono text-sm font-medium tracking-tighter text-white transition disabled:cursor-not-allowed disabled:opacity-50"
						onclick={confirmLogout}
						disabled={loggingOut}
					>
						<span
							class="absolute h-0 w-0 rounded-full bg-gradient-to-r from-[var(--theme-color)] to-neutral-900 transition-all duration-500 ease-out group-hover:h-[120%] group-hover:w-[120%]"
						></span>
						<span
							class="absolute inset-0 -mt-1 h-full w-full rounded-xl bg-gradient-to-b from-transparent via-transparent to-black opacity-35"
						></span>
						<IconLogout class="relative z-10 mr-2 h-5 w-5" />
						<span class="relative z-10">{loggingOut ? 'Logging out...' : 'Log out'}</span>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
