import { describe, expect, it } from 'vitest';
import { mapAnnualStatisticsRow } from './repository';

describe('mapAnnualStatisticsRow', () => {
	it('reads the annual stats completion fields from tblAll_AnnualStats columns', () => {
		const draft = mapAnnualStatisticsRow({
			VolunteerDrivers320A: 3,
			PersonVehs320D: 4,
			IncidentalMiles321A: 5,
			IncidentalHrs321D: 6,
			IncidentialServiceNote322: 'Incidental note',
			CARESIncidentalMiles: 7,
			CARESIncidentalHrs: 8,
			CARESIncidentalServiceNote: 'CARES note',
			NonAmbTrip327: 9,
			MaintMethod328: 'agency-owned',
			MaintFacil_Owned329A: 10,
			MaintFacil_Lease329C: 11,
			NTD_Events330A: 12,
			NTD_Fatalities330C: 13,
			NTD_Injuries330E: 14,
			Admin_ChangesNotes338: 'Ops notes',
			OpReserve_339: 150000,
			SystemDoingWell340: 'Doing well',
			SystemImprovPerf341: 'Improve frequency',
			FT_Emp_DriverCount325A: 1,
			FT_Emp_DriverHrs325B: 2080,
			PT_Emp_DriverCount325C: 2,
			PT_Emp_DriverHrs325D: 1040,
			VocRehab_Trips331A: 1,
			DSSMedicaid_Trips331D: 0
		});

		expect(draft.operatingReserve).toBe(150000);
		expect(draft.operationsChangeNotes).toBe('Ops notes');
		expect(draft.systemDoingWell).toBe('Doing well');
		expect(draft.systemImprovPerf).toBe('Improve frequency');
		expect(draft.employees.driver.ftPayHours).toBe(2080);
		expect(draft.tripsServed.vocationalRehabilitation).toBe(true);
	});
});
