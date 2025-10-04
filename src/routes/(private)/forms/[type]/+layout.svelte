<!-- <script lang="ts">
	import { page } from '$app/state';
	let { children } = $props();

	// SINGLE SOURCE OF TRUTH: URL-SAFE SLUGS FOR EACH CONTEXT
	const URBAN_SLUGS = [
		'overview',
		'weekday',
		'saturday',
		'sunday',
		'weekly-totals',
		'dashboard',
		'finance',
		'reconciliation',
		'definitions'
	] as const;

	const RURAL_SLUGS = [
		'overview',
		'weekday',
		'saturday',
		'sunday',
		'weekly-totals',
		'dashboard',
		'finance',
		'annual-statistic',
		'completion',
		'definitions'
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
</script>

<div
	class="min-w-11/12 bg-zinc-800 mx-auto my-4 rounded-xl 
           dark:bg-zinc-800"
>
	<div class="flex h-14 items-center gap-4">
		<a href="/forms" class="flex min-w-fit items-center pl-6 text-md font-semibold text-indigo-200" aria-label="rural/urban indicator">
			{#if ctxWord}
				<span class="leading-none text-indigo-200"> {ctxWord}</span>
			{/if}
		</a>

		{#if SLUGS.length}
			<nav
				class="pl-6 hidden items-stretch gap-6 md:flex"
				data-sveltekit-preload-code="hover"
				data-sveltekit-preload-data="hover"
			>
				{#each SLUGS as s}
					<a
						href={hrefFor(s)}
						aria-current={isActive(s) ? 'page' : undefined}
						class="text-base relative flex min-w-16 items-center px-2 font-medium
                   transition-colors {isActive(s)
							? 'text-white'
							: 'text-neutral-400 hover:text-neutral-100'}"
					>
						{toLabel(s)}
						<span
							class="pointer-events-none absolute right-2 -bottom-4.5 left-2 h-[2px] rounded
                         {isActive(s) ? 'bg-indigo-200' : 'bg-transparent'}"
						></span>
					</a>
				{/each}
			</nav>
		{/if}
	</div>
</div> -->

<script lang="ts">
	let { children } = $props();
</script>

<div class="pt-8">
	{@render children?.()}
</div>
