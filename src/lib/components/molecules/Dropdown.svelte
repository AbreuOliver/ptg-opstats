<script lang="ts">
	export let username: string;
	export let signOut: () => void;

	let open = false;
	let show = false;

	function toggle() {
		open = !open;
		if (open) {
			show = false;
			setTimeout(() => {
				show = true;
			}, 1000);
		}
	}

	const items = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/forms', label: 'Forms' },
		{ label: 'Sign out', isSignOut: true }
	];

	function clickOutside(node: HTMLElement) {
	function handleClick(event: MouseEvent) {
		if (!node.contains(event.target as Node)) {
			node.dispatchEvent(new CustomEvent('click_outside'));
		}
	}
	document.addEventListener('click', handleClick, true);
	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}

</script>

<!-- <div class="absolute z-100 mr-4 inline-block text-left" on:focusout={() => (open = false)}> -->
<div use:clickOutside on:click_outside={() => (open = false)} class="absolute z-100 mr-4 inline-block text-left">

	<button
		id="dropdownAvatarNameButton"
		aria-haspopup="true"
		aria-expanded={open}
		on:click={toggle}
		class="flex items-center rounded-full bg-gray-100/50 px-4 py-1.5 text-sm font-medium text-gray-900 hover:text-indigo-600 focus:ring-4 focus:ring-gray-100 md:me-0 dark:text-white dark:hover:text-indigo-500 dark:focus:ring-gray-700"
		type="button"
	>
		<span class="sr-only">Open user menu</span>
		<!-- SVGs omitted for brevity -->
		{username}
		<!-- Down arrow SVG -->
	</button>

	{#if open}
		<div
			id="dropdownAvatarName"
			class="absolute right-0 z-10 mt-2 w-44 divide-y divide-gray-100 rounded-xl border-gray-200 bg-white shadow-md"
			role="menu"
			aria-labelledby="dropdownAvatarNameButton"
		>
			<ul class="py-2 text-sm text-gray-700  dark:text-gray-200" role="none">
				{#each items as item (item.label)}
					<li role="none">
						{#if item.isSignOut}
							<button
								class="block capitalize w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
								role="menuitem"
								tabindex="0"
								type="button"
								on:click={() => {
									open = false;
									signOut();
								}}
							>
								{item.label}
							</button>
						{:else}
							<a
								href={item.href}
								class={`block capitalize px-4 py-2 hover:bg-gray-100 ${
									item.label === 'Sign out' ? 'text-red-600' : ''
								}`}
								role="menuitem"
								tabindex="0"
							>
								{item.label}
							</a>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
