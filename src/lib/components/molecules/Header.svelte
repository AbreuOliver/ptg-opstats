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
</script>

<!-- <header
	class="sticky inset-x-0 top-4 z-50 flex w-full flex-wrap before:absolute before:inset-0 before:mx-2 before:max-w-5xl before:rounded-full before:border before:border-neutral-200 after:absolute after:inset-0 after:-z-1 after:mx-2 after:max-w-5xl after:rounded-full after:bg-white md:flex-nowrap md:justify-start lg:before:mx-auto lg:after:mx-auto"
> -->
<header class="sticky top-4 z-50 flex w-full justify-center px-2">
	<!-- Frosted container -->
	<div
		class="relative w-full max-w-5xl rounded-full border border-neutral-600/30 bg-white/70 shadow-md backdrop-blur-md"
	>
		<!-- Gradient overlay for accent -->
		<div
			class="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-white/80 via-white/60 to-neutral-600/10"
		></div>
		<nav
			class="relative mx-2 min-h-14 w-full max-w-5xl rounded-full py-3 ps-6 pe-2 shadow-xs md:flex md:items-center md:justify-between md:gap-3 lg:mx-auto"
		>
			<!-- Logo w/ Collapse Button -->
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
						class="h-6 mt-1"
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
							<!-- <span class="px-2 text-sm text-neutral-600">{email}</span> -->

							<!-- <a
							class="flex items-center py-2 text-sm text-neutral-800 hover:text-indigo-500 focus:text-neutral-500 focus:outline-hidden"
							href="/dashboard"
						>
							<svg
								class="me-3 block size-4 shrink-0 md:me-2 md:hidden"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
								<circle cx="12" cy="7" r="4" />
							</svg>
							Dashboard
						</a>

						<button
							on:click={signOut}
							class="flex items-center px-4 py-2 text-sm text-neutral-700 hover:text-red-500 focus:outline-none"
							type="button"
						>
							Log Out
						</button>
						<span class="mr-20"></span>
						<span class="mr-20"></span>
						<span class="mr-20"></span> -->
							<!-- DROPDOWN MENU -->
							<Dropdown username={`${email.match(/^[^@]+/)?.[0]}`} {signOut} />
						{:else if error}
							<p class="mt-1 text-xs text-red-600">''</p>
						{/if}
					</div>
				</div>
			</div>
		</nav>
	</div>
</header>
