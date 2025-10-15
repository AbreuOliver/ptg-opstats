<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { getTheme, toggleTheme } from '$lib/theme';

	import Logo from '$lib/components/atoms/Logo.svelte';
	

	let isDark = false;
	onMount(() => {
		isDark = getTheme() === 'dark';
	});
	function handleClick() {
		toggleTheme();
		isDark = !isDark;
	}

	let email = '';
	let error: string | null = null;
	let authenticated = false;

	onMount(async () => {
		const {
			data: { user },
			error
		} = await supabase.auth.getUser();

		if (error) {
			console.error('Error retrieving user:', error.message);
			return;
		}

		if (user?.email) {
			email = user.email;
			authenticated = true;
		}
	});

	const signOut = async () => {
		await supabase.auth.signOut();
		window.location.href = '/';
	};

	import { page } from '$app/stores';
	import DarkModeToggle from '../atoms/ DarkModeToggle.svelte';

	const tabs = [
		{ label: 'Docs', href: '/docs' },
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Forms', href: '/forms' },
		{ label: 'Past Data', href: '/past-data' }
		// { label: 'Balance', href: '/balance' }
	];

	$: path = $page.url.pathname;
	const isActive = (href: string) => path === href || path.startsWith(href + '/');
</script>

<header
	class="z-50 w-full border-b-3 border-neutral-200/10 bg-neutral-100 px-8 backdrop-blur supports-[backdrop-filter]:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950/70"
>
	<div class="flex h-14 items-center gap-4">
		<div class="justify-items flex min-w-fit items-center">
			<a
				class="flex pl-1 text-xl font-semibold text-black focus:opacity-80 focus:outline-hidden"
				href="/"
				aria-label="NC OpStats Logo"
			>
				<Logo height="sm" marginRight="sm" />
				<img
					src="https://ik.imagekit.io/bip1v395ybp/NC%20OpStats_LdXX5wi4Nu.png?updatedAt=1759505530478"
					alt="OpStats Web Form"
					class="mt-0.75 ml-0.5 h-5"
				/>
			</a>
		</div>

		<!-- Tabs -->
		<nav class="ml-16 hidden items-stretch gap-6 md:flex">
			{#each tabs as t}
				<a
					href={t.href}
					aria-current={isActive(t.href) ? 'page' : undefined}
					class="text-md relative flex min-w-16 items-center px-3 font-medium
                 	transition-colors hover:text-neutral-100 {isActive(t.href)
						? 'text-white'
						: 'text-neutral-400'}"
				>
					{t.label}
					<!-- active underline/indicator -->
					<span
						class="pointer-events-none absolute right-2 -bottom-4.5 left-2 h-[2px] rounded {isActive(
							t.href
						)
							? 'bg-green-400'
							: 'bg-transparent'}"
					></span>
				</a>
			{/each}
		</nav>

		<!-- Right-side actions -->
		<div class="ml-auto flex items-center gap-4">
			<DarkModeToggle />
			<button
				class="grid h-9 w-9 place-items-center rounded-md text-neutral-400 hover:bg-neutral-800"
				aria-label="Notifications"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24">
					<path
						fill="none"
						stroke="#fff"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width={2}
						d="M8 9h8m-8 4h6m4-9a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"
					></path>
				</svg>
			</button>
			<!--  -->
			<div class="relative">
				<button
					class="grid h-9 w-9 place-items-center rounded-md text-neutral-400 hover:bg-neutral-800"
					aria-label="Account"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
						><path
							fill="none"
							stroke="#fff"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
						/></svg
					>
				</button>
				<!-- {#if open}
					<div
						id={menuId}
						tabindex="-1"
						role="menu"
						class="absolute right-0 z-50 mt-2 w-56 rounded-md border border-neutral-800 bg-neutral-900 p-1 shadow-xl"
					>
						<Dropdown
							username={username(email)}
							{signOut}
							on:close={() => {
								open = false;
								btn?.focus();
							}}
						/>
					</div>
				{/if} -->
			</div>
			<button
				class="grid h-9 w-9 place-items-center rounded-md text-neutral-400 hover:bg-neutral-800"
				aria-label="Search"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
					><path
						fill="none"
						stroke="#fff"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 6h10M4 12h16M7 12h13M4 18h10"
					/></svg
				>
			</button>
		</div>
	</div>
</header>
