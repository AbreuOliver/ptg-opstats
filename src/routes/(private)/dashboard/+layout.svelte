<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';

	const signOut = async () => {
		await supabase.auth.signOut();
		goto('/'); // redirect to landing page or login
	};
</script>

<div class="w-screen border-b">
<button class="btn btn-secondary" on:click={signOut}>
	Log Out
</button>
</div>
<slot />