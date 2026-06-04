<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: { message?: string } | null } = $props();
	let createModalOpen = $state(false);
	let creatingUser = $state(false);

	function formatRole(role: string): string {
		return role
			.split('_')
			.map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
			.join(' ');
	}
</script>

<section class="mx-auto w-full max-w-7xl p-6">
	<div class="mb-4 flex items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-[var(--text)]">Authorized Users</h1>
			<!-- <p class="text-sm text-[var(--text-muted)]">
				Source: <code>auth_user</code>, <code>app_user_system_roles</code>, <code>tblAll_SystemInfo</code>
				({data.users.length} rows)
			</p> -->
		</div>
		{#if data.canCreateUsers}
			<button
				type="button"
				class="h-9 min-w-[112px] rounded-sm border border-[var(--theme-color)] bg-transparent px-3 text-sm font-semibold text-[var(--theme-color)] transition hover:bg-[var(--theme-color)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
				onclick={() => (createModalOpen = true)}
			>
				Create User
			</button>
		{/if}
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
			if (event.target === event.currentTarget) createModalOpen = false;
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
					onclick={() => (createModalOpen = false)}
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
						if (result.type === 'success') createModalOpen = false;
						await update();
					};
				}}
			>
				<div class="grid gap-4 sm:grid-cols-2">
					<label class="flex flex-col gap-1 text-sm font-medium text-[var(--text)]">
						First name
						<input
							name="firstName"
							type="text"
							autocomplete="given-name"
							class="rounded-sm border border-[var(--border)] px-3 py-2 text-sm font-normal"
						/>
					</label>
					<label class="flex flex-col gap-1 text-sm font-medium text-[var(--text)]">
						Last name
						<input
							name="lastName"
							type="text"
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
						autocomplete="email"
						class="rounded-sm border border-[var(--border)] px-3 py-2 text-sm font-normal"
					/>
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
						onclick={() => (createModalOpen = false)}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="h-9 min-w-[112px] rounded-sm border border-[var(--theme-color)] bg-transparent px-3 text-sm font-semibold text-[var(--theme-color)] transition hover:bg-[var(--theme-color)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
						disabled={creatingUser}
					>
						{creatingUser ? 'Creating...' : 'Create User'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
