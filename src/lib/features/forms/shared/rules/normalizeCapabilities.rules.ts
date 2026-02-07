import type { Capabilities } from '../types/capabilities.types';

export function normalizeCapabilities(next: Capabilities): Capabilities {
	const normalized: Capabilities = {
		...next,
		days: {
			...next.days,
			weekday: {
				...next.days.weekday,
				offered: true
			},
			saturday: { ...next.days.saturday },
			sunday: { ...next.days.sunday }
		}
	};

	if (!normalized.days.saturday.offered) {
		normalized.days.saturday = { offered: false, start: '', end: '', peakRoutes: 0 };
	}
	if (!normalized.days.sunday.offered) {
		normalized.days.sunday = { offered: false, start: '', end: '', peakRoutes: 0 };
	}

	return normalized;
}
