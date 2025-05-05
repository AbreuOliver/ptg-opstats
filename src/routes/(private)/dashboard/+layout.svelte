<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';

	const signOut = async () => {
		await supabase.auth.signOut();
		goto('/'); // redirect to landing page or login
	};

	export let data: { username: string | null };
</script>

<div class="flex w-screen items-center justify-center border-b border-neutral-500">
	<button class="btn btn-secondary" on:click={signOut}> Log Out </button>
	<div class="grow border"></div>
	<div class="border">
		<!-- {#if data.username} -->
			<p class="pr-6 text-sm font-semibold">{data.username}</p>
		<!-- {/if} -->
	</div>
</div>

<slot />
