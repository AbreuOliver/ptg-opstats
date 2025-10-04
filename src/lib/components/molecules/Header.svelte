<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import Logo from '$lib/components/atoms/Logo.svelte';
	import Dropdown from './Dropdown.svelte';

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

	const tabs = [
		{ label: 'Home', href: '/' },
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Forms', href: '/forms' },
		{ label: 'Wallet', href: '/wallet' },
		{ label: 'Balance', href: '/balance' }
	];

	$: path = $page.url.pathname;
	const isActive = (href: string) => path === href || path.startsWith(href + '/');
</script>

<!-- <header class="sticky top-4 z-50 flex w-full justify-center px-2">
	<div
		class="relative w-full max-w-5xl rounded-full border border-neutral-600/30 bg-white/70 shadow-md backdrop-blur-md"
	>

		<div
			class="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-white/80 via-white/60 to-neutral-600/10"
		></div>
		<nav
			class="relative mx-2 min-h-14 w-full max-w-5xl rounded-full py-3 ps-6 pe-2 shadow-xs md:flex md:items-center md:justify-between md:gap-3 lg:mx-auto"
		>
			<div class="justify-items flex min-w-fit items-center">
				<Logo height="sm" marginRight="sm" />
				<a
					class="flex-none text-xl font-semibold text-black focus:opacity-80 focus:outline-hidden"
					href="/"
					aria-label="Brand"
				>
					<img
						src="https://ik.imagekit.io/bip1v395ybp/TransitOps_xMfK5rrKOX.svg?updatedAt=1749050428346"
						alt="OpStats Web Form"
						class="mt-1 h-6"
					/>
				</a>
			</div>

			<div
				id="hs-header-classic"
				class="hs-collapse hidden grow basis-full overflow-hidden transition-all duration-300 md:block"
				aria-labelledby="hs-header-classic-collapse"
			>
				<div
					class="max-h-[75vh] overflow-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-track]:bg-neutral-100"
				>
					<div
						class="flex flex-col gap-0.5 py-2 md:flex-row md:items-center md:justify-end md:gap-1 md:py-0"
					>
						{#if authenticated}
							<a
								class="flex items-center rounded-4xl border-2 border-transparent px-4 py-2 text-sm font-medium text-neutral-800 hover:border-violet-900 hover:text-indigo-500 focus:text-neutral-500 focus:outline-hidden"
								href="/dashboard"
							>
								Dashboard
							</a>
							<a
								class="flex items-center rounded-4xl border-2 border-transparent px-4 py-2 text-sm font-medium text-neutral-800 hover:border-violet-900 hover:text-indigo-500 focus:text-neutral-500 focus:outline-hidden"
								href="/forms"
							>
								Forms
							</a>
							<span class="mr-28"></span>
							
							<Dropdown username={`${email.match(/^[^@]+/)?.[0]}`} {signOut} />
						{:else if error}
							<p class="mt-1 text-xs text-red-600">''</p>
						{/if}
					</div>
				</div>
			</div>
		</nav>
	</div>
</header> -->

<header
	class="z-50 w-full border-b-3 border-neutral-200/10 bg-neutral-100 px-8 backdrop-blur supports-[backdrop-filter]:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950/70"
>
	<div class="flex h-14 items-center gap-4">
		<div class="justify-items flex min-w-fit items-center">
			<a
				class="flex text-xl font-semibold text-black focus:opacity-80 focus:outline-hidden pl-1"
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
							? 'bg-indigo-400'
							: 'bg-transparent'}"
					></span>
				</a>
			{/each}
		</nav>

		<!-- Right-side actions -->
		<div class="ml-auto flex items-center gap-4">
			<button
				class="grid h-9 w-9 place-items-center rounded-md text-neutral-400 hover:bg-neutral-800"
				aria-label="Notifications"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
					><path
						fill="none"
						stroke="#fff"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6M9 17v1a3 3 0 0 0 6 0v-1"
					/></svg
				>
			</button>
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
