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
	import IconBell from '@tabler/icons-svelte/icons/bell';
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
		<IconBell class="h-6 w-6" />
	</button>
	<!-- <Messages /> -->
	<User />
	<Menu />
</div>
