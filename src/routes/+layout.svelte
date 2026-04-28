<script lang="ts">
	import { page } from '$app/state';
	import '../app.css';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import NavTabs from '$lib/components/molecules/NavTabs.svelte';
	import OverlayRoot from '$lib/components/OverlayRoot.svelte';
	import AdminTabs from '$lib/components/molecules/AdminTabs.svelte';
	import FormsReportSaveButton from '$lib/components/forms/FormsReportSaveButton.svelte';
	import type { Component } from 'svelte';
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

	const HEADER_ICONS: Record<string, Component> = {
		dashboard: DashboardIcon,
		forms: FormsIcon,
		admin: FormsIcon,
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

	const breadcrumbs = $derived.by<Breadcrumb[]>(() => {
		const segments = pathname.split('/').filter(Boolean);
		if (segments.length === 0) return [];

		if (segments[0] === 'forms') {
			const items: Breadcrumb[] = [];
			const isFormsRoot = segments.length === 1;
			items.push({
				label: 'Forms',
				href: isFormsRoot ? undefined : '/forms',
				isCurrent: isFormsRoot
			});

			if (segments[1] === 'urban' || segments[1] === 'rural') {
				const typeLabel = segments[1] === 'urban' ? 'Urban' : 'Rural';
				const typeIsCurrent = segments.length === 2;
				items.push({
					label: typeLabel,
					// requested behavior: type crumb returns to /forms selection page
					href: typeIsCurrent ? undefined : '/forms',
					isCurrent: typeIsCurrent
				});
			}

			const start = segments[1] === 'urban' || segments[1] === 'rural' ? 2 : 1;
			for (let i = start; i < segments.length; i++) {
				const segment = segments[i];
				const isYearSegment = /^\d{4}$/.test(segment);
				const label = isYearSegment ? `FY${segment}` : prettySegment(segment);
				const isCurrent = i === segments.length - 1;
				const href = isCurrent
					? undefined
					: isYearSegment && (segments[1] === 'urban' || segments[1] === 'rural')
						? `/forms/${segments[1]}`
						: '/' + segments.slice(0, i + 1).join('/');
				items.push({ label, href, isCurrent });
			}

			return items;
		}

		return [{ label: pageTitle, isCurrent: true }];
	});

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

	const currentHeaderIcon = $derived.by<Component | null>(() => {
		const segments = pathname.split('/').filter(Boolean);
		if (segments.length === 0) return null;
		if (segments[0] === 'forms') return FormsIcon;
		return HEADER_ICONS[segments[0]] ?? null;
	});
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
											isLastCrumb
												? 'text-[var(--theme-color)]'
												: 'text-[var(--text-muted)]'
										}`}
									>
										{crumb.label}
									</a>
								{:else}
									<span
										aria-current={crumb.isCurrent ? 'page' : undefined}
										class={`inline-flex items-center gap-2 rounded-sm px-2 py-1 text-base font-semibold ${
											isLastCrumb ? 'text-[var(--theme-color)]' : 'text-[var(--text)]'
										}`}
									>
										{#if currentHeaderIcon}
											<svelte:component this={currentHeaderIcon} class="h-5 w-5 shrink-0" />
										{/if}
										{crumb.label}
									</span>
								{/if}
							{/each}
						</nav>
						<FormsReportSaveButton />
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
				<NavTabs />
			</div>
		</main>
	{/if}
</section>
