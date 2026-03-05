<script lang="ts">
	import { page } from '$app/state';
	import { isActivePath } from '$lib/utils/url';

	const tabs = [
		{ label: 'Admin', href: '/admin' },
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Forms', href: '/forms' },
		{ label: 'Past Data', href: '/past-data' }
	];

	const path = $derived(page.url.pathname);
</script>

<nav
	class="hidden items-center gap-1 rounded-lg bg-[var(--surface-2)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] md:flex"
>
	{#each tabs as t}
		{@const active = isActivePath(path, t.href)}
		<a
			href={t.href}
			aria-current={active ? 'page' : undefined}
			class="relative flex min-w-[5.5rem] items-center justify-center rounded-md border px-4 py-1.5 text-base font-semibold whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-colors {active
				? 'border-[var(--theme-color)] bg-[var(--surface-1)] text-[var(--theme-color)]'
				: 'border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_88%,black_6%)] text-[var(--text-muted)] hover:bg-[var(--surface-1)] hover:text-[var(--accent-color)]'}"
		>
			{t.label}
		</a>
	{/each}
</nav>
