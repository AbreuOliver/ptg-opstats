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

<nav class="ml-16 hidden items-stretch gap-6 md:flex">
	{#each tabs as t}
		{@const active = isActivePath(path, t.href)}
		<a
			href={t.href}
			aria-current={active ? 'page' : undefined}
			class="text-md relative flex min-w-16 items-center px-3 font-medium text-neutral-700
             			transition-colors hover:text-neutral-100 {active
				? 'text-neutral-900 dark:text-white'
				: 'text-neutral-400'}"
		>
			{t.label}
			<span
				class="pointer-events-none absolute right-2 -bottom-5 left-2 h-1 rounded
                   {active ? 'bg-red-800 dark:bg-red-600' : 'bg-transparent'}"
			></span>
		</a>
	{/each}
</nav>
