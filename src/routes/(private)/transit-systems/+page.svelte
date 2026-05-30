<script lang="ts">
	import { TRANSIT_SYSTEMS } from '$lib/data/transitSystems';
</script>

<section class="mx-auto w-full max-w-5xl p-6">
	<h1 class="mb-4 text-2xl font-semibold text-[var(--text)]">Transit Systems</h1>
	<p class="mb-4 text-sm text-[var(--text-muted)]">{TRANSIT_SYSTEMS.length} systems</p>
	<div class="overflow-auto rounded-lg border border-[var(--border)] bg-white">
		<table class="w-full border-collapse text-left">
			<thead class="bg-[var(--surface-2)] text-sm text-[var(--text-muted)]">
				<tr>
					<th class="border-b border-[var(--border)] px-4 py-2">SystemID</th>
					<th class="border-b border-[var(--border)] px-4 py-2">SystemName</th>
				</tr>
			</thead>
			<tbody>
				{#each TRANSIT_SYSTEMS as system}
					<tr class="odd:bg-white even:bg-zinc-50">
						<td class="border-b border-[var(--border)] px-4 py-2 font-mono text-sm">{system.id}</td>
						<td class="border-b border-[var(--border)] px-4 py-2 text-sm">{system.name}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
