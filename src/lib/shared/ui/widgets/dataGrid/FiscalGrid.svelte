<script lang="ts">
	import type { GridModel, GridValues } from './grid.types';
	import { getDerived, isEditableCell } from './grid.logic';

	let {
		model,
		values,
		onEdit
	}: {
		model: GridModel;
		values: GridValues;
		onEdit?: (event: CustomEvent<{ r: number; c: number; value: number | null }>) => void;
	} = $props();

	const derived = $derived(getDerived(model));

	function parseCellValue(input: string): number | null {
		const trimmed = input.trim();
		if (trimmed === '') return null;
		const value = Number(trimmed);
		return Number.isFinite(value) ? value : null;
	}

	function handleInput(rowIndex: number, columnIndex: number, event: Event) {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) return;

		onEdit?.(
			new CustomEvent('edit', {
				detail: {
					r: rowIndex,
					c: columnIndex,
					value: parseCellValue(target.value)
				}
			})
		);
	}
</script>

<div class="overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
	<table class="min-w-full border-collapse text-sm">
		<thead>
			<tr class="border-b border-[var(--border)] bg-[var(--surface-2)]">
				<th class="sticky left-0 bg-[var(--surface-2)] px-3 py-2 text-left font-semibold">Metric</th>
				{#each model.config.months as month}
					<th class="px-3 py-2 text-right font-semibold">{month}</th>
				{/each}
				{#if model.config.showQuarters}
					<th class="px-3 py-2 text-right font-semibold">Q1</th>
					<th class="px-3 py-2 text-right font-semibold">Q2</th>
					<th class="px-3 py-2 text-right font-semibold">Q3</th>
					<th class="px-3 py-2 text-right font-semibold">Q4</th>
					<th class="px-3 py-2 text-right font-semibold">YTD</th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#each model.rows as row, rowIndex}
				<tr class:border-t={row.type === 'section'} class="border-b border-[var(--border)]">
					<th
						class="sticky left-0 bg-[var(--surface-1)] px-3 py-2 text-left"
						class:font-semibold={row.type === 'section' || row.type === 'sum'}
						style:padding-left={`${0.75 + (row.indent ?? 0) * 1.25}rem`}
					>
						{row.label}
					</th>
					{#each Array.from({ length: derived.totalCols }) as _, columnIndex}
						<td class="px-2 py-1 text-right">
							{#if isEditableCell(model, rowIndex, columnIndex)}
								<input
									class="w-24 rounded border border-[var(--border)] bg-[var(--surface-1)] px-2 py-1 text-right"
									type="number"
									value={values[rowIndex]?.[columnIndex] ?? ''}
									oninput={(event) => handleInput(rowIndex, columnIndex, event)}
								/>
							{:else}
								<span>{values[rowIndex]?.[columnIndex] ?? ''}</span>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
