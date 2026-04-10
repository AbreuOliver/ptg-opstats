/// <reference types="svelte" />
import { browser } from '$app/environment';

export function roleForEmail(email: string | null | undefined): 'Super Admin' | 'Admin' {
	const normalized = (email ?? '').toLowerCase();
	if (normalized.includes('orabreu@ncsu.edu') || normalized.includes('jscott@ncsu.edu')) {
		return 'Super Admin';
	}
	return 'Admin';
}

export function useUser() {
	const user = $state<{ email: string | null }>({ email: null });

	if (browser) {
		$effect(() => {
			let unsub: (() => void) | undefined;

			(async () => {
				const { supabase } = await import('$lib/supabase');

				// INITIAL FETCH
				const { data } = await supabase.auth.getUser();
				user.email = data.user?.email ?? null;

				// SUBSCRIBE TO CHANGES
				const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
					user.email = session?.user?.email ?? null;
				});
				unsub = () => sub.subscription.unsubscribe();
			})();

			// CLEANUP MUST BE SYNC
			return () => {
				unsub?.();
			};
		});
	}

	return { user };
}
