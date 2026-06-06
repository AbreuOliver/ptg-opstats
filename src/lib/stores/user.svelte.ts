/// <reference types="svelte" />
import { browser } from '$app/environment';
import { page } from '$app/state';

export function useUser() {
	const user = $state<{
		email: string | null;
		firstName: string;
		lastName: string;
		displayName: string;
	}>({
		email: null,
		firstName: '',
		lastName: '',
		displayName: ''
	});

	if (browser) {
		$effect(() => {
			const pageUser = page.data?.user;
			const firstName = pageUser?.firstName?.trim() ?? '';
			const lastName = pageUser?.lastName?.trim() ?? '';
			user.email = pageUser?.email ?? null;
			user.firstName = firstName;
			user.lastName = lastName;
			user.displayName =
				firstName && lastName
					? `${firstName.charAt(0)}. ${lastName}`
					: firstName || lastName || pageUser?.email || '';
		});
	}

	return { user };
}
