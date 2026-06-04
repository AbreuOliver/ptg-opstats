<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import IconDotsVertical from '@tabler/icons-svelte/icons/dots-vertical';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: { message?: string } | null } = $props();
	let creatingUser = $state(false);
	let email = $state('');
	let emailStatus = $state<'idle' | 'invalid' | 'checking' | 'available' | 'duplicate' | 'error'>(
		'idle'
	);
	let agencyQuery = $state('');
	let selectedSystemInfoId = $state('');
	let agencyComboboxOpen = $state(false);
	let selectedDeleteUser = $state<PageData['users'][number] | null>(null);
	let deleteConfirmOpen = $state(false);
	let deleteConfirmation = $state('');
	let deletingUser = $state(false);
	const createModalOpen = $derived(page.url.searchParams.get('createUser') === '1');
	const emailIsUsable = $derived(emailStatus === 'available');
	const canConfirmDelete = $derived(deleteConfirmation.trim().toLowerCase() === 'delete');
	const filteredSystemOptions = $derived.by(() => {
		const query = agencyQuery.trim().toLowerCase();
		const options = query
			? data.systemOptions.filter((option) => option.name.toLowerCase().includes(query))
			: data.systemOptions;
		return options.slice(0, 12);
	});

	function formatRole(role: string): string {
		return role
			.split('_')
			.map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
			.join(' ');
	}

	function closeCreateModal() {
		const url = new URL(page.url);
		url.searchParams.delete('createUser');
		goto(`${url.pathname}${url.search}${url.hash}`, { replaceState: true, noScroll: true });
	}

	function selectAgency(option: PageData['systemOptions'][number]) {
		agencyQuery = option.name;
		selectedSystemInfoId = String(option.id);
		agencyComboboxOpen = false;
	}

	function syncSelectedAgency() {
		const exact = data.systemOptions.find(
			(option) => option.name.toLowerCase() === agencyQuery.trim().toLowerCase()
		);
		selectedSystemInfoId = exact ? String(exact.id) : '';
	}

	function openDeleteModal(user: PageData['users'][number]) {
		selectedDeleteUser = user;
		deleteConfirmOpen = false;
		deleteConfirmation = '';
	}

	function closeDeleteModal() {
		selectedDeleteUser = null;
		deleteConfirmOpen = false;
		deleteConfirmation = '';
		deletingUser = false;
	}

	$effect(() => {
		if (createModalOpen) return;
		email = '';
		emailStatus = 'idle';
		agencyQuery = '';
		selectedSystemInfoId = '';
		agencyComboboxOpen = false;
	});

	$effect(() => {
		const value = email.trim();
		if (!createModalOpen || !value) {
			emailStatus = 'idle';
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
			emailStatus = 'invalid';
			return;
		}

		emailStatus = 'checking';
		const controller = new AbortController();
		const timeout = setTimeout(async () => {
			try {
				const response = await fetch(
					`/dashboard/users/email-availability?email=${encodeURIComponent(value)}`,
					{ signal: controller.signal }
				);
				const result = (await response.json()) as { available?: boolean };
				emailStatus = response.ok && result.available ? 'available' : 'duplicate';
			} catch (error) {
				if (!controller.signal.aborted) emailStatus = 'error';
			}
		}, 350);

		return () => {
			controller.abort();
			clearTimeout(timeout);
		};
	});
</script>

<section class="mx-auto w-full max-w-7xl p-6">
	<div class="mb-4">
		<h1 class="text-2xl font-semibold text-[var(--text)]">Authorized Users</h1>
		<!-- <p class="text-sm text-[var(--text-muted)]">
			Source: <code>auth_user</code>, <code>app_user_system_roles</code>, <code>tblAll_SystemInfo</code>
			({data.users.length} rows)
		</p> -->
	</div>

	{#if data.errorMessage}
		<div class="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
			{data.errorMessage}
		</div>
	{/if}

	{#if form?.message}
		<div class="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
			{form.message}
		</div>
	{/if}

	<div class="overflow-auto rounded-lg border border-[var(--border)] bg-white">
		<table class="w-full border-collapse text-left text-sm">
			<thead class="bg-[var(--surface-2)] text-[var(--text-muted)]">
				<tr>
					<th class="border-b border-[var(--border)] px-3 py-2">Name</th>
					<th class="border-b border-[var(--border)] px-3 py-2">Email</th>
					<th class="border-b border-[var(--border)] px-3 py-2">Status</th>
					<th class="border-b border-[var(--border)] px-3 py-2">Agency</th>
					<th class="border-b border-[var(--border)] px-3 py-2">Active</th>
					<th class="border-b border-[var(--border)] px-3 py-2">
						<span class="sr-only">User actions</span>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as user}
					<tr class="odd:bg-white even:bg-zinc-50">
						<td class="border-b border-[var(--border)] px-3 py-2">{user.displayName}</td>
						<td class="border-b border-[var(--border)] px-3 py-2">{user.email}</td>
						<td class="border-b border-[var(--border)] px-3 py-2">{formatRole(user.role)}</td>
						<td class="border-b border-[var(--border)] px-3 py-2">{user.agencyName}</td>
						<td class="border-b border-[var(--border)] px-3 py-2">
							{#if user.canToggleActive}
								<form method="POST" action="?/setActive" use:enhance>
									<input type="hidden" name="userId" value={user.id} />
									<input type="hidden" name="active" value={user.isActive ? '0' : '1'} />
									<button
										type="submit"
										role="switch"
										aria-checked={user.isActive}
										class="inline-flex h-6 w-11 items-center rounded-full border border-transparent transition-colors {user.isActive
											? 'bg-[var(--theme-color)]'
											: 'bg-zinc-300'}"
										title={user.isActive ? 'Deactivate user' : 'Activate user'}
									>
										<span
											class="h-5 w-5 rounded-full bg-white shadow transition-transform {user.isActive
												? 'translate-x-5'
												: 'translate-x-0.5'}"
										></span>
									</button>
								</form>
							{:else}
								<!-- Disabled because backend permission rules also reject this update. Keep the reason visible for maintainers and users. -->
								<button
									type="button"
									role="switch"
									aria-checked={user.isActive}
									disabled
									class="inline-flex h-6 w-11 cursor-not-allowed items-center rounded-full border border-zinc-300 bg-zinc-200 opacity-60"
									title={user.toggleDisabledReason ?? 'This user cannot be changed.'}
								>
									<span
										class="h-5 w-5 rounded-full bg-white shadow {user.isActive
											? 'translate-x-5'
											: 'translate-x-0.5'}"
									></span>
								</button>
							{/if}
						</td>
						<td class="border-b border-[var(--border)] px-3 py-2 text-right">
							<button
								type="button"
								disabled={!user.canDelete}
								title={user.canDelete ? `Delete ${user.displayName}` : user.deleteDisabledReason}
								class="inline-flex h-8 w-8 items-center justify-center rounded-sm text-[var(--text-muted)] transition hover:cursor-pointer hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--text-muted)]"
								onclick={() => openDeleteModal(user)}
							>
								<IconDotsVertical class="h-5 w-5" />
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

{#if createModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeCreateModal();
		}}
	>
		<div
			class="w-full max-w-lg rounded-lg border border-[var(--border)] bg-white p-5 shadow-xl dark:bg-zinc-900"
			role="dialog"
			aria-modal="true"
			aria-labelledby="create-user-title"
		>
			<div class="mb-4 flex items-center justify-between gap-3">
				<h2 id="create-user-title" class="text-xl font-semibold text-[var(--text)]">
					Create New User
				</h2>
				<button
					type="button"
					class="rounded-sm px-2 py-1 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
					onclick={closeCreateModal}
				>
					Close
				</button>
			</div>

			<form
				method="POST"
				action="?/createUser"
				class="flex flex-col gap-4"
				use:enhance={() => {
					creatingUser = true;
					return async ({ result, update }) => {
						creatingUser = false;
						await update();
						if (result.type === 'success') closeCreateModal();
					};
				}}
			>
				<div class="grid gap-4 sm:grid-cols-2">
					<label class="flex flex-col gap-1 text-sm font-medium text-[var(--text)]">
						First name
						<input
							name="firstName"
							type="text"
							required
							autocomplete="given-name"
							class="rounded-sm border border-[var(--border)] px-3 py-2 text-sm font-normal"
						/>
					</label>
					<label class="flex flex-col gap-1 text-sm font-medium text-[var(--text)]">
						Last name
						<input
							name="lastName"
							type="text"
							required
							autocomplete="family-name"
							class="rounded-sm border border-[var(--border)] px-3 py-2 text-sm font-normal"
						/>
					</label>
				</div>

				<label class="flex flex-col gap-1 text-sm font-medium text-[var(--text)]">
					Email address
					<input
						name="email"
						type="email"
						required
						bind:value={email}
						autocomplete="email"
						class="rounded-sm border border-[var(--border)] px-3 py-2 text-sm font-normal"
					/>
					{#if emailStatus === 'checking'}
						<span class="text-xs font-normal text-[var(--text-muted)]">Checking email...</span>
					{:else if emailStatus === 'available'}
						<span class="text-xs font-semibold text-emerald-700">✓ This email is available.</span>
					{:else if emailStatus === 'duplicate'}
						<span class="text-xs font-semibold text-red-700">✕ This email is already authorized.</span>
					{:else if emailStatus === 'invalid'}
						<span class="text-xs font-normal text-red-700">Enter a valid email address.</span>
					{:else if emailStatus === 'error'}
						<span class="text-xs font-normal text-red-700">Unable to check this email address.</span>
					{/if}
				</label>

				<label class="flex flex-col gap-1 text-sm font-medium text-[var(--text)]">
					Status
					<select
						name="role"
						required
						class="rounded-sm border border-[var(--border)] px-3 py-2 text-sm font-normal"
					>
						<option value="user">User</option>
						<option value="admin">Admin</option>
						<option value="super_admin">Super Admin</option>
					</select>
				</label>

				<div class="relative flex flex-col gap-1 text-sm font-medium text-[var(--text)]">
					<label for="new-user-agency">Transit agency</label>
					<input type="hidden" name="systemInfoId" value={selectedSystemInfoId} />
					<input
						id="new-user-agency"
						name="agencyName"
						type="text"
						required
						role="combobox"
						aria-expanded={agencyComboboxOpen}
						aria-controls="new-user-agency-options"
						autocomplete="off"
						bind:value={agencyQuery}
						placeholder="Type to search transit agencies..."
						class="rounded-sm border border-[var(--border)] px-3 py-2 text-sm font-normal"
						onfocus={() => (agencyComboboxOpen = true)}
						oninput={() => {
							selectedSystemInfoId = '';
							agencyComboboxOpen = true;
							syncSelectedAgency();
						}}
						onblur={() => {
							syncSelectedAgency();
							setTimeout(() => (agencyComboboxOpen = false), 120);
						}}
					/>
					{#if agencyComboboxOpen}
						<div
							id="new-user-agency-options"
							class="absolute top-full right-0 left-0 z-10 mt-1 max-h-56 overflow-auto rounded-md border border-[var(--border)] bg-white py-1 shadow-lg dark:bg-zinc-900"
							role="listbox"
						>
							{#if filteredSystemOptions.length}
								{#each filteredSystemOptions as option}
									<button
										type="button"
										class="block w-full px-3 py-2 text-left text-sm font-normal hover:bg-[var(--surface-2)]"
										onmousedown={(event) => {
											event.preventDefault();
											selectAgency(option);
										}}
									>
										{option.name}
									</button>
								{/each}
							{:else}
								<div class="px-3 py-2 text-sm font-normal text-[var(--text-muted)]">
									No agencies found.
								</div>
							{/if}
						</div>
					{/if}
					{#if agencyQuery && !selectedSystemInfoId}
						<span class="text-xs font-normal text-red-700">Select an agency from the list.</span>
					{/if}
				</div>

				<label class="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
					<input
						name="active"
						value="1"
						type="checkbox"
						checked
						class="h-4 w-4 rounded border-[var(--border)] text-[var(--theme-color)]"
					/>
					Active
				</label>

				<div class="mt-2 flex justify-end gap-2">
					<button
						type="button"
						class="h-9 rounded-sm border border-[var(--border)] bg-transparent px-3 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
						onclick={closeCreateModal}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="h-9 min-w-[112px] rounded-sm border border-[var(--theme-color)] bg-transparent px-3 text-sm font-semibold text-[var(--theme-color)] transition hover:bg-[var(--theme-color)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
						disabled={creatingUser || !emailIsUsable || !selectedSystemInfoId}
					>
						{creatingUser ? 'Creating...' : 'Create User'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if selectedDeleteUser}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeDeleteModal();
		}}
	>
		<div
			class="w-full max-w-lg overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-xl dark:bg-zinc-900"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-user-title"
		>
			<div class="p-5">
				<div class="mb-4 flex items-start justify-between gap-3">
					<div>
						<h2 id="delete-user-title" class="text-xl font-semibold text-[var(--text)]">
							Delete User
						</h2>
						<p class="mt-1 text-sm text-[var(--text-muted)]">
							Do you wish to delete this authorized user?
						</p>
					</div>
					<button
						type="button"
						class="rounded-sm px-2 py-1 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
						onclick={closeDeleteModal}
					>
						Close
					</button>
				</div>

				<div class="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
					<div class="grid gap-2 sm:grid-cols-[120px_1fr]">
						<div class="font-semibold text-[var(--text-muted)]">Name</div>
						<div>{selectedDeleteUser.displayName}</div>
						<div class="font-semibold text-[var(--text-muted)]">Email</div>
						<div>{selectedDeleteUser.email}</div>
						<div class="font-semibold text-[var(--text-muted)]">Status</div>
						<div>{formatRole(selectedDeleteUser.role)}</div>
						<div class="font-semibold text-[var(--text-muted)]">Agency</div>
						<div>{selectedDeleteUser.agencyName}</div>
					</div>
				</div>

				<p class="mt-4 text-sm text-red-700">
					This action cannot be undone. The user's app role assignment and auth user record will be
					deleted.
				</p>

				<div class="mt-5 flex justify-end gap-2">
					<button
						type="button"
						class="h-9 rounded-sm border border-[var(--border)] bg-transparent px-3 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
						onclick={closeDeleteModal}
					>
						Cancel
					</button>
					<button
						type="button"
						class="h-9 rounded-sm border border-red-600 bg-transparent px-3 text-sm font-semibold text-red-700 transition hover:bg-red-600 hover:text-white"
						onclick={() => (deleteConfirmOpen = true)}
					>
						Delete
					</button>
				</div>
			</div>

			<div
				class="grid border-t border-[var(--border)] bg-red-50 transition-[grid-template-rows] duration-300 ease-out {deleteConfirmOpen
					? 'grid-rows-[1fr]'
					: 'grid-rows-[0fr]'}"
			>
				<div class="overflow-hidden">
					<form
						method="POST"
						action="?/deleteUser"
						class="flex flex-col gap-3 p-5"
						use:enhance={() => {
							deletingUser = true;
							return async ({ result, update }) => {
								deletingUser = false;
								await update();
								if (result.type === 'success') closeDeleteModal();
							};
						}}
					>
						<input type="hidden" name="userId" value={selectedDeleteUser.id} />
						<label class="flex flex-col gap-1 text-sm font-semibold text-red-900">
							Type <span class="font-mono">Delete</span> to permanently delete this user.
							<input
								name="confirmation"
								type="text"
								bind:value={deleteConfirmation}
								autocomplete="off"
								class="rounded-sm border border-red-300 bg-white px-3 py-2 text-sm font-normal text-[var(--text)] outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200"
							/>
						</label>
						<div class="flex justify-end">
							<button
								type="submit"
								class="h-9 min-w-[112px] rounded-sm border border-red-700 bg-red-700 px-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={!canConfirmDelete || deletingUser}
							>
								{deletingUser ? 'Deleting...' : 'Confirm'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}
