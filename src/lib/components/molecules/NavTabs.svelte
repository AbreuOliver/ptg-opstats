<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Footer from './Footer.svelte';

	// SINGLE SOURCE OF TRUTH: URL-SAFE SLUGS FOR EACH CONTEXT
	const URBAN_SLUGS = [
		'overview',
		'weekday',
		'saturday',
		'sunday',
		'weekly-totals',
		'performance-dashboard',
		'finance',
		'reconciliation'
	] as const;

	const RURAL_SLUGS = [
		'overview',
		'weekday',
		'saturday',
		'sunday',
		'weekly-totals',
		'performance-dashboard',
		'finance',
		'annual-statistics',
		'physical-assaults',
		'non-physical-assaults',
		'other-safety-and-security-data',
		'completion'
	] as const;

	// LABEL FORMATTER (TURN SLUGS INTO HUMAN-READABLE TEXT)
	const toLabel = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

	// DERIVED URL STATE (NORMALIZE/TRIM TRAILING SLASH)
	const rawPath = $derived(page.url.pathname.replace(/\/+$/, ''));
	const pathname = $derived(rawPath.toLowerCase());

	// DETECT CONTEXT FROM URL (URBAN/RURAL) AND HUMAN WORD FOR BRAND SLOT
	const ctx = $derived(
		(rawPath.match(/\/(urban|rural)(?=\/|$)/i)?.[1]?.toLowerCase() as
			| 'urban'
			| 'rural'
			| undefined) ?? null
	);

	const ctxWord = $derived(ctx ? (ctx === 'urban' ? 'Urban' : 'Rural') : null);

	// BASE ROOT THROUGH /URBAN OR /RURAL (E.G., "/FORMS/URBAN")
	const baseRoot = $derived(rawPath.match(/^(.*?\/(?:urban|rural))(?:\/|$)/)?.[1] ?? rawPath);

	// FISCAL YEAR: DOES NOT ROLL OVER UNTIL JULY (MONTH INDEX < 6 ⇒ STILL PRIOR YEAR)
	const FY = (() => {
		const n = new Date();
		return n.getMonth() < 6 ? n.getFullYear() - 1 : n.getFullYear();
	})();
	const yearInPath = $derived(rawPath.match(/\/(\d{4})(?=\/|$)/)?.[1] ?? null);
	const activeYear = $derived(yearInPath ?? String(FY));

	// PICK SLUG SET BASED ON CONTEXT
	const SLUGS = $derived(ctx === 'rural' ? RURAL_SLUGS : URBAN_SLUGS);

	// BUILD HREF BY APPENDING FISCAL YEAR AND SLUG TO THE BASE ROOT
	const hrefFor = (s: string) => `${baseRoot}/${activeYear}/${s}`;

	// ACTIVE-LINK CHECK (EXACT MATCH OR CHILD PATH)
	const isActive = (s: string) => {
		const p = pathname,
			h = hrefFor(s).toLowerCase();
		return p === h || p.startsWith(h + '/');
	};

	const CTX_OPTIONS = ['urban', 'rural'] as const;

	const currentCtx = $derived(ctx ?? 'urban');
	const otherOptions = $derived(CTX_OPTIONS.filter((o) => o !== currentCtx));

	let isTypeMenuOpen = $state(false);
	let typeMenuWrapEl = $state<HTMLDivElement | null>(null);

	const hrefForCtx = (opt: (typeof CTX_OPTIONS)[number]) => {
		const switchedPath = rawPath.replace(/\/(urban|rural)(?=\/|$)/i, `/${opt}`);
		const path = switchedPath === rawPath ? `/forms/${opt}` : switchedPath;
		const result = `${path}${page.url.search}${page.url.hash}`;
		console.log('hrefForCtx:', { opt, rawPath, switchedPath, path, result });
		return result;
	};

	const toggleTypeMenu = () => {
		isTypeMenuOpen = !isTypeMenuOpen;
	};

	const switchContext = async (opt: (typeof CTX_OPTIONS)[number]) => {
		const targetHref = hrefForCtx(opt);
		console.log('Navigating to:', targetHref);
		isTypeMenuOpen = false;

		// Force navigation with invalidateAll
		await goto(targetHref, { invalidateAll: true });
	};

	onMount(() => {
		const onDocumentClick = (event: MouseEvent) => {
			if (!isTypeMenuOpen || !typeMenuWrapEl) return;
			if (event.target instanceof Node && !typeMenuWrapEl.contains(event.target)) {
				isTypeMenuOpen = false;
			}
		};

		const onEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') isTypeMenuOpen = false;
		};

		document.addEventListener('click', onDocumentClick);
		document.addEventListener('keydown', onEscape);

		return () => {
			document.removeEventListener('click', onDocumentClick);
			document.removeEventListener('keydown', onEscape);
		};
	});

	$effect(() => {
		pathname;
		isTypeMenuOpen = false;
	});
</script>

<div
	class="h-14 shrink-0 w-full bg-[var(--surface-2)] dark:bg-[var(--surface-1)]"
>
	{#if ctx}
		<div class="flex h-full items-stretch">
			<!-- <div bind:this={typeMenuWrapEl} class="relative ml-1">
				<button
					type="button"
					class="relative flex h-9 min-w-fit items-center justify-center gap-1 overflow-hidden rounded-md border border-[#b7b7b7] bg-[#f7f7f7] px-4 py-1 text-sm font-semibold text-[#1f2937] capitalize transition hover:bg-[#ffffff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#217346] dark:border-0 dark:border-none dark:bg-zinc-900 dark:text-neutral-100 dark:hover:bg-zinc-800"
					aria-label="Switch rural/urban"
					aria-expanded={isTypeMenuOpen}
					aria-haspopup="menu"
					onclick={toggleTypeMenu}
				>
					{#if ctxWord}
						<span class="pr-1 leading-none text-[#217346]"> {ctxWord}</span>
					{/if}
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"
						><path
							fill="currentColor"
							fill-rule="evenodd"
							d="M8 1a.5.5 0 0 1 .374.168l4 4.5l-.748.664L8 2.252l-3.626 4.08l-.748-.664l4-4.5A.5.5 0 0 1 8 1m0 12.747l-3.626-4.08l-.748.665l4 4.5a.5.5 0 0 0 .748 0l4-4.5l-.748-.664z"
							clip-rule="evenodd"
						/></svg
					>
				</button>
				{#if isTypeMenuOpen}
					<div
						role="menu"
						class="absolute bottom-[calc(100%+0.4rem)] left-0 z-40 min-w-full overflow-hidden rounded-md border border-[#b7b7b7] bg-[#f7f7f7] shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-none"
					>
						{#each otherOptions as opt}
							<button
								type="button"
								role="menuitem"
								onclick={(e) => {
									e.stopPropagation();
									switchContext(opt);
								}}
								class="block w-full px-4 py-2 text-left text-sm font-semibold text-[#1f2937] capitalize transition hover:bg-white dark:text-neutral-100 dark:hover:bg-zinc-800"
							>
								{opt}
							</button>
						{/each}
					</div>
				{/if}
			</div> -->
			{#if SLUGS.length}
				<nav
					class="hidden h-full min-w-0 flex-1 items-stretch gap-0 overflow-x-auto border-t border-b border-[var(--border)] dark:border-zinc-700 md:flex"
					data-sveltekit-preload-code="hover"
					data-sveltekit-preload-data="hover"
				>
					{#each SLUGS as s}
						<a
							href={hrefFor(s)}
							aria-current={isActive(s) ? 'page' : undefined}
							class="relative -mb-px flex h-full min-w-max items-center justify-center border-r border-[var(--border)] px-5 text-[13px] font-normal whitespace-nowrap transition-colors dark:border-zinc-700 focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--theme-color)] {isActive(
								s
							)
								? 'bg-[var(--surface-1)] font-semibold text-[#161616] dark:bg-[var(--surface-1)] dark:text-[#f4f4f4] before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-full before:bg-[var(--theme-color)] after:absolute after:top-0 after:left-0 after:h-px after:w-full after:bg-[var(--surface-1)] dark:after:bg-[var(--surface-1)]'
								: 'bg-[var(--surface-2)] text-[#525252] hover:bg-[#dcdcdc] hover:text-[#161616] dark:bg-[#393939] dark:text-[#c6c6c6] dark:hover:bg-[#525252] dark:hover:text-[#f4f4f4]'}"
						>
							{toLabel(s)}
						</a>
					{/each}
				</nav>
			{/if}
		</div>
	{:else}
		<Footer />
	{/if}
</div>
