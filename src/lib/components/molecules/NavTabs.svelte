<script lang="ts">
	import { Dropdown, DropdownItem } from 'flowbite-svelte';
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
		'reconciliation',
	] as const;

	const RURAL_SLUGS = [
		'overview',
		'weekday',
		'saturday',
		'sunday',
		'weekly-totals',
		'performance-dashboard',
		'finance',
		'annual-statistic',
		'completion'
	] as const;

	// LABEL FORMATTER (TURN SLUGS INTO HUMAN-READABLE TEXT)
	const toLabel = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

	// DERIVED URL STATE (NORMALIZE/TRIM TRAILING SLASH)
	const rawPath = $derived(page.url.pathname.replace(/\/+$/, ''));
	const pathname = $derived(rawPath.toLowerCase());

	// DETECT CONTEXT FROM URL (URBAN/RURAL) AND HUMAN WORD FOR BRAND SLOT
	const ctx = $derived(
		pathname.includes('/rural') ? 'rural' : pathname.includes('/urban') ? 'urban' : null
	);
	const ctxWord = $derived(ctx ? (ctx === 'urban' ? 'Urban' : 'Rural') : null);

	// BASE ROOT THROUGH /URBAN OR /RURAL (E.G., "/FORMS/URBAN")
	const baseRoot = $derived(rawPath.match(/^(.*?\/(?:urban|rural))(?:\/|$)/)?.[1] ?? rawPath);

	// FISCAL YEAR: DOES NOT ROLL OVER UNTIL JULY (MONTH INDEX < 6 ⇒ STILL PRIOR YEAR)
	const FY = (() => {
		const n = new Date();
		return n.getMonth() < 6 ? n.getFullYear() - 1 : n.getFullYear();
	})();

	// PICK SLUG SET BASED ON CONTEXT
	const SLUGS = $derived(ctx === 'rural' ? RURAL_SLUGS : URBAN_SLUGS);

	// BUILD HREF BY APPENDING FISCAL YEAR AND SLUG TO THE BASE ROOT
	const hrefFor = (s: string) => `${baseRoot}/${FY}/${s}`;

	// ACTIVE-LINK CHECK (EXACT MATCH OR CHILD PATH)
	const isActive = (s: string) => {
		const p = pathname,
			h = hrefFor(s).toLowerCase();
		return p === h || p.startsWith(h + '/');
	};

	const CTX_OPTIONS = ['urban', 'rural'] as const;

	const currentCtx = $derived(ctx ?? 'urban');
	const otherOptions = $derived(CTX_OPTIONS.filter((o) => o !== currentCtx));

	// keep simple: go to /forms/{opt}
	const hrefForCtx = (opt: string) => `/forms/${opt}`;
</script>

<div class="min-w-11/12 border-t-3 dark:border-neutral-800 dark:bg-neutral-950/70">
	{#if ctx}
		<div class="flex h-16 items-center gap-4">
			<a href="/forms" class="flex min-w-fit items-center pl-6 text-2xl font-semibold text-violet500 w-20" aria-label="rural/urban indicator">
			{#if ctxWord}
				<span class="leading-none text-red-600 pr-2"> {ctxWord}</span> 
			{/if}
		</a>
			{#if SLUGS.length}
				<nav
					class="hidden items-stretch gap-6 pl-6 md:flex"
					data-sveltekit-preload-code="hover"
					data-sveltekit-preload-data="hover"
				>
					{#each SLUGS as s}
						<a
							href={hrefFor(s)}
							aria-current={isActive(s) ? 'page' : undefined}
							class="relative flex min-w-18 items-center px-1 text-lg font-medium
                   transition-colors {isActive(s)
								? 'text-white'
								: 'text-neutral-400 hover:text-neutral-100'}"
						>
							{toLabel(s)}
							<span
								class="pointer-events-none absolute right-2 -bottom-5 left-2 h-1 rounded
                         {isActive(s) ? 'bg-red-700' : 'bg-transparent'}"
							></span>
						</a>
					{/each}
				</nav>
			{/if}
		</div>
	{:else}
		<Footer />
	{/if}
</div>
