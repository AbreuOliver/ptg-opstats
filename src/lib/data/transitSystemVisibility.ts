export const TEST_TRANSIT_SYSTEM_ID = 999;
export const MAX_VISIBLE_TRANSIT_SYSTEM_ID = 300;

export function isVisibleTransitSystemId(systemId: number | null | undefined): boolean {
	if (systemId == null || !Number.isFinite(systemId)) return false;
	return systemId <= MAX_VISIBLE_TRANSIT_SYSTEM_ID || systemId === TEST_TRANSIT_SYSTEM_ID;
}
