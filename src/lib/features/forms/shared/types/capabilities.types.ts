export type FormType = 'urban' | 'rural';
export type DaySlug = 'weekday' | 'saturday' | 'sunday';

export type UrbanModeId =
	| 'fixed-route'
	| 'dial-a-ride'
	| 'light-rail'
	| 'street-car'
	| 'vanpool'
	| 'microtransit';

export type RuralModeId = 'dr_do' | 'dr_pt' | 'mb_do' | 'mb_pt' | 'mt_do' | 'mt_pt';

export type DayService = {
	offered: boolean;
	start?: string;
	end?: string;
	peakRoutes?: number;
};

export type Capabilities = {
	ctpGranteeLegalName: string;
	contactFirstName: string;
	contactMiddleInitial?: string;
	contactLastName: string;
	email: string;
	phone: string;
	fax?: string;
	date: string;

	selectedModes: string[];

	days: Record<DaySlug, DayService>;

	contractor?: string;
	rural?: {
		serviceArea: {
			multiCounty: boolean;
			counties: string;
		};
		ptContractor: {
			name: string;
			contractStart: string;
			contractEnd: string;
		};
		outOfServiceArea: {
			enabled: boolean;
			destinations: string;
		};
		coordination: {
			enabled: boolean;
			systems: string;
		};
	};
};
