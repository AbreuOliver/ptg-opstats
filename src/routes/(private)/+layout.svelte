<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';

	const signOut = async () => {
		await supabase.auth.signOut();
		goto('/'); // redirect to landing page or login
	};

	export let data: { username: string | null };
</script>

<div class="flex min-h-12 w-screen items-center justify-center border-b border-gray-200 px-6 py-2">
	<button
		on:click={signOut}
		class="transform rounded-md border border-neutral-300 bg-neutral-100 px-4 py-2 text-sm text-neutral-600 transition duration-200 hover:-translate-y-1 hover:shadow-md"
	>
		Log Out
	</button>

	<div class="grow"></div>
	<div class="">
		{#if data.username}
			<p class="pr-6 text-sm font-semibold text-gray-800">{data.username}</p>
		{/if}
	</div>
</div>

<slot />
