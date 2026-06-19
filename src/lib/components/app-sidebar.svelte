<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import LogoutConfirmationModal from '$lib/components/auth/LogoutConfirmationModal.svelte';
	import AutomationsIcon from '@tabler/icons-svelte/icons/automation';
	import CalendarIcon from '@tabler/icons-svelte/icons/calendar-event';
	import DashboardIcon from '@tabler/icons-svelte/icons/layout-dashboard';
	import FormsIcon from '@tabler/icons-svelte/icons/table';
	import ActivityIcon from '@tabler/icons-svelte/icons/activity';
	import IconLayoutSidebarLeftCollapse from '@tabler/icons-svelte/icons/layout-sidebar-left-collapse';
	import IconLogout from '@tabler/icons-svelte/icons/logout';
	import IconTableSpark from '@tabler/icons-svelte/icons/table-spark';
	import MessagesIcon from '@tabler/icons-svelte/icons/message-2';
	import ReportsIcon from '@tabler/icons-svelte/icons/chart-bar';
	import ResourcesIcon from '@tabler/icons-svelte/icons/books';
	import RoadmapIcon from '@tabler/icons-svelte/icons/route';
	import SupportIcon from '@tabler/icons-svelte/icons/lifebuoy';
	import TrainingIcon from '@tabler/icons-svelte/icons/school';
	import UsersIcon from '@tabler/icons-svelte/icons/users';
	import WhatsNewIcon from '@tabler/icons-svelte/icons/sparkles';
	import { untrack } from 'svelte';
	import { TRANSIT_SYSTEMS } from '$lib/data/transitSystems';
	import { normalizeAgencyName, toAgencyPathSegment } from '$lib/features/forms/persistence/agency';
	import { useUser } from '$lib/stores/user.svelte';

	let { showTitle = true }: { showTitle?: boolean } = $props();
	const { user } = useUser();

	const pathname = $derived(page.url.pathname);
	const isSuperAdmin = $derived(Boolean(page.data?.userScope?.isSuperAdmin));
	const canViewUsers = $derived(
		page.data?.userScope?.role === 'super_admin' || page.data?.userScope?.role === 'admin'
	);
	let sidebarCollapsed = $state(false);
	let sidebarToggleIconHidden = $state(false);
	let sidebarToggleIconTimer: ReturnType<typeof setTimeout> | null = null;
	let logoutModalOpen = $state(false);
	const userInitials = $derived.by(() => {
		const firstName = user.firstName.trim();
		const lastName = user.lastName.trim();
		if (firstName || lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
		const email = user.email ?? '';
		const source = email.includes('@') ? email.split('@')[0] : email;
		const cleaned = source.trim();
		if (!cleaned) return '--';
		return cleaned.slice(0, 2).toUpperCase();
	});

	type LinkItem = {
		label: string;
		href: string;
		icon: typeof DashboardIcon;
		badge?: string;
	};

	const primaryLinks = $derived<LinkItem[]>([
		{ label: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
		...(canViewUsers ? [{ label: 'Users', href: '/users', icon: UsersIcon }] : []),
		{ label: 'Activity', href: '/activity', icon: ActivityIcon },
		{ label: 'Forms', href: '/forms', icon: FormsIcon },
		{ label: 'Messages', href: '/messages', icon: MessagesIcon },
		{ label: 'Calendar', href: '/calendar', icon: CalendarIcon },
		{ label: 'Resources', href: '/resources', icon: ResourcesIcon },
		{ label: 'Reports', href: '/reports', icon: ReportsIcon },
		{ label: 'Automations', href: '/automations', icon: AutomationsIcon },
		{ label: 'Training', href: '/training', icon: TrainingIcon }
	]);

	const sidebarFooterLinks: LinkItem[] = [
		{ label: 'Support', href: '/support', icon: SupportIcon },
		{ label: "What's New", href: '/whats-new', icon: WhatsNewIcon },
		{ label: 'Roadmap', href: '/roadmap', icon: RoadmapIcon }
	];

	type RecentAgency = {
		name: string;
		href: string;
		initials: string;
		color: string;
	};

	const RECENT_AGENCIES_KEY = 'sidebar:recent-transit-agencies:v1';
	const MAX_RECENT_AGENCIES = 30;
	let recentAgencies = $state<RecentAgency[]>([]);

	function isActive(href: string): boolean {
		return pathname === href || pathname.startsWith(href + '/');
	}

	function agencyColor(name: string): string {
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = (hash * 31 + name.charCodeAt(i)) % 360;
		}
		return `hsl(${hash} 78% 42%)`;
	}

	function agencyInitials(name: string): string {
		const words = name
			.replace(/\([^)]*\)/g, '')
			.split(/[\s/-]+/)
			.map((word) => word.replace(/[^a-zA-Z0-9]/g, ''))
			.filter(Boolean);
		if (words.length === 0) return '--';
		if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
		return words
			.slice(0, 3)
			.map((word) => word[0])
			.join('')
			.toUpperCase();
	}

	function toggleSidebar() {
		sidebarToggleIconHidden = true;
		sidebarCollapsed = !sidebarCollapsed;
		if (sidebarToggleIconTimer) clearTimeout(sidebarToggleIconTimer);
		sidebarToggleIconTimer = setTimeout(() => {
			sidebarToggleIconHidden = false;
			sidebarToggleIconTimer = null;
		}, 220);
	}

	function makeRecentAgency(name: string): RecentAgency {
		return {
			name,
			href: `/forms/${toAgencyPathSegment(name)}`,
			initials: agencyInitials(name),
			color: agencyColor(name)
		};
	}

	function normalizeRecentAgencies(raw: unknown): RecentAgency[] {
		if (!Array.isArray(raw)) return [];
		return raw
			.map((item) => {
				if (typeof item === 'string') return makeRecentAgency(item);
				if (
					item &&
					typeof item === 'object' &&
					typeof (item as { name?: unknown }).name === 'string'
				) {
					return makeRecentAgency((item as { name: string }).name);
				}
				return null;
			})
			.filter((item): item is RecentAgency => item !== null)
			.slice(0, MAX_RECENT_AGENCIES);
	}

	function loadRecentAgencies(): RecentAgency[] {
		if (!browser) return [];
		try {
			return normalizeRecentAgencies(JSON.parse(localStorage.getItem(RECENT_AGENCIES_KEY) ?? '[]'));
		} catch {
			return [];
		}
	}

	function saveRecentAgencies(next: RecentAgency[]) {
		if (!browser) return;
		localStorage.setItem(RECENT_AGENCIES_KEY, JSON.stringify(next.map(({ name }) => ({ name }))));
	}

	function canonicalAgencyFromPath(path: string): string | null {
		const segments = path.split('/').filter(Boolean);
		if (segments[0] !== 'forms' || !segments[1]) return null;
		if (segments[1] === 'urban' || segments[1] === 'rural') return null;

		let decoded = segments[1];
		try {
			decoded = decodeURIComponent(decoded);
		} catch {
			// Use the raw segment if decoding fails.
		}

		const displayName = decoded.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
		if (!displayName || /^\d{4}$/.test(displayName)) return null;
		const normalizedDisplayName = normalizeAgencyName(displayName);
		const canonical = TRANSIT_SYSTEMS.find(
			(system) =>
				normalizeAgencyName(system.name) === normalizedDisplayName ||
				toAgencyPathSegment(system.name).toUpperCase() === segments[1].toUpperCase()
		);
		return canonical?.name ?? displayName;
	}

	function rememberAgency(name: string) {
		const normalized = normalizeAgencyName(name);
		const current = untrack(() => recentAgencies);
		const next = [
			makeRecentAgency(name),
			...current.filter((agency) => normalizeAgencyName(agency.name) !== normalized)
		].slice(0, MAX_RECENT_AGENCIES);
		recentAgencies = next;
		saveRecentAgencies(next);
	}

	function openLogoutModal() {
		logoutModalOpen = true;
	}

	function closeLogoutModal() {
		logoutModalOpen = false;
	}

	$effect(() => {
		if (!browser || !isSuperAdmin) return;
		recentAgencies = loadRecentAgencies();
	});

	$effect(() => {
		if (!browser || !isSuperAdmin) return;
		const agency = canonicalAgencyFromPath(pathname);
		if (agency) rememberAgency(agency);
	});
</script>

<aside
	class="flex h-full shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-2)] transition-[width] duration-300 ease-out dark:bg-[var(--surface-1)] {sidebarCollapsed
		? 'w-[72px]'
		: 'w-[260px]'}"
>
	<div class="h-14 shrink-0 border-b border-[var(--border)] px-3">
		<div
			class="relative flex h-full items-center {sidebarCollapsed
				? 'justify-center'
				: 'justify-between'}"
		>
			<div class="flex min-w-0 items-center gap-2">
				<IconTableSpark class="h-6 w-6 shrink-0" />
				<div
					class="min-w-0 overflow-hidden transition-all duration-300 {sidebarCollapsed
						? 'max-w-0 opacity-0'
						: 'max-w-[170px] opacity-100'}"
				>
					{#if showTitle}
						<h1
							class="cursor-default truncate text-lg font-semibold tracking-normal text-[var(--text)]"
						>
							NC OpStats
						</h1>
					{/if}
				</div>
			</div>
			<button
				type="button"
				onclick={toggleSidebar}
				class="{sidebarCollapsed
					? 'absolute inset-0 opacity-0'
					: 'p-1 opacity-100'} text-[var(--text-muted)] transition hover:text-[var(--text)]"
				aria-label="Toggle sidebar"
				aria-expanded={!sidebarCollapsed}
			>
				<!-- <svg
					viewBox="0 0 24 24"
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="m15 18-6-6 6-6"></path>
					<path
						d="m9 18 6-6-6-6"
						class="origin-center transition-transform duration-300 {sidebarCollapsed
							? 'rotate-180'
							: 'rotate-0'}"
					></path>
				</svg> -->
				<IconLayoutSidebarLeftCollapse
					class="h-6 w-6 origin-center transition-[opacity,transform] duration-300 {sidebarCollapsed
						? 'rotate-180'
						: 'rotate-0'} {sidebarCollapsed || sidebarToggleIconHidden
						? 'opacity-0'
						: 'opacity-100'}"
				/>
			</button>
		</div>
	</div>

	<nav class="flex flex-1 flex-col gap-0 py-1">
		{#each primaryLinks as link}
			{@const active = isActive(link.href)}
			{@const LinkIcon = link.icon}
			<a
				href={link.href}
				aria-current={active ? 'page' : undefined}
				class="relative flex items-center px-4 py-2.5 text-base font-medium transition-colors {sidebarCollapsed
					? 'justify-center'
					: 'gap-3'} {active
					? 'border-l-2 border-[var(--theme-color)] bg-[var(--surface-1)] text-[var(--text)]'
					: 'border-l-2  border-transparent text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--surface-2)_72%,black_5%)] hover:text-[var(--text)]'}"
				title={sidebarCollapsed ? link.label : undefined}
			>
				<LinkIcon class="h-6 w-6 shrink-0 {active ? 'text-[var(--theme-color)]' : ''}" />
				<span
					class="overflow-hidden whitespace-nowrap transition-all duration-300 {sidebarCollapsed
						? 'max-w-0 font-bold opacity-0'
						: 'max-w-[160px] opacity-100'} {active ? 'font-bold' : ''}">{link.label}</span
				>
				{#if link.badge && !sidebarCollapsed}
					<span
						class="ml-auto rounded-full bg-[var(--theme-color)] px-2 py-0.5 text-[12px] text-white"
					>
						{link.badge}
					</span>
				{/if}
			</a>
		{/each}

		{#if isSuperAdmin}
			<div
				class="mt-6 mb-2 overflow-hidden px-4 text-xs font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase transition-all duration-300 {sidebarCollapsed
					? 'max-h-0 opacity-0'
					: 'max-h-6 opacity-100'}"
			>
				Recently Viewed
			</div>
			<div
				class="mt-1 flex flex-col gap-1 overflow-y-auto transition-all duration-300 {sidebarCollapsed
					? 'max-h-0 opacity-0'
					: 'max-h-60 opacity-100'}"
			>
				{#each recentAgencies as agency}
					<a
						href={agency.href}
						class="flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--surface-1)]"
						title={agency.name}
					>
						<span
							class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
							style={`background-color: ${agency.color}`}>{agency.initials}</span
						>
						<span class="truncate text-sm font-medium text-[#2b2f36] dark:text-[var(--text)]"
							>{agency.name}</span
						>
					</a>
				{/each}
			</div>
		{/if}
	</nav>

	<div class="border-t border-[var(--border)] px-0 py-1">
		<div class="flex flex-col gap-1">
			{#each sidebarFooterLinks as link}
				{@const LinkIcon = link.icon}
				<a
					href={link.href}
					class="flex items-center px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface-1)] hover:text-[var(--text)] {sidebarCollapsed
						? 'justify-center'
						: 'gap-2'}"
					title={sidebarCollapsed ? link.label : undefined}
				>
					<LinkIcon class="h-5 w-5 shrink-0" />
					<span
						class="overflow-hidden whitespace-nowrap transition-all duration-300 {sidebarCollapsed
							? 'max-w-0 opacity-0'
							: 'max-w-[120px] opacity-100'}">{link.label}</span
					>
				</a>
			{/each}
		</div>
	</div>

	<div
		class="flex h-14 shrink-0 items-center border-t border-[var(--border)] bg-[var(--surface-2)] p-3 dark:bg-[var(--surface-1)] {sidebarCollapsed
			? 'justify-center'
			: 'gap-2'}"
	>
		<a
			href="/account/settings"
			class="flex min-w-0 flex-1 items-center transition hover:bg-[var(--surface-1)] dark:hover:bg-[var(--surface-2)] {sidebarCollapsed
				? 'justify-center'
				: 'gap-3'}"
			aria-label="Account settings"
			title={sidebarCollapsed ? 'Account settings' : undefined}
		>
			<span
				class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--theme-color)] text-xs font-bold text-white"
				>{userInitials}</span
			>
			<div
				class="min-w-0 overflow-hidden transition-all duration-300 {sidebarCollapsed
					? 'max-w-0 opacity-0'
					: 'max-w-[130px] opacity-100'}"
			>
				<div class="truncate text-base font-semibold text-[var(--text)]" title={user.displayName}>
					{user.displayName}
				</div>
			</div>
		</a>
		<!-- <button
			type="button"
			class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-[var(--text-muted)] transition hover:bg-[var(--surface-1)] hover:text-[var(--text)] dark:hover:bg-[var(--surface-2)]"
			aria-label="Log out"
			title="Log out"
			onclick={openLogoutModal}
		>
			<IconLogout class="h-5 w-5" />
		</button> -->
	</div>
</aside>

<LogoutConfirmationModal
	open={logoutModalOpen}
	displayName={user.displayName}
	email={user.email}
	onClose={closeLogoutModal}
/>
