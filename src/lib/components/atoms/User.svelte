<script lang="ts">
	import IconUserCircle from '@tabler/icons-svelte/icons/user-circle';
</script>

<div class="relative">
	<button
		class="grid h-9 w-9 place-items-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
		aria-label="Account"
	>
		<IconUserCircle class="h-6 w-6 text-[var(--text-muted)]" />
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
							onclose={() => {
								open = false;
								btn?.focus();
							}}
						/>
					</div>
				{/if} -->
</div>
