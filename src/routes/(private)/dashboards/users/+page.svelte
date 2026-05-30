<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="mx-auto w-full max-w-7xl p-6">
	<div class="mb-4">
		<h1 class="text-2xl font-semibold text-[var(--text)]">Authorized Users</h1>
		<p class="text-sm text-[var(--text-muted)]">Source: <code>auth_user</code> ({data.users.length} rows)</p>
	</div>

	{#if data.errorMessage}
		<div class="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
			{data.errorMessage}
		</div>
	{/if}

	<div class="overflow-auto rounded-lg border border-[var(--border)] bg-white">
		<table class="w-full border-collapse text-left text-sm">
			<thead class="bg-[var(--surface-2)] text-[var(--text-muted)]">
				<tr>
					<th class="border-b border-[var(--border)] px-3 py-2">ID</th>
					<th class="border-b border-[var(--border)] px-3 py-2">Username</th>
					<th class="border-b border-[var(--border)] px-3 py-2">Email</th>
					<th class="border-b border-[var(--border)] px-3 py-2">First</th>
					<th class="border-b border-[var(--border)] px-3 py-2">Last</th>
					<th class="border-b border-[var(--border)] px-3 py-2">Active</th>
					<th class="border-b border-[var(--border)] px-3 py-2">Staff</th>
					<th class="border-b border-[var(--border)] px-3 py-2">Superuser</th>
					<th class="border-b border-[var(--border)] px-3 py-2">Last Login</th>
					<th class="border-b border-[var(--border)] px-3 py-2">Date Joined</th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as user}
					<tr class="odd:bg-white even:bg-zinc-50">
						<td class="border-b border-[var(--border)] px-3 py-2 font-mono">{user.id}</td>
						<td class="border-b border-[var(--border)] px-3 py-2">{user.username}</td>
						<td class="border-b border-[var(--border)] px-3 py-2">{user.email}</td>
						<td class="border-b border-[var(--border)] px-3 py-2">{user.firstName}</td>
						<td class="border-b border-[var(--border)] px-3 py-2">{user.lastName}</td>
						<td class="border-b border-[var(--border)] px-3 py-2">{user.isActive ? 'Yes' : 'No'}</td>
						<td class="border-b border-[var(--border)] px-3 py-2">{user.isStaff ? 'Yes' : 'No'}</td>
						<td class="border-b border-[var(--border)] px-3 py-2">{user.isSuperuser ? 'Yes' : 'No'}</td>
						<td class="border-b border-[var(--border)] px-3 py-2">{user.lastLogin ?? '-'}</td>
						<td class="border-b border-[var(--border)] px-3 py-2">{user.dateJoined ?? '-'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
