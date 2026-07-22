<!-- <script lang="ts">
	import { onDestroy, tick } from 'svelte';

	type SignatureDrawData = unknown[];
	type SignaturePadLike = {
		canvas: HTMLCanvasElement;
		clear(): void;
		off(): void;
		isEmpty(): boolean;
		fromData(data: SignatureDrawData): void;
		toData(): SignatureDrawData;
		onBegin: (() => void) | null;
	};
	type SignatureSubmitPayload = {
		signatureImage: string;
		signatureStrokeData: SignatureDrawData;
	};

	let {
		open = false,
		title,
		roleLabel,
		signerName,
		signerEmail,
		certificationText,
		supportingText,
		submitting = false,
		error = null,
		onCancel,
		onApply
	}: {
		open?: boolean;
		title: string;
		roleLabel: string;
		signerName: string | null;
		signerEmail: string | null;
		certificationText: string;
		supportingText: string;
		submitting?: boolean;
		error?: string | null;
		onCancel: () => void;
		onApply: (payload: SignatureSubmitPayload) => Promise<void> | void;
	} = $props();

	let modalElement = $state<HTMLDivElement | null>(null);
	let canvasElement = $state<HTMLCanvasElement | null>(null);
	let signaturePad = $state<SignaturePadLike | null>(null);
	let containerElement = $state<HTMLDivElement | null>(null);
	let localError = $state<string | null>(null);
	let resizeObserver: ResizeObserver | null = null;
	let bodyOverflow: string | null = null;

	function setFocusWithinModal() {
		const focusable = modalElement?.querySelectorAll<HTMLElement>(
			'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
		);
		const first = focusable?.[0];
		first?.focus();
	}

	function resizeCanvas(preserveDrawing = true) {
		if (!canvasElement || !signaturePad || !containerElement) return;
		const data = preserveDrawing ? signaturePad.toData() : [];
		const ratio = Math.max(window.devicePixelRatio || 1, 1);
		const width = Math.max(containerElement.clientWidth, 320);
		const height = Math.max(containerElement.clientHeight, 220);
		canvasElement.width = Math.floor(width * ratio);
		canvasElement.height = Math.floor(height * ratio);
		const context = canvasElement.getContext('2d');
		if (!context) return;
		context.setTransform(ratio, 0, 0, ratio, 0, 0);
		signaturePad.clear();
		if (data.length > 0) {
			signaturePad.fromData(data);
		}
	}

	function clearSignature() {
		signaturePad?.clear();
		localError = null;
	}

	function trimCanvas(sourceCanvas: HTMLCanvasElement, padding = 20): string {
		const context = sourceCanvas.getContext('2d');
		if (!context) throw new Error('Unable to read the signature canvas.');
		const { width, height } = sourceCanvas;
		const pixels = context.getImageData(0, 0, width, height).data;
		let top = height;
		let bottom = 0;
		let left = width;
		let right = 0;
		let hasInk = false;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const alpha = pixels[(y * width + x) * 4 + 3];
				if (alpha === 0) continue;
				hasInk = true;
				if (x < left) left = x;
				if (x > right) right = x;
				if (y < top) top = y;
				if (y > bottom) bottom = y;
			}
		}

		if (!hasInk) {
			throw new Error('Please provide a signature before applying it.');
		}

		const cropWidth = right - left + 1;
		const cropHeight = bottom - top + 1;
		const output = document.createElement('canvas');
		output.width = cropWidth + padding * 2;
		output.height = cropHeight + padding * 2;
		const outputContext = output.getContext('2d');
		if (!outputContext) throw new Error('Unable to prepare the signature image.');
		outputContext.clearRect(0, 0, output.width, output.height);
		outputContext.drawImage(
			sourceCanvas,
			left,
			top,
			cropWidth,
			cropHeight,
			padding,
			padding,
			cropWidth,
			cropHeight
		);
		return output.toDataURL('image/png');
	}

	async function handleApply() {
		if (!signaturePad) return;
		if (signaturePad.isEmpty()) {
			localError = 'Draw a signature before applying it.';
			return;
		}
		try {
			localError = null;
			const signatureImage = trimCanvas(canvasElement ?? signaturePad.canvas, 20);
			await onApply({
				signatureImage,
				signatureStrokeData: signaturePad.toData()
			});
		} catch (error) {
			localError = error instanceof Error ? error.message : 'Failed to prepare the signature.';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!open || submitting) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			onCancel();
			return;
		}
		if (event.key !== 'Tab' || !modalElement) return;
		const focusable = Array.from(
			modalElement.querySelectorAll<HTMLElement>(
				'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((element) => element.offsetParent !== null);
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable.at(-1) ?? first;
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last?.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first?.focus();
		}
	}

	$effect(() => {
		if (!open) {
			localError = null;
			return;
		}
		if (typeof document === 'undefined') return;
		bodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		queueMicrotask(() => {
			setFocusWithinModal();
			resizeCanvas(true);
		});
		return () => {
			document.body.style.overflow = bodyOverflow ?? '';
		};
	});

	$effect(() => {
		if (!open || !canvasElement) return;
		const observerTarget = containerElement;
		if (!observerTarget || typeof ResizeObserver === 'undefined') return;
		resizeObserver?.disconnect();
		resizeObserver = new ResizeObserver(() => resizeCanvas(true));
		resizeObserver.observe(observerTarget);
		return () => {
			resizeObserver?.disconnect();
			resizeObserver = null;
		};
	});

	$effect(() => {
		if (!open || !canvasElement) return;
		const initialize = async () => {
			await tick();
			if (!canvasElement) return;
			const { default: SignaturePad } = await import('signature_pad');
			const pad = new SignaturePad(canvasElement, {
				minWidth: 0.8,
				maxWidth: 2.2,
				penColor: '#111827',
				backgroundColor: 'rgba(0,0,0,0)'
			}) as unknown as SignaturePadLike;
			pad.onBegin = () => {
				localError = null;
			};
			signaturePad = pad;
			resizeCanvas(false);
		};
		void initialize();
		return () => {
			signaturePad?.off();
			signaturePad = null;
		};
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
	});
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-2 backdrop-blur-sm sm:p-4"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget && !submitting) onCancel();
		}}
		onkeydown={handleKeydown}
	>
		<div
			bind:this={modalElement}
			class="flex max-h-[calc(100dvh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950"
			role="dialog"
			aria-modal="true"
			aria-labelledby="signature-modal-title"
			aria-describedby="signature-modal-description"
		>
			<div class="border-b border-zinc-200 px-4 py-4 sm:px-6">
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0">
						<h2 id="signature-modal-title" class="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
							{title}
						</h2>
						<p class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{roleLabel}</p>
					</div>
					<button
						type="button"
						class="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-white/10"
						onclick={onCancel}
						disabled={submitting}
					>
						Close
					</button>
				</div>
			</div>

			<div class="grid gap-4 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[1fr_1.15fr]">
				<section class="space-y-4">
					<div class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/60">
						<div class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Authenticated signer</div>
						<div class="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-200">
							<div>{signerName ?? 'No display name available'}</div>
							<div>{signerEmail ?? 'No email available'}</div>
						</div>
					</div>

					<div id="signature-modal-description" class="space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
						<p>{certificationText}</p>
						<p>{supportingText}</p>
					</div>

					<div class="rounded-xl border-none bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
						Draw your handwritten signature in the canvas on the right. Use Clear to start over.
					</div>
				</section>

				<section class="flex min-h-[22rem] flex-col gap-3">
					<div
						bind:this={containerElement}
						class="flex min-h-[19rem] flex-1 rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-3 shadow-inner dark:border-zinc-700 dark:bg-zinc-950"
					>
						<canvas
							bind:this={canvasElement}
							class="h-full w-full flex-1 rounded-xl bg-white touch-none"
							style="touch-action: none;"
							aria-label="Signature canvas"
						></canvas>
					</div>
					<div class="text-xs text-zinc-500 dark:text-zinc-400">
					Mouse input is supported. Touch and stylus inputs are supported on compatible devices.
					</div>
				</section>
			</div>

			{#if localError || error}
				<div class="px-4 pb-2 sm:px-6">
					<div
						class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100"
					>
						{localError ?? error}
					</div>
				</div>
			{/if}

			<div class="flex flex-col gap-3 border-t border-zinc-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
				<button
					type="button"
					class="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
					onclick={clearSignature}
					disabled={submitting}
				>
					Clear
				</button>
				<button
					type="button"
					class="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
					onclick={onCancel}
					disabled={submitting}
				>
					Cancel
				</button>
				<button
					type="button"
					class="inline-flex h-11 items-center justify-center rounded-md bg-[var(--theme-color)] px-4 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] disabled:cursor-not-allowed disabled:opacity-50"
					onclick={handleApply}
					disabled={submitting}
				>
					{#if submitting}
						<span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
					{/if}
					Apply Signature
				</button>
			</div>
		</div>
	</div>
{/if} -->

<script lang="ts">
	import { onDestroy, tick } from 'svelte';

	type SignatureDrawData = unknown[];
	type SignaturePadLike = {
		canvas: HTMLCanvasElement;
		clear(): void;
		off(): void;
		isEmpty(): boolean;
		fromData(data: SignatureDrawData): void;
		toData(): SignatureDrawData;
		onBegin: (() => void) | null;
	};
	type SignatureSubmitPayload = {
		signatureImage: string;
		signatureStrokeData: SignatureDrawData;
	};

	let {
		open = false,
		title,
		roleLabel,
		signerName,
		signerEmail,
		certificationText,
		supportingText,
		submitting = false,
		error = null,
		onCancel,
		onApply
	}: {
		open?: boolean;
		title: string;
		roleLabel: string;
		signerName: string | null;
		signerEmail: string | null;
		certificationText: string;
		supportingText: string;
		submitting?: boolean;
		error?: string | null;
		onCancel: () => void;
		onApply: (payload: SignatureSubmitPayload) => Promise<void> | void;
	} = $props();

	let modalElement = $state<HTMLDivElement | null>(null);
	let canvasElement = $state<HTMLCanvasElement | null>(null);
	let signaturePad = $state<SignaturePadLike | null>(null);
	let containerElement = $state<HTMLDivElement | null>(null);
	let localError = $state<string | null>(null);
	let resizeObserver: ResizeObserver | null = null;
	let bodyOverflow: string | null = null;

	function setFocusWithinModal() {
		const focusable = modalElement?.querySelectorAll<HTMLElement>(
			'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
		);
		const first = focusable?.[0];
		first?.focus();
	}

	function resizeCanvas(preserveDrawing = true) {
		if (!canvasElement || !signaturePad || !containerElement) return;
		const data = preserveDrawing ? signaturePad.toData() : [];
		const ratio = Math.max(window.devicePixelRatio || 1, 1);
		const width = Math.max(containerElement.clientWidth, 320);
		const height = Math.max(containerElement.clientHeight, 220);
		canvasElement.width = Math.floor(width * ratio);
		canvasElement.height = Math.floor(height * ratio);
		const context = canvasElement.getContext('2d');
		if (!context) return;
		context.setTransform(ratio, 0, 0, ratio, 0, 0);
		signaturePad.clear();
		if (data.length > 0) {
			signaturePad.fromData(data);
		}
	}

	function clearSignature() {
		signaturePad?.clear();
		localError = null;
	}

	function trimCanvas(sourceCanvas: HTMLCanvasElement, padding = 20): string {
		const context = sourceCanvas.getContext('2d');
		if (!context) throw new Error('Unable to read the signature canvas.');
		const { width, height } = sourceCanvas;
		const pixels = context.getImageData(0, 0, width, height).data;
		let top = height;
		let bottom = 0;
		let left = width;
		let right = 0;
		let hasInk = false;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const alpha = pixels[(y * width + x) * 4 + 3];
				if (alpha === 0) continue;
				hasInk = true;
				if (x < left) left = x;
				if (x > right) right = x;
				if (y < top) top = y;
				if (y > bottom) bottom = y;
			}
		}

		if (!hasInk) {
			throw new Error('Please provide a signature before applying it.');
		}

		const cropWidth = right - left + 1;
		const cropHeight = bottom - top + 1;
		const output = document.createElement('canvas');
		output.width = cropWidth + padding * 2;
		output.height = cropHeight + padding * 2;
		const outputContext = output.getContext('2d');
		if (!outputContext) throw new Error('Unable to prepare the signature image.');
		outputContext.clearRect(0, 0, output.width, output.height);
		outputContext.drawImage(
			sourceCanvas,
			left,
			top,
			cropWidth,
			cropHeight,
			padding,
			padding,
			cropWidth,
			cropHeight
		);
		return output.toDataURL('image/png');
	}

	async function handleApply() {
		if (!signaturePad) return;
		if (signaturePad.isEmpty()) {
			localError = 'Draw a signature before applying it.';
			return;
		}
		try {
			localError = null;
			const signatureImage = trimCanvas(canvasElement ?? signaturePad.canvas, 20);
			await onApply({
				signatureImage,
				signatureStrokeData: signaturePad.toData()
			});
		} catch (error) {
			localError = error instanceof Error ? error.message : 'Failed to prepare the signature.';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!open || submitting) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			onCancel();
			return;
		}
		if (event.key !== 'Tab' || !modalElement) return;
		const focusable = Array.from(
			modalElement.querySelectorAll<HTMLElement>(
				'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((element) => element.offsetParent !== null);
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable.at(-1) ?? first;
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last?.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first?.focus();
		}
	}

	$effect(() => {
		if (!open) {
			localError = null;
			return;
		}
		if (typeof document === 'undefined') return;
		bodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		queueMicrotask(() => {
			setFocusWithinModal();
			resizeCanvas(true);
		});
		return () => {
			document.body.style.overflow = bodyOverflow ?? '';
		};
	});

	$effect(() => {
		if (!open || !canvasElement) return;
		const observerTarget = containerElement;
		if (!observerTarget || typeof ResizeObserver === 'undefined') return;
		resizeObserver?.disconnect();
		resizeObserver = new ResizeObserver(() => resizeCanvas(true));
		resizeObserver.observe(observerTarget);
		return () => {
			resizeObserver?.disconnect();
			resizeObserver = null;
		};
	});

	$effect(() => {
		if (!open || !canvasElement) return;
		const initialize = async () => {
			await tick();
			if (!canvasElement) return;
			const { default: SignaturePad } = await import('signature_pad');
			const pad = new SignaturePad(canvasElement, {
				minWidth: 0.8,
				maxWidth: 2.2,
				penColor: '#111827',
				backgroundColor: 'rgba(0,0,0,0)'
			}) as unknown as SignaturePadLike;
			pad.onBegin = () => {
				localError = null;
			};
			signaturePad = pad;
			resizeCanvas(false);
		};
		void initialize();
		return () => {
			signaturePad?.off();
			signaturePad = null;
		};
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
	});
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-2 backdrop-blur-sm sm:p-4"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget && !submitting) onCancel();
		}}
		onkeydown={handleKeydown}
	>
		<div
			bind:this={modalElement}
			class="flex max-h-[calc(100dvh-1rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950"
			role="dialog"
			aria-modal="true"
			aria-labelledby="signature-modal-title"
			aria-describedby="signature-modal-description"
		>
			<!-- Top Header -->
			<div class="border-b border-zinc-200 px-4 py-4 sm:px-6">
				<div class="flex items-center justify-between gap-4">
					<div class="min-w-0">
						<h2 id="signature-modal-title" class="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
							{title}
						</h2>
						<p class="mt-0 text-sm text-zinc-600 dark:text-zinc-300">
							Signing as {signerName ?? 'Unknown'} ({signerEmail ?? 'No email'})
						</p>
					</div>

					<div class="rounded-xl border-none bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
						Draw your handwritten signature in the canvas below. Use Clear to start over.
					</div>

					<button
						type="button"
						class="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-white/10"
						onclick={onCancel}
						disabled={submitting}
					>
						Close
					</button>
				</div>
			</div>

			<!-- Modal Body -->
			<div class="flex flex-col gap-6 overflow-y-auto p-4 sm:p-6">
				<div id="signature-modal-description" class="text-sm leading-6 text-zinc-700 dark:text-zinc-200">
					<p>{certificationText}</p>
				</div>

				<section class="flex min-h-[22rem] flex-col gap-3">
					<div
						bind:this={containerElement}
						class="flex min-h-[22rem] flex-1 rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-3 shadow-inner dark:border-zinc-700 dark:bg-zinc-950"
					>
						<canvas
							bind:this={canvasElement}
							class="h-full w-full flex-1 rounded-xl bg-white touch-none"
							style="touch-action: none;"
							aria-label="Signature canvas"
						></canvas>
					</div>
					<div class="text-xs text-zinc-500 dark:text-zinc-400">
						Mouse input is supported. Touch and stylus inputs are supported on compatible devices.
					</div>
				</section>
			</div>

			{#if localError || error}
				<div class="px-4 pb-2 sm:px-6">
					<div
						class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100"
					>
						{localError ?? error}
					</div>
				</div>
			{/if}

			<!-- Bottom Footer -->
			<div class="flex flex-col gap-3 border-t border-zinc-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<div class="text-sm leading-6 text-zinc-700 dark:text-zinc-200 max-w-2xl">
					<p>{supportingText}</p>
				</div>
				<div class="flex items-center gap-3 shrink-0">
					<button
						type="button"
						class="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
						onclick={clearSignature}
						disabled={submitting}
					>
						Clear
					</button>
					<button
						type="button"
						class="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
						onclick={onCancel}
						disabled={submitting}
					>
						Cancel
					</button>
					<button
						type="button"
						class="inline-flex h-11 items-center justify-center rounded-md bg-[var(--theme-color)] px-4 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] disabled:cursor-not-allowed disabled:opacity-50"
						onclick={handleApply}
						disabled={submitting}
					>
						{#if submitting}
							<span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
						{/if}
						Apply Signature
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
