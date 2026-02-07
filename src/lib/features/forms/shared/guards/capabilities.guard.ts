import type { Capabilities, DayService } from '../types/capabilities.types';

function isString(value: unknown) {
	return typeof value === 'string';
}

function isOptionalString(value: unknown) {
	return value == null || typeof value === 'string';
}

function isDayService(input: unknown): input is DayService {
	if (!input || typeof input !== 'object') return false;
	const day = input as DayService;
	if (typeof day.offered !== 'boolean') return false;
	if (!isOptionalString(day.start)) return false;
	if (!isOptionalString(day.end)) return false;
	if (day.peakRoutes != null && typeof day.peakRoutes !== 'number') return false;
	return true;
}

function isRural(input: unknown) {
	if (!input || typeof input !== 'object') return false;
	const rural = input as Capabilities['rural'];
	if (!rural?.serviceArea || typeof rural.serviceArea !== 'object') return false;
	if (typeof rural.serviceArea.multiCounty !== 'boolean') return false;
	if (!isString(rural.serviceArea.counties)) return false;
	if (!rural.ptContractor || typeof rural.ptContractor !== 'object') return false;
	if (!isString(rural.ptContractor.name)) return false;
	if (!isString(rural.ptContractor.contractStart)) return false;
	if (!isString(rural.ptContractor.contractEnd)) return false;
	if (!rural.outOfServiceArea || typeof rural.outOfServiceArea !== 'object') return false;
	if (typeof rural.outOfServiceArea.enabled !== 'boolean') return false;
	if (!isString(rural.outOfServiceArea.destinations)) return false;
	if (!rural.coordination || typeof rural.coordination !== 'object') return false;
	if (typeof rural.coordination.enabled !== 'boolean') return false;
	if (!isString(rural.coordination.systems)) return false;
	return true;
}

export function assertCapabilities(input: unknown): Capabilities {
	if (!input || typeof input !== 'object') {
		throw new Error('Capabilities must be an object.');
	}
	const caps = input as Capabilities;

	if (!isString(caps.ctpGranteeLegalName)) throw new Error('ctpGranteeLegalName is required.');
	if (!isString(caps.contactFirstName)) throw new Error('contactFirstName is required.');
	if (!isOptionalString(caps.contactMiddleInitial)) throw new Error('contactMiddleInitial is invalid.');
	if (!isString(caps.contactLastName)) throw new Error('contactLastName is required.');
	if (!isString(caps.email)) throw new Error('email is required.');
	if (!isString(caps.phone)) throw new Error('phone is required.');
	if (!isOptionalString(caps.fax)) throw new Error('fax is invalid.');
	if (!isString(caps.date)) throw new Error('date is required.');
	if (!Array.isArray(caps.selectedModes)) throw new Error('selectedModes must be an array.');
	if (!caps.selectedModes.every(isString)) throw new Error('selectedModes must be strings.');
	if (!caps.days || typeof caps.days !== 'object') throw new Error('days is required.');

	const days = caps.days as Record<string, unknown>;
	for (const key of ['weekday', 'saturday', 'sunday']) {
		if (!isDayService(days[key])) throw new Error(`days.${key} is invalid.`);
	}

	if (!isOptionalString(caps.contractor)) throw new Error('contractor is invalid.');
	if (caps.rural != null && !isRural(caps.rural)) throw new Error('rural is invalid.');

	return caps;
}
