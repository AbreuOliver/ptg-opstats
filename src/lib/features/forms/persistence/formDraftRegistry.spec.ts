import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

import { loadResolvedFormDraftSnapshot } from './formDraftRegistry';

describe('loadResolvedFormDraftSnapshot', () => {
	beforeEach(() => {
		const storage = new Map<string, string>();
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => storage.get(key) ?? null,
			setItem: (key: string, value: string) => {
				storage.set(key, value);
			},
			removeItem: (key: string) => {
				storage.delete(key);
			}
		});
	});

	it('prefers meaningful remote data over an empty local draft', () => {
		(localStorage as Storage).setItem('completion:rural:2025:rural', JSON.stringify({}));

		const remote = { surplusTransitAccount: 125000, surplusExplain: 'Operating reserve carried forward' };
		const draft = loadResolvedFormDraftSnapshot(
			'completion:rural:2025:rural',
			remote,
			(value) => value as typeof remote
		);

		expect(draft).toEqual(remote);
	});
});
