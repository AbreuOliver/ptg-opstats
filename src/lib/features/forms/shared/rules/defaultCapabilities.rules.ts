import type { Capabilities, FormType } from '../types/capabilities.types';

export function defaultCapabilities(type: FormType): Capabilities {
	const base: Capabilities = {
		ctpGranteeLegalName: '',
		contactFirstName: '',
		contactMiddleInitial: '',
		contactLastName: '',
		email: '',
		phone: '',
		fax: '',
		date: '',
		selectedModes: [],
		days: {
			weekday: { offered: true, start: '', end: '', peakRoutes: 0 },
			saturday: { offered: false, start: '', end: '', peakRoutes: 0 },
			sunday: { offered: false, start: '', end: '', peakRoutes: 0 }
		},
		contractor: ''
	};

	if (type === 'urban') return base;

	return {
		...base,
		rural: {
			serviceArea: {
				multiCounty: false,
				counties: ''
			},
			ptContractor: {
				name: '',
				contractStart: '',
				contractEnd: ''
			},
			outOfServiceArea: {
				enabled: false,
				destinations: ''
			},
			coordination: {
				enabled: false,
				systems: ''
			}
		}
	};
}
