<script lang="ts">
	import { goto } from '$app/navigation';
	import IconCheck from '@tabler/icons-svelte/icons/check';
	import IconInfoCircle from '@tabler/icons-svelte/icons/info-circle';
	import IconX from '@tabler/icons-svelte/icons/x';

	type ToastVariant = 'success' | 'error' | 'info' | 'warning';

	let {
		open = false,
		variant = 'info',
		title,
		message,
		linkHref,
		linkLabel = 'View activity',
		durationMs = 6000,
		onClose
	}: {
		open?: boolean;
		variant?: ToastVariant;
		title: string;
		message: string;
		linkHref?: string;
		linkLabel?: string;
		durationMs?: number;
		onClose?: () => void;
	} = $props();

	let timer: ReturnType<typeof setTimeout> | null = null;
	const effectiveDurationMs = $derived(Math.max(durationMs, 5000));

	const variantClasses = $derived.by(() => {
		if (variant === 'success') return 'border-none bg-emerald-600 text-white';
		if (variant === 'error') return 'border-none bg-red-700 text-white';
		if (variant === 'warning') return 'border-none bg-yellow-500 text-black';
		return 'border-none bg-sky-600 text-white';
	});
	const progressClass = $derived.by(() => {
		if (variant === 'success') return 'bg-green-100/70';
		if (variant === 'error') return 'bg-red-100/70';
		if (variant === 'warning') return 'bg-amber-100/70';
		return 'bg-sky-100/70';
	});
	const messageClass = $derived(variant === 'warning' ? 'text-black/90' : 'text-white/95');
	const closeButtonClass = $derived(
		variant === 'warning'
			? 'text-black/80 hover:bg-black/10 hover:text-black'
			: 'text-white/90 hover:bg-white/10 hover:text-white'
	);

	$effect(() => {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}

		if (!open) return;
		timer = setTimeout(() => {
			onClose?.();
		}, effectiveDurationMs);

		return () => {
			if (timer) clearTimeout(timer);
		};
	});

	function close() {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		onClose?.();
	}

	async function followLink() {
		if (!linkHref) return;
		close();
		await goto(linkHref);
	}
</script>

{#if open}
	<div
		class="fixed top-2 right-2 z-[100] w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-lg border shadow-xl {variantClasses}"
		role="status"
		aria-live="polite"
		style:animation="toast-slide-in 180ms ease-out"
	>
		<div class="flex gap-4 p-4 pr-10">
			<div
				class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-current"
			>
				{#if variant === 'success'}
					<IconCheck class="h-6 w-6 text-green-500" />
				{:else if variant === 'error'}
					<IconX class="h-6 w-6 text-red-500" />
				{:else}
					<IconInfoCircle class="h-6 w-6 text-current" />
				{/if}
			</div>

			<div class="min-w-0 flex-1">
				<div class="font-bold">{title}</div>
				<div class="mt-1 text-sm leading-5 {messageClass}">{message}</div>
				{#if variant === 'success' && linkHref}
					<button
						type="button"
						class="mt-2 text-sm font-semibold text-white underline underline-offset-2 hover:text-white/85"
						onclick={followLink}
					>
						{linkLabel}
					</button>
				{/if}
			</div>

			<button
				type="button"
				class="absolute top-3 right-3 rounded p-1 transition {closeButtonClass}"
				aria-label="Dismiss notification"
				onclick={close}
			>
				<IconX class="h-5 w-5" />
			</button>
		</div>

		<div class="h-1.5 bg-white/20">
			<div
				class="toast-progress-bar h-full w-full origin-left {progressClass}"
				style:animation-duration={`${effectiveDurationMs}ms`}
			></div>
		</div>
	</div>
{/if}

<style>
	@keyframes toast-slide-in {
		from {
			opacity: 0;
			transform: translateX(1.5rem);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes toast-progress {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}

	.toast-progress-bar {
		animation-name: toast-progress;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}
</style>
