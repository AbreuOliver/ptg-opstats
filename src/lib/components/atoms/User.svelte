<div class="relative">
	<button
		class="grid h-9 w-9 place-items-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
		aria-label="Account"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="text-[var(--text-muted)] hover:bg-[var(--surface-2)]" width="24" height="24" viewBox="0 0 24 24"
			><path
				fill="none"
				stroke="currentColor"
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
							onclose={() => {
								open = false;
								btn?.focus();
							}}
						/>
					</div>
				{/if} -->
</div>
