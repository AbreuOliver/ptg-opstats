<!-- <script lang="ts">
	import DarkModeToggle from '$lib/components/atoms/DarkModeToggle.svelte';
	import Menu from '../atoms/Menu.component.svelte';
	import Messages from '../atoms/Messages.svelte';
	import User from '../atoms/User.svelte';
</script>

<div class="ml-auto flex items-center gap-4">
	<DarkModeToggle />
	<Messages />
	<User />
	<Menu />
</div> -->

<script lang="ts">
	import DarkModeToggle from '$lib/components/atoms/DarkModeToggle.svelte';
	import Menu from '../atoms/Menu.component.svelte';
	import Messages from '../atoms/Messages.svelte';
	import User from '../atoms/User.svelte';
	import { openOverlay } from '../overlay.svelte';
	//   import AccountPanel from '$lib/panels/AccountPanel.svelte';
	import InboxPanel from '../Panels/InboxPanel.svelte';

	//   function openAccount() { openOverlay(AccountPanel, { /* props */ }); }
	function openInbox() {
		openOverlay(InboxPanel, {
			/* props */
		});
	}
</script>

<div class="ml-auto flex items-center gap-4">
	<DarkModeToggle />

	<button
		class="grid h-9 w-9 place-items-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)] dark:text-neutral-300 dark:hover:bg-neutral-800"
		aria-label="Notifications"
		onclick={openInbox}
	>
		<!-- bell icon -->
		<svg viewBox="0 0 24 24" width="24" height="24"
			><path
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				d="M8 9h8m-8 4h6m4-9a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"
			/></svg
		>
	</button>
	<!-- <Messages /> -->
	<User />
	<Menu />
</div>
