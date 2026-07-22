<script lang="ts">
	import { page } from '$app/state';
	import Footer from './Footer.svelte';
	import SecondaryTabs from './SecondaryTabs.svelte';
	import { normalizeAgencyName } from '$lib/features/forms/persistence/agency';
	import {
		formSnapshotRevision,
		getFormDraftSnapshot
	} from '$lib/features/forms/persistence/formDraftRegistry';
	import {
		capabilitiesRevision,
		loadCapabilities
	} from '$lib/features/forms/shared/stores/capabilities.store';
	import { assertCapabilities } from '$lib/features/forms/shared/guards/capabilities.guard';
	import { capabilitiesKey } from '$lib/features/forms/shared/stores/capabilities.store';
	import type { Capabilities } from '$lib/features/forms/shared/types/capabilities.types';

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

	// BASE ROOT THROUGH /URBAN OR /RURAL (works for both /forms/urban and /forms/{agency}/{year}/urban)
	const baseRoot = $derived(rawPath.match(/^(.*?\/(?:urban|rural))(?:\/|$)/)?.[1] ?? rawPath);

	// FISCAL YEAR: DOES NOT ROLL OVER UNTIL JULY (MONTH INDEX < 6 ⇒ STILL PRIOR YEAR)
	const FY = (() => {
		const n = new Date();
		return n.getMonth() < 6 ? n.getFullYear() - 1 : n.getFullYear();
	})();
	const yearInPath = $derived(rawPath.match(/\/(\d{4})(?=\/|$)/)?.[1] ?? null);
	const activeYear = $derived(yearInPath ?? String(FY));

	// PICK SLUG SET BASED ON CONTEXT
	function matchesServerAgency(existing: Capabilities | null): existing is Capabilities {
		const serverCapabilities =
			(page.data?.overviewCapabilities ?? page.data?.overviewPrefill) as Capabilities | null | undefined;
		if (!existing) return false;
		if (!serverCapabilities?.ctpGranteeLegalName) return true;
		return (
			normalizeAgencyName(existing.ctpGranteeLegalName) ===
			normalizeAgencyName(serverCapabilities.ctpGranteeLegalName)
		);
	}

	const serverCapabilities = $derived(
		(page.data?.overviewCapabilities ?? page.data?.overviewPrefill) as Capabilities | null | undefined
	);
	let visibleSlugs = $state<string[]>([]);

	$effect(() => {
		void $capabilitiesRevision;
		void $formSnapshotRevision;

		if (!ctx) {
			visibleSlugs = [];
			return;
		}

		const year = Number(activeYear);
		if (!Number.isFinite(year)) {
			visibleSlugs = [];
			return;
		}

		let liveCapabilities: Capabilities | null = null;
		try {
			const draft = getFormDraftSnapshot(capabilitiesKey(ctx, year));
			const parsedDraft = assertCapabilities(draft);
			liveCapabilities = matchesServerAgency(parsedDraft) ? parsedDraft : null;
		} catch {
			liveCapabilities = null;
		}

		const existing = loadCapabilities(ctx, year);
		const storedCapabilities = matchesServerAgency(existing) ? existing : null;

		const effectiveCapabilities = liveCapabilities ?? storedCapabilities ?? serverCapabilities ?? null;
		const slugs = [...(ctx === 'rural' ? RURAL_SLUGS : URBAN_SLUGS)];
		visibleSlugs = slugs.filter((slug) => {
			if (slug === 'saturday') return effectiveCapabilities?.days.saturday.offered !== false;
			if (slug === 'sunday') return effectiveCapabilities?.days.sunday.offered !== false;
			return true;
		});
	});

	const hasYearBeforeType = $derived(
		/^\/forms\/[^/]+\/\d{4}\/(?:urban|rural)(?:\/|$)/i.test(rawPath)
	);

	// BUILD HREF FOR LEGACY AND NEW URL SHAPES
	const hrefPathFor = (s: string) =>
		hasYearBeforeType ? `${baseRoot}/${s}` : `${baseRoot}/${activeYear}/${s}`;
	const hrefFor = (s: string) => `${hrefPathFor(s)}${page.url.search}${page.url.hash}`;

	// ACTIVE-LINK CHECK (EXACT MATCH OR CHILD PATH)
	const isActive = (s: string) => {
		const p = pathname,
			h = hrefPathFor(s).toLowerCase();
		return p === h || p.startsWith(h + '/');
	};
	const tabs = $derived(
		visibleSlugs.map((slug) => ({
			label: toLabel(slug),
			href: hrefFor(slug),
			active: isActive(slug)
		}))
	);

</script>

<div
	class="h-14 shrink-0 w-full bg-[var(--surface-2)] dark:bg-[var(--surface-1)]"
>
	{#if ctx}
		<div class="flex h-full items-stretch">
			{#if visibleSlugs.length}
				<div class="hidden min-w-0 flex-1 md:block">
					<SecondaryTabs {tabs} />
				</div>
			{/if}
		</div>
	{:else}
		<Footer />
	{/if}
</div>
