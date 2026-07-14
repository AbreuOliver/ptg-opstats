<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import IconDotsVertical from '@tabler/icons-svelte/icons/dots-vertical';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: { message?: string; success?: boolean } | null } =
		$props();
	let creatingUser = $state(false);
	let invitingUsers = $state(false);
	let email = $state('');
	let emailStatus = $state<'idle' | 'invalid' | 'checking' | 'available' | 'duplicate' | 'error'>(
		'idle'
	);
	let agencyQuery = $state('');
	let selectedSystemInfoId = $state('');
	let selectedRole = $state<'user' | 'admin' | 'super_admin'>('user');
	let agencyComboboxOpen = $state(false);
	let selectedDeleteUser = $state<PageData['users'][number] | null>(null);
	let deleteConfirmOpen = $state(false);
	let deleteConfirmation = $state('');
	let deletingUser = $state(false);
	let selectedUserIds = $state<number[]>([]);
	type UserFilter = 'all' | 'super_admin' | 'admin' | 'user';
	let activeUserFilter = $state<UserFilter>('all');
	const createModalOpen = $derived(page.url.searchParams.get('createUser') === '1');
	const currentUserEmail = $derived(data.currentUserEmail?.trim().toLowerCase() ?? '');
	const emailIsUsable = $derived(emailStatus === 'available');
	const canConfirmDelete = $derived(deleteConfirmation.trim().toLowerCase() === 'delete');
	const showAgencyPicker = $derived(selectedRole !== 'super_admin');
	const selectedCreateSystemInfoId = $derived(
		showAgencyPicker ? selectedSystemInfoId : String(data.defaultSystemInfoId ?? '')
	);
	const userFilterCounts = $derived({
		all: data.users.length,
		super_admin: data.users.filter((user) => user.role === 'super_admin').length,
		admin: data.users.filter((user) => user.role === 'admin').length,
		user: data.users.filter((user) => user.role === 'user').length
	});
	const userFilters = $derived([
		{ id: 'all' as const, label: 'All Users', count: userFilterCounts.all },
		...(data.canViewSuperAdmins
			? [{ id: 'super_admin' as const, label: 'Super Admins', count: userFilterCounts.super_admin }]
			: []),
		{ id: 'admin' as const, label: 'Admins', count: userFilterCounts.admin },
		{ id: 'user' as const, label: 'Users', count: userFilterCounts.user }
	]);
	const filteredUsers = $derived(
		activeUserFilter === 'all'
			? data.users
			: data.users.filter((user) => user.role === activeUserFilter)
	);
	const selectableFilteredUsers = $derived(
		filteredUsers.filter((user) => user.email.trim().toLowerCase() !== currentUserEmail)
	);
	const allSelectableFilteredUsersSelected = $derived(
		selectableFilteredUsers.length > 0 &&
			selectableFilteredUsers.every((user) => selectedUserIds.includes(user.id))
	);
	const someSelectableFilteredUsersSelected = $derived(
		selectableFilteredUsers.some((user) => selectedUserIds.includes(user.id))
	);
	const selectedInviteCount = $derived(selectedUserIds.length);
	const modalBackdropClass =
		'fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/35 p-4 backdrop-blur-sm';
	const modalPanelClass =
		'relative w-full max-w-lg rounded-xl border-2 border-neutral-600/20 bg-white/70 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/80';
	const modalInputClass =
		'modal-theme-value min-h-11 rounded-t-sm bg-neutral-200 px-3 py-2 text-sm font-normal outline-0 placeholder:text-neutral-500 focus:outline-2 focus:-outline-offset-2 focus:outline-[var(--theme-color)] dark:bg-neutral-800 dark:placeholder:text-neutral-400';
	const neutralButtonClass =
		'group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-xl bg-neutral-200 px-5 font-mono text-sm font-medium tracking-tighter text-black transition disabled:cursor-not-allowed disabled:opacity-50';
	const positiveButtonClass =
		'group relative inline-flex h-11 min-w-[128px] items-center justify-center overflow-hidden rounded-xl bg-neutral-900 px-5 font-mono text-sm font-medium tracking-tighter text-white transition disabled:cursor-not-allowed disabled:opacity-50';
	const negativeButtonClass =
		'group relative inline-flex h-11 min-w-[112px] items-center justify-center overflow-hidden rounded-xl bg-neutral-900 px-5 font-mono text-sm font-medium tracking-tighter text-white transition disabled:cursor-not-allowed disabled:opacity-50';
	const userTableHeaderClass = 'border-b border-[var(--border)] px-3 py-2';
	const userTableCellClass = 'border-b border-[var(--border)] px-3 py-2 align-middle';
	const userTableTruncatedCellClass = `${userTableCellClass} truncate`;
	const filteredSystemOptions = $derived.by(() => {
		const query = agencyQuery.trim().toLowerCase();
		const options = query
			? data.systemOptions.filter((option) => option.name.toLowerCase().includes(query))
			: data.systemOptions;
		return options.slice(0, 12);
	});

	function uniqueUserIds(ids: number[]): number[] {
		return [...new Set(ids)];
	}

	function formatRole(role: string): string {
		return role
			.split('_')
			.map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
			.join(' ');
	}

	function toggleUserSelection(userId: number, checked: boolean) {
		selectedUserIds = checked
			? uniqueUserIds([...selectedUserIds, userId])
			: selectedUserIds.filter((selectedUserId) => selectedUserId !== userId);
	}

	function setVisibleUserSelection(checked: boolean) {
		const visibleIds = selectableFilteredUsers.map((user) => user.id);
		if (checked) {
			selectedUserIds = uniqueUserIds([...selectedUserIds, ...visibleIds]);
			return;
		}
		const visibleIdSet = new Set(visibleIds);
		selectedUserIds = selectedUserIds.filter((userId) => !visibleIdSet.has(userId));
	}

	function closeCreateModal() {
		const url = new URL(page.url);
		url.searchParams.delete('createUser');
		goto(`${url.pathname}${url.search}${url.hash}`, { replaceState: true, noScroll: true });
	}

	function handleRoleChange(nextRole: 'user' | 'admin' | 'super_admin') {
		selectedRole = nextRole;
		if (nextRole === 'super_admin') {
			agencyQuery = '';
			selectedSystemInfoId = '';
			agencyComboboxOpen = false;
			return;
		}
		if (!agencyQuery.trim()) {
			selectedSystemInfoId = '';
		}
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
		selectedRole = 'user';
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
					`/users/email-availability?email=${encodeURIComponent(value)}`,
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
	<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-semibold text-[var(--text)]">Authorized Users</h1>
		<div
			class="flex {data.canViewSuperAdmins
				? 'min-w-[30rem]'
				: 'min-w-[22rem]'} justify-between overflow-hidden rounded-lg bg-[var(--surface-2)] p-1 shadow-sm"
			aria-label="Filter authorized users"
		>
			{#each userFilters as filter}
				<button
					type="button"
					aria-pressed={activeUserFilter === filter.id}
					class="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition {activeUserFilter ===
					filter.id
						? 'bg-white font-semibold text-[var(--text)] shadow-sm'
						: 'font-medium text-[var(--text-muted)] hover:bg-white/60 hover:text-[var(--text)]'}"
					onclick={() => {
						activeUserFilter = filter.id;
						selectedUserIds = [];
					}}
				>
					<span>{filter.label}</span>
					<span class="rounded-full bg-black/5 px-1.5 py-0.5 text-xs">{filter.count}</span>
				</button>
			{/each}
		</div>
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
		<div
			class="mb-4 rounded-md border p-3 text-sm {form.success
				? 'border-emerald-300 bg-emerald-50 text-emerald-700'
				: 'border-red-300 bg-red-50 text-red-700'}"
		>
			{form.message}
		</div>
	{/if}

	{#if selectedInviteCount > 0}
		<div
			class="mb-4 flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="text-sm text-[var(--text-muted)]">
				{selectedInviteCount} user{selectedInviteCount === 1 ? '' : 's'} selected
			</div>
			<form
				method="POST"
				action="?/sendInvitations"
				class="flex justify-end"
				use:enhance={() => {
					invitingUsers = true;
					return async ({ result, update }) => {
						invitingUsers = false;
						await update();
						if (result.type === 'success') {
							selectedUserIds = [];
						}
					};
				}}
			>
				{#each selectedUserIds as userId}
					<input type="hidden" name="userId" value={userId} />
				{/each}
				<button
					type="submit"
					disabled={invitingUsers || selectedInviteCount === 0}
					class="inline-flex h-10 items-center justify-center rounded-sm border border-[var(--theme-color)] bg-[var(--theme-color)] px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{invitingUsers
						? 'Sending invitations...'
						: `Send invitation email${selectedInviteCount === 1 ? '' : 's'}`}
				</button>
			</form>
		</div>
	{/if}

	<div class="overflow-auto rounded-lg border border-[var(--border)] bg-white">
		<table class="w-full table-fixed border-collapse text-left text-sm">
			<colgroup>
				<col class="w-12" />
				<col class="w-[18%]" />
				<col class="w-[24%]" />
				<col class="w-[14%]" />
				<col class="w-[34%]" />
				<col class="w-[8rem]" />
				<col class="w-14" />
			</colgroup>
			<thead class="bg-[var(--surface-2)] text-[var(--text-muted)]">
				<tr>
					<th class={`${userTableHeaderClass} text-center`}>
						<input
							type="checkbox"
							checked={allSelectableFilteredUsersSelected}
							indeterminate={!allSelectableFilteredUsersSelected && someSelectableFilteredUsersSelected}
							disabled={selectableFilteredUsers.length === 0}
							aria-label="Select all visible users"
							class="h-4 w-4 rounded border-[var(--border)] text-[var(--theme-color)] disabled:cursor-not-allowed disabled:opacity-40"
							onchange={(event) =>
								setVisibleUserSelection((event.currentTarget as HTMLInputElement).checked)}
						/>
					</th>
					<th class={userTableHeaderClass}>Name</th>
					<th class={userTableHeaderClass}>Email</th>
					<th class={userTableHeaderClass}>Status</th>
					<th class={userTableHeaderClass}>Agency</th>
					<th class={userTableHeaderClass}>Active</th>
					<th class={userTableHeaderClass}>
						<span class="sr-only">User actions</span>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredUsers as user}
					{@const roleLabel = formatRole(user.role)}
					<tr class="odd:bg-white even:bg-zinc-50">
						<td class={`${userTableCellClass} text-center`}>
							{#if user.email.trim().toLowerCase() === currentUserEmail}
								<input
									type="checkbox"
									disabled
									title="You cannot send an invitation to your own account."
									class="h-4 w-4 rounded border-[var(--border)] text-[var(--theme-color)] opacity-40"
								/>
							{:else}
								<input
									type="checkbox"
									checked={selectedUserIds.includes(user.id)}
									aria-label={`Select ${user.displayName}`}
									class="h-4 w-4 rounded border-[var(--border)] text-[var(--theme-color)]"
									onchange={(event) =>
										toggleUserSelection(
											user.id,
											(event.currentTarget as HTMLInputElement).checked
										)}
								/>
							{/if}
						</td>
						<td class={userTableTruncatedCellClass} title={user.displayName}>{user.displayName}</td>
						<td class={userTableTruncatedCellClass} title={user.email}>{user.email}</td>
						<td class={userTableTruncatedCellClass} title={roleLabel}>{roleLabel}</td>
						<td class={userTableTruncatedCellClass} title={user.agencyName}>{user.agencyName}</td>
						<td class={userTableCellClass}>
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
						<td class={`${userTableCellClass} text-right`}>
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
		class={modalBackdropClass}
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeCreateModal();
		}}
	>
		<div
			class={modalPanelClass}
			role="dialog"
			aria-modal="true"
			aria-labelledby="create-user-title"
		>
			<div
				class="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/85 via-white/65 to-[color-mix(in_srgb,var(--theme-color)_14%,white)] dark:from-neutral-900/90 dark:via-neutral-900/75 dark:to-[color-mix(in_srgb,var(--theme-color)_22%,#171717)]"
			></div>

			<form
				method="POST"
				action="?/createUser"
				class="relative z-10 flex flex-col gap-4 p-6"
				use:enhance={() => {
					creatingUser = true;
					return async ({ result, update }) => {
						creatingUser = false;
						await update();
						if (result.type === 'success') closeCreateModal();
					};
				}}
			>
				<div class="mb-2">
					<div>
						<h2
							id="create-user-title"
							class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white"
						>
							Create New User
						</h2>
						<p class="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
							Authorize a new user and assign their agency access.
						</p>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<label
						class="flex flex-col gap-1 text-sm font-medium text-neutral-900 dark:text-neutral-100"
					>
						First name
						<input
							name="firstName"
							type="text"
							required
							autocomplete="given-name"
							class={modalInputClass}
						/>
					</label>
					<label
						class="flex flex-col gap-1 text-sm font-medium text-neutral-900 dark:text-neutral-100"
					>
						Last name
						<input
							name="lastName"
							type="text"
							required
							autocomplete="family-name"
							class={modalInputClass}
						/>
					</label>
				</div>

				<label
					class="flex flex-col gap-1 text-sm font-medium text-neutral-900 dark:text-neutral-100"
				>
					Email address
					<input
						name="email"
						type="email"
						required
						bind:value={email}
						autocomplete="email"
						class={modalInputClass}
					/>
					{#if emailStatus === 'checking'}
						<span class="text-xs font-normal text-neutral-600 dark:text-neutral-300"
							>Checking email...</span
						>
					{:else if emailStatus === 'available'}
						<span class="text-xs font-semibold text-emerald-700">✓ This email is available.</span>
					{:else if emailStatus === 'duplicate'}
						<span class="text-xs font-semibold text-red-700"
							>✕ This email is already authorized.</span
						>
					{:else if emailStatus === 'invalid'}
						<span class="text-xs font-normal text-red-700">Enter a valid email address.</span>
					{:else if emailStatus === 'error'}
						<span class="text-xs font-normal text-red-700">Unable to check this email address.</span
						>
					{/if}
				</label>

				<label
					class="flex flex-col gap-1 text-sm font-medium text-neutral-900 dark:text-neutral-100"
				>
					Status
					<select
						name="role"
						required
						class={modalInputClass}
						bind:value={selectedRole}
						onchange={(event) =>
							handleRoleChange((event.currentTarget as HTMLSelectElement).value as
								| 'user'
								| 'admin'
								| 'super_admin')}
					>
						<option value="user">User</option>
						<option value="admin">Admin</option>
						{#if data.canViewSuperAdmins}
							<option value="super_admin">Super Admin</option>
						{/if}
					</select>
				</label>

				{#if showAgencyPicker}
					<input type="hidden" name="systemInfoId" value={selectedCreateSystemInfoId} />
				{/if}

				{#if showAgencyPicker}
					<div
						class="relative flex flex-col gap-1 text-sm font-medium text-neutral-900 dark:text-neutral-100"
					>
						<label for="new-user-agency">Transit agency</label>
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
							class={modalInputClass}
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
								class="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-auto rounded-xl border-2 border-neutral-600/20 bg-white/95 py-1 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/95"
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
				{:else if selectedRole !== 'super_admin' && data.defaultAgencyName}
					<p class="rounded-lg bg-white/60 px-3 py-2 text-sm text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
						New users will be assigned to <span class="font-semibold">{data.defaultAgencyName}</span>.
					</p>
				{:else if selectedRole === 'super_admin'}
					<p class="rounded-lg bg-white/60 px-3 py-2 text-sm text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
						Super Admin users have statewide access and do not need an agency assignment.
					</p>
				{/if}

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
					<button type="button" class={neutralButtonClass} onclick={closeCreateModal}>
						<span
							class="absolute h-0 w-0 rounded-full bg-gradient-to-r from-neutral-300 to-neutral-500 transition-all duration-500 ease-out group-hover:h-[120%] group-hover:w-[120%]"
						></span>
						<span
							class="absolute inset-0 -mt-1 h-full w-full rounded-xl bg-gradient-to-b from-transparent via-transparent to-neutral-400 opacity-30"
						></span>
						<span class="relative z-10">Cancel</span>
					</button>
					<button
						type="submit"
						class={positiveButtonClass}
						disabled={creatingUser || !emailIsUsable || !selectedCreateSystemInfoId}
					>
						<span
							class="absolute h-0 w-0 rounded-full bg-gradient-to-r from-[var(--theme-color)] to-[var(--theme-color)] transition-all duration-500 ease-out group-hover:h-[120%] group-hover:w-[120%]"
						></span>
						<span
							class="absolute inset-0 -mt-1 h-full w-full rounded-xl bg-gradient-to-b from-transparent via-transparent to-[var(--theme-color)] opacity-30"
						></span>
						<span class="relative z-10">{creatingUser ? 'Creating...' : 'Create User'}</span>
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if selectedDeleteUser}
	<div
		class={modalBackdropClass}
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeDeleteModal();
		}}
	>
		<div
			class={modalPanelClass}
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-user-title"
		>
			<div
				class="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/85 via-white/65 to-red-50/80 dark:from-neutral-900/90 dark:via-neutral-900/75 dark:to-red-950/30"
			></div>
			<div class="relative z-10 p-6">
				<div class="mb-4">
					<div>
						<h2
							id="delete-user-title"
							class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white"
						>
							Delete User
						</h2>
						<p class="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
							Do you wish to delete this authorized user?
						</p>
					</div>
				</div>

				<div
					class="rounded-xl border-2 border-neutral-600/20 bg-white/65 p-4 text-sm shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10"
				>
					<div class="grid gap-2 sm:grid-cols-[120px_1fr]">
						<div class="font-semibold text-neutral-600 dark:text-neutral-300">Name</div>
						<div>{selectedDeleteUser.displayName}</div>
						<div class="font-semibold text-neutral-600 dark:text-neutral-300">Email</div>
						<div>{selectedDeleteUser.email}</div>
						<div class="font-semibold text-neutral-600 dark:text-neutral-300">Status</div>
						<div>{formatRole(selectedDeleteUser.role)}</div>
						<div class="font-semibold text-neutral-600 dark:text-neutral-300">Agency</div>
						<div>{selectedDeleteUser.agencyName}</div>
					</div>
				</div>

				<p class="mt-4 text-sm font-medium text-red-700 dark:text-red-300">
					This action cannot be undone. The user's app role assignment and auth user record will be
					deleted.
				</p>

				<div class="mt-5 flex justify-end gap-2">
					<button type="button" class={neutralButtonClass} onclick={closeDeleteModal}>
						<span
							class="absolute h-0 w-0 rounded-full bg-gradient-to-r from-neutral-300 to-neutral-500 transition-all duration-500 ease-out group-hover:h-[120%] group-hover:w-[120%]"
						></span>
						<span
							class="absolute inset-0 -mt-1 h-full w-full rounded-xl bg-gradient-to-b from-transparent via-transparent to-neutral-400 opacity-30"
						></span>
						<span class="relative z-10">Cancel</span>
					</button>
					<button
						type="button"
						class={negativeButtonClass}
						onclick={() => (deleteConfirmOpen = true)}
					>
						<span
							class="absolute h-0 w-0 rounded-full bg-gradient-to-r from-red-500 to-red-800 transition-all duration-500 ease-out group-hover:h-[120%] group-hover:w-[120%]"
						></span>
						<span
							class="absolute inset-0 -mt-1 h-full w-full rounded-xl bg-gradient-to-b from-transparent via-transparent to-red-700 opacity-35"
						></span>
						<span class="relative z-10">Delete</span>
					</button>
				</div>
			</div>

			<div
				class="relative z-10 grid border-t-2 border-red-200/70 bg-red-50/80 backdrop-blur-sm transition-[grid-template-rows] duration-300 ease-out dark:border-red-900/60 dark:bg-red-950/35 {deleteConfirmOpen
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
								class="modal-theme-value min-h-11 rounded-xl bg-white/90 px-3 py-2 text-sm font-normal outline-1 -outline-offset-1 outline-red-300 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 dark:bg-white/10 dark:outline-red-800"
							/>
						</label>
						<div class="flex justify-end">
							<button
								type="submit"
								class={negativeButtonClass}
								disabled={!canConfirmDelete || deletingUser}
							>
								<span
									class="absolute h-0 w-0 rounded-full bg-gradient-to-r from-red-500 to-red-800 transition-all duration-500 ease-out group-hover:h-[120%] group-hover:w-[120%]"
								></span>
								<span
									class="absolute inset-0 -mt-1 h-full w-full rounded-xl bg-gradient-to-b from-transparent via-transparent to-red-700 opacity-35"
								></span>
								<span class="relative z-10">{deletingUser ? 'Deleting...' : 'Confirm'}</span>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-theme-value {
		color: var(--theme-color);
		-webkit-text-fill-color: var(--theme-color);
	}
</style>
