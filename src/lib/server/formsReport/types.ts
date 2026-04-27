import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
import type { LocalFormSlices } from '$lib/features/forms/persistence/formsReport.types';

export type FormsReportKey = {
	agency: string;
	type: FormType;
	year: number;
};

export type PersistedFormsReport = FormsReportKey & {
	slices: LocalFormSlices;
	updatedAt: string;
	updatedBy: string | null;
};

export interface FormsReportRepository {
	get(key: FormsReportKey): Promise<PersistedFormsReport | null>;
	upsert(input: FormsReportKey & { slices: LocalFormSlices; updatedBy: string | null }): Promise<PersistedFormsReport>;
}
