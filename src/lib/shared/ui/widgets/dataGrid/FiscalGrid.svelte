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
	<table class="min-w-full border-collapse text-[15px]">
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
						<td
							class="border border-[#c4c4c4] px-2 py-1 text-right dark:border-[#686868] {isEditableCell(
								model,
								rowIndex,
								columnIndex
							)
								? 'bg-[color-mix(in_srgb,var(--theme-color)_12%,white)] dark:bg-[color-mix(in_srgb,var(--theme-color)_22%,black)]'
								: 'bg-white dark:bg-zinc-950'}"
						>
							{#if isEditableCell(model, rowIndex, columnIndex)}
								<input
									class="w-24 rounded border border-[var(--border)] bg-[color-mix(in_srgb,var(--theme-color)_12%,white)] px-2 py-1 text-right text-[15px] text-black/80 dark:bg-[color-mix(in_srgb,var(--theme-color)_22%,black)] dark:text-white"
									type="number"
									value={values[rowIndex]?.[columnIndex] ?? ''}
									oninput={(event) => handleInput(rowIndex, columnIndex, event)}
								/>
							{:else}
								<span class="text-[15px] font-semibold text-black/80 dark:text-white"
									>{values[rowIndex]?.[columnIndex] ?? ''}</span
								>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
