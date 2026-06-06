<script lang="ts">
	import { page } from '$app/state';
	import '../app.css';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import NavTabs from '$lib/components/molecules/NavTabs.svelte';
	import SecondaryTabs from '$lib/components/molecules/SecondaryTabs.svelte';
	import OverlayRoot from '$lib/components/OverlayRoot.svelte';
	import AdminTabs from '$lib/components/molecules/AdminTabs.svelte';
	import FormsReportSaveButton from '$lib/components/forms/FormsReportSaveButton.svelte';
	import IconSettings from '@tabler/icons-svelte/icons/settings';
	import { TRANSIT_SYSTEMS } from '$lib/data/transitSystems';
	import { normalizeAgencyName } from '$lib/features/forms/persistence/agency';
	import {
		AutomationsIcon,
		CalendarIcon,
		DashboardIcon,
		FormsIcon,
		MessagesIcon,
		NotificationsIcon,
		ReportsIcon,
		ResourcesIcon,
		RoadmapIcon,
		SupportIcon,
		TrainingIcon,
		WhatsNewIcon
	} from '$lib/components/sidebar-icons';

	let { children } = $props();
	const landingPage = $derived(page.url.pathname === '/');
	const adminPage = $derived(page.url.pathname.includes('admin'));
	const pathname = $derived(page.url.pathname);
	const isSuperAdmin = $derived(Boolean(page.data?.userScope?.isSuperAdmin));
	const agencyInQuery = $derived.by(() => page.url.searchParams.get('agency'));

	const sidebarPrefixes = [
		'/forms',
		'/dashboard',
		'/admin',
		'/account',
		'/notifications',
		'/messages',
		'/calendar',
		'/resources',
		'/reports',
		'/automations',
		'/training',
		'/support',
		'/whats-new',
		'/roadmap'
	];
	const useSidebarLayout = $derived(sidebarPrefixes.some((prefix) => pathname.startsWith(prefix)));

	type Breadcrumb = {
		label: string;
		href?: string;
		isCurrent: boolean;
	};

	const LABELS: Record<string, string> = {
		dashboard: 'Dashboard',
		admin: 'Admin',
		forms: 'Forms',
		overview: 'Overview',
		weekday: 'Weekday',
		saturday: 'Saturday',
		sunday: 'Sunday',
		'weekly-totals': 'Weekly Totals',
		'performance-dashboard': 'Performance Dashboard',
		finance: 'Finance',
		'annual-statistics': 'Annual Statistics',
		completion: 'Completion',
		'physical-assaults': 'Physical Assaults',
		'non-physical-assaults': 'Non Physical Assaults',
		'other-safety-and-security-data': 'Other Safety & Security Data',
		notifications: 'Notifications',
		account: 'Account',
		settings: 'Settings',
		messages: 'Messages',
		calendar: 'Calendar',
		resources: 'Resources',
		reports: 'Reports',
		automations: 'Automations',
		training: 'Training',
		support: 'Support',
		'whats-new': "What's New",
		roadmap: 'Roadmap'
	};

	function prettySegment(segment: string): string {
		return (
			LABELS[segment] ?? segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
		);
	}

	function decodeMaybe(value: string): string {
		try {
			return decodeURIComponent(value);
		} catch {
			return value;
		}
	}

	function formatAgencyCrumbLabel(value: string): string {
		const decoded = decodeMaybe(decodeMaybe(value));
		const spaced = decoded.replace(/%20/gi, ' ').trim().replace(/-/g, ' ').replace(/\s+/g, ' ');
		const normalized = normalizeAgencyName(spaced);
		const looseNormalized = normalized.replace(/[^A-Z0-9]/g, '');
		const canonical = TRANSIT_SYSTEMS.find((row) => {
			const systemNormalized = normalizeAgencyName(row.name);
			return (
				systemNormalized === normalized ||
				systemNormalized.replace(/[^A-Z0-9]/g, '') === looseNormalized
			);
		})?.name;
		return canonical ?? spaced;
	}

	type HeaderIconComponent = typeof DashboardIcon;

	const HEADER_ICONS: Record<string, HeaderIconComponent> = {
		dashboard: DashboardIcon,
		forms: FormsIcon,
		admin: FormsIcon,
		account: IconSettings,
		notifications: NotificationsIcon,
		messages: MessagesIcon,
		calendar: CalendarIcon,
		resources: ResourcesIcon,
		reports: ReportsIcon,
		automations: AutomationsIcon,
		training: TrainingIcon,
		support: SupportIcon,
		'whats-new': WhatsNewIcon,
		roadmap: RoadmapIcon
	};

	const pageTitle = $derived.by(() => {
		if (pathname.startsWith('/forms')) return 'Forms';
		if (pathname.startsWith('/dashboard')) return 'Dashboard';
		if (pathname.startsWith('/admin')) return 'Admin';
		if (pathname.startsWith('/account')) return 'Account';
		if (pathname.startsWith('/notifications')) return 'Notifications';
		if (pathname.startsWith('/messages')) return 'Messages';
		if (pathname.startsWith('/calendar')) return 'Calendar';
		if (pathname.startsWith('/resources')) return 'Resources';
		if (pathname.startsWith('/reports')) return 'Reports';
		if (pathname.startsWith('/automations')) return 'Automations';
		if (pathname.startsWith('/training')) return 'Training';
		if (pathname.startsWith('/support')) return 'Support';
		if (pathname.startsWith('/whats-new')) return "What's New";
		if (pathname.startsWith('/roadmap')) return 'Roadmap';
		return 'NC OpStats';
	});

	const breadcrumbs = $derived.by<Breadcrumb[]>(() => {
		const segments = pathname.split('/').filter(Boolean);
		if (segments.length === 0) return [];

		if (segments[0] === 'forms') {
			const items: Breadcrumb[] = [];
			let deferredTypeCrumb: Breadcrumb | null = null;
			let insertedDeferredType = false;
			const isFormsRoot = segments.length === 1;
			items.push({
				label: 'Forms',
				href: isFormsRoot ? undefined : '/forms',
				isCurrent: isFormsRoot
			});

			const hasTypeAtSecond = segments[1] === 'urban' || segments[1] === 'rural';
			const hasTypeAtThird = segments[2] === 'urban' || segments[2] === 'rural';
			const hasTypeAtFourth = segments[3] === 'urban' || segments[3] === 'rural';
			const typeSegmentIndex = hasTypeAtSecond ? 1 : hasTypeAtThird ? 2 : hasTypeAtFourth ? 3 : -1;
			const typeSegment = typeSegmentIndex >= 0 ? segments[typeSegmentIndex] : null;

			if (typeSegment === 'urban' || typeSegment === 'rural') {
				const typeLabel = typeSegment === 'urban' ? 'Urban' : 'Rural';
				const typeIsCurrent = segments.length === typeSegmentIndex + 1;
				const typeSelectionHref =
					typeSegmentIndex === 3
						? `/forms/${segments[1]}/${segments[2]}`
						: typeSegmentIndex === 2
							? `/forms/${segments[1]}`
							: '/forms';
				const selectedAgency =
					(typeSegmentIndex === 2 || typeSegmentIndex === 3 ? decodeMaybe(segments[1]) : null) ??
					(isSuperAdmin ? agencyInQuery : null) ??
					(typeof page.data?.rbac?.selectedAgency === 'string'
						? page.data.rbac.selectedAgency
						: null);

				if (selectedAgency) {
					const agencyIsCurrent = segments.length === 2;
					const agencyQuery = isSuperAdmin ? `?agency=${encodeURIComponent(selectedAgency)}` : '';
					items.push({
						label: formatAgencyCrumbLabel(selectedAgency),
						href: agencyIsCurrent ? undefined : `/forms${agencyQuery}`,
						isCurrent: agencyIsCurrent
					});
				}

				const typeCrumb: Breadcrumb = {
					label: typeLabel,
					href: typeIsCurrent ? undefined : typeSelectionHref,
					isCurrent: typeIsCurrent
				};
				if (typeSegmentIndex === 3) {
					deferredTypeCrumb = typeCrumb;
				} else {
					items.push(typeCrumb);
				}
			}

			const start =
				typeSegmentIndex === 1 ? 2 : typeSegmentIndex === 2 ? 2 : typeSegmentIndex === 3 ? 2 : 1;
			for (let i = start; i < segments.length; i++) {
				if (i === 1 && (typeSegmentIndex === 2 || typeSegmentIndex === 3)) continue;
				if (i === typeSegmentIndex) continue;
				const segment = segments[i];
				const isYearSegment = /^\d{4}$/.test(segment);
				const isAgencySegment = i === 1 && typeSegmentIndex !== 1;
				const label = isYearSegment
					? `FY${segment}`
					: isAgencySegment
						? formatAgencyCrumbLabel(segment)
						: prettySegment(segment);
				const isCurrent = i === segments.length - 1;
				const agencyQuery =
					isSuperAdmin && agencyInQuery ? `?agency=${encodeURIComponent(agencyInQuery)}` : '';
				const href = isCurrent
					? undefined
					: isYearSegment && (segments[1] === 'urban' || segments[1] === 'rural')
						? `/forms/${segments[1]}${agencyQuery}`
						: isYearSegment && (segments[2] === 'urban' || segments[2] === 'rural')
							? `/forms/${segments[1]}/${segments[2]}${agencyQuery}`
							: isYearSegment && (segments[3] === 'urban' || segments[3] === 'rural')
								? `/forms/${segments[1]}${agencyQuery}`
								: '/' + segments.slice(0, i + 1).join('/') + agencyQuery;
				items.push({ label, href, isCurrent });
				if (deferredTypeCrumb && !insertedDeferredType && typeSegmentIndex === 3 && isYearSegment) {
					items.push(deferredTypeCrumb);
					insertedDeferredType = true;
				}
			}
			if (deferredTypeCrumb && !insertedDeferredType) {
				items.push(deferredTypeCrumb);
			}

			return items;
		}

		return [{ label: pageTitle, isCurrent: true }];
	});

	const currentHeaderIcon = $derived.by<HeaderIconComponent | null>(() => {
		const segments = pathname.split('/').filter(Boolean);
		if (segments.length === 0) return null;
		if (segments[0] === 'forms') return FormsIcon;
		return HEADER_ICONS[segments[0]] ?? null;
	});
	const dashboardTabs = $derived([
		{
			label: 'Reports',
			href: '/dashboard',
			active: pathname === '/dashboard'
		},
		{
			label: 'Users',
			href: '/dashboard/users',
			active: pathname === '/dashboard/users' || pathname === '/dashboards/users'
		}
	]);
</script>

<section class="app-page grid h-dvh w-full overflow-hidden">
	{#if landingPage || !useSidebarLayout}
		<main
			class="app-surface flex h-full w-full flex-col overflow-hidden border border-[var(--border)] bg-(--surface-1) dark:bg-neutral-950"
		>
			{#if adminPage}
				<AdminTabs />
			{/if}
			<div
				class="flex h-full w-full grow flex-col justify-start overflow-y-scroll p-2 text-[var(--text)] dark:text-neutral-100"
			>
				{@render children()}
			</div>
			<OverlayRoot />
			<NavTabs />
		</main>
	{:else}
		<main
			class="app-surface flex h-full w-full overflow-hidden border border-[var(--border)] bg-(--surface-1) dark:bg-neutral-950"
		>
			<AppSidebar />

			<div class="flex min-w-0 flex-1 cursor-auto flex-col overflow-hidden select-none">
				<header
					class="flex h-14 shrink-0 items-center border-b border-[var(--border)] bg-[var(--surface-1)] px-4"
				>
					<div class="flex min-w-0 flex-1 items-center justify-between gap-3">
						<nav class="flex min-w-0 items-center gap-1" aria-label="Breadcrumb">
							{#each breadcrumbs as crumb, i}
								{@const isLastCrumb = i === breadcrumbs.length - 1}
								{#if i > 0}
									<span class="px-1 text-[var(--text-muted)]">›</span>
								{/if}
								{#if crumb.href}
									<a
										href={crumb.href}
										class={`rounded-sm px-2 py-1 text-base font-medium transition hover:bg-[var(--surface-2)] ${
											isLastCrumb ? 'text-[var(--theme-color)]' : 'text-[var(--text-muted)]'
										}`}
									>
										{crumb.label}
									</a>
								{:else}
									<span
										aria-current={crumb.isCurrent ? 'page' : undefined}
										class={`inline-flex items-center gap-2 rounded-sm px-2 py-1 text-xl font-semibold ${
											isLastCrumb ? 'text-[var(--theme-color)]' : 'text-[var(--text)]'
										}`}
									>
										{#if currentHeaderIcon}
											{@const HeaderIcon = currentHeaderIcon}
											<HeaderIcon class="h-5 w-5 shrink-0" />
										{/if}
										{crumb.label}
									</span>
								{/if}
							{/each}
						</nav>
						<div class="flex shrink-0 items-center gap-2">
							{#if pathname === '/dashboard/users' && page.data?.canCreateUsers}
								<a
									href="/dashboard/users?createUser=1"
									class="inline-flex h-9 min-w-[112px] items-center justify-center rounded-sm border border-[var(--theme-color)] bg-transparent px-3 text-sm font-semibold text-[var(--theme-color)] transition hover:bg-[var(--theme-color)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
								>
									Create User
								</a>
							{/if}
							{#if pathname === '/account/settings'}
								<button
									type="button"
									class="inline-flex h-9 min-w-[112px] items-center justify-center rounded-sm border border-[var(--theme-color)] bg-transparent px-3 text-sm font-semibold text-[var(--theme-color)] transition hover:bg-[var(--theme-color)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
								>
									Log Out
								</button>
							{/if}
							<FormsReportSaveButton />
						</div>
					</div>
				</header>

				{#if adminPage}
					<AdminTabs />
				{/if}

				<div
					class="flex h-full w-full grow flex-col justify-start overflow-y-scroll p-2 text-[var(--text)] dark:text-neutral-100"
				>
					{@render children()}
				</div>
				<OverlayRoot />
				{#if pathname === '/dashboard' || pathname.startsWith('/dashboard/')}
					<SecondaryTabs tabs={dashboardTabs} />
				{:else}
					<NavTabs />
				{/if}
			</div>
		</main>
	{/if}
</section>
