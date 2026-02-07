export function pruneByActiveModes<Row extends { id: string }>(rows: Row[], activeModeIds: Set<string>) {
	return rows.filter((row) => {
		if (!row.id.includes('__')) return true;

		const modeId = row.id.split('__')[0];
		return activeModeIds.has(modeId);
	});
}
