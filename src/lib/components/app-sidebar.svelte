<script lang="ts">
	import { page } from '$app/state';
	import type { Component } from 'svelte';
	import { roleForEmail, useUser } from '$lib/stores/user.svelte';
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

	let { showTitle = true }: { showTitle?: boolean } = $props();
	const { user } = useUser();

	const pathname = $derived(page.url.pathname);
	let sidebarCollapsed = $state(false);
	const userInitials = $derived.by(() => {
		const email = user.email ?? '';
		const source = email.includes('@') ? email.split('@')[0] : email;
		const cleaned = source.trim();
		if (!cleaned) return '--';
		return cleaned.slice(0, 2).toUpperCase();
	});
	const userRole = $derived.by(() => roleForEmail(user.email));

	type LinkItem = {
		label: string;
		href: string;
		icon: Component;
		badge?: string;
	};

	const primaryLinks: LinkItem[] = [
		{ label: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
		{ label: 'Notifications', href: '/notifications', icon: NotificationsIcon, badge: '3' },
		{ label: 'Forms', href: '/forms', icon: FormsIcon },
		{ label: 'Messages', href: '/messages', icon: MessagesIcon },
		{ label: 'Calendar', href: '/calendar', icon: CalendarIcon },
		{ label: 'Resources', href: '/resources', icon: ResourcesIcon },
		{ label: 'Reports', href: '/reports', icon: ReportsIcon },
		{ label: 'Automations', href: '/automations', icon: AutomationsIcon },
		{ label: 'Training', href: '/training', icon: TrainingIcon }
	];

	const sidebarFooterLinks: LinkItem[] = [
		{ label: 'Support', href: '/support', icon: SupportIcon },
		{ label: "What's New", href: '/whats-new', icon: WhatsNewIcon },
		{ label: 'Roadmap', href: '/roadmap', icon: RoadmapIcon }
	];

	const recentCases = [
		{ name: 'Go Wake Access', color: 'bg-violet-500', initial: 'GWA' },
		{ name: 'JCATS', color: 'bg-cyan-600', initial: 'JC' },
		{ name: 'Yadkin Valley', color: 'bg-orange-600', initial: 'YV' }
	];

	function isActive(href: string): boolean {
		return pathname === href || pathname.startsWith(href + '/');
	}
</script>

<aside
	class="flex h-full shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-2)] transition-[width] duration-300 ease-out dark:bg-[var(--surface-1)] {sidebarCollapsed
		? 'w-[72px]'
		: 'w-[260px]'}"
>
	<div class="h-14 shrink-0 border-b border-[var(--border)] px-3">
		<div class="flex h-full items-center justify-between">
			<div
				class="min-w-0 overflow-hidden transition-all duration-300 {sidebarCollapsed
					? 'max-w-0 opacity-0'
					: 'max-w-[200px] opacity-100'}"
			>
				{#if showTitle}
					<h1 class="truncate text-lg font-semibold tracking-normal text-[var(--text)]">NC OpStats</h1>
				{/if}
			</div>
			<button
				type="button"
				onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
				class="p-1 text-[var(--text-muted)] transition hover:text-[var(--text)]"
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
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
					><g
						fill="none"
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						><path
							class="origin-center transition-transform duration-300 {sidebarCollapsed
								? 'rotate-180'
								: 'rotate-0'}"
							d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm11-2v16"
						/><path
							class="origin-center transition-transform duration-300 {sidebarCollapsed
								? 'rotate-180'
								: 'rotate-0'}"
							d="m10 10l-2 2l2 2"
						/></g
					></svg
				>
			</button>
		</div>
	</div>

	<nav class="flex flex-1 flex-col gap-0 py-1">
		{#each primaryLinks as link}
			{@const active = isActive(link.href)}
			<a
				href={link.href}
				aria-current={active ? 'page' : undefined}
				class="relative flex items-center px-4 py-2.5 text-sm font-medium transition-colors {sidebarCollapsed
					? 'justify-center'
					: 'gap-3'} {active
					? 'border-l-2 border-[var(--theme-color)] bg-[var(--surface-1)] text-[var(--text)]'
					: 'border-l-2 border-transparent text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--surface-2)_72%,black_5%)] hover:text-[var(--text)]'}"
				title={sidebarCollapsed ? link.label : undefined}
			>
				<svelte:component
					this={link.icon}
					class="h-6 w-6 shrink-0 {active ? 'text-[var(--theme-color)]' : ''}"
				/>
				<span
					class="overflow-hidden whitespace-nowrap transition-all duration-300 {sidebarCollapsed
						? 'max-w-0 opacity-0'
						: 'max-w-[160px] opacity-100'}">{link.label}</span
				>
				{#if link.badge && !sidebarCollapsed}
					<span class="ml-auto rounded-full bg-[var(--theme-color)] px-2 py-0.5 text-[12px] text-white">
						{link.badge}
					</span>
				{/if}
			</a>
		{/each}

		<div
			class="mt-3 overflow-hidden px-4 text-xs font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase transition-all duration-300 {sidebarCollapsed
				? 'max-h-0 opacity-0'
				: 'max-h-6 opacity-100'}"
		>
			Recently Viewed
		</div>
		<div
			class="mt-1 flex flex-col gap-1 overflow-hidden transition-all duration-300 {sidebarCollapsed
				? 'max-h-0 opacity-0'
				: 'max-h-40 opacity-100'}"
		>
			{#each recentCases as person}
				<button
					type="button"
					class="flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--surface-1)]"
				>
					<span
						class="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white {person.color}"
						>{person.initial}</span
					>
					<span class="text-sm font-medium text-[#2b2f36] dark:text-[var(--text)]"
						>{person.name}</span
					>
				</button>
			{/each}
		</div>
	</nav>

	<div class="border-t border-[var(--border)] px-0 py-1">
		<div class="flex flex-col gap-1">
			{#each sidebarFooterLinks as link}
				<a
					href={link.href}
					class="flex items-center px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface-1)] hover:text-[var(--text)] {sidebarCollapsed
						? 'justify-center'
						: 'gap-2'}"
					title={sidebarCollapsed ? link.label : undefined}
				>
					<svelte:component this={link.icon} class="h-5 w-5 shrink-0" />
					<span
						class="overflow-hidden whitespace-nowrap transition-all duration-300 {sidebarCollapsed
							? 'max-w-0 opacity-0'
							: 'max-w-[120px] opacity-100'}">{link.label}</span
					>
				</a>
			{/each}
		</div>
	</div>

	<a
		href="/account/settings"
		class="flex h-14 shrink-0 items-center border-t border-[var(--border)] bg-[var(--surface-2)] p-3 transition hover:bg-[var(--surface-1)] dark:bg-[var(--surface-1)] dark:hover:bg-[var(--surface-2)] {sidebarCollapsed
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
				: 'max-w-[140px] opacity-100'}"
		>
			<div class="truncate text-base font-semibold text-[var(--text)]">{user.email ?? ''}</div>
			<div class="truncate text-sm text-[var(--text-muted)]">{userRole}</div>
		</div>
	</a>
</aside>
