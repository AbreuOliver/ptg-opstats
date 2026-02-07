export function pruneByActiveModes<Row extends { id: string }>(rows: Row[], activeModeIds: Set<string>) {
	return rows.filter((row) => {
		// rows without a mode prefix stay (ex: "operating_days")
		if (!row.id.includes('__')) return true;

		// convention: "{modeId}__{suffix}"
		const modeId = row.id.split('__')[0];
		return activeModeIds.has(modeId);
	});
}
