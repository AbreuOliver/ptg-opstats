// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
// See https://kit.svelte.dev/docs/types#app
import type { AuthenticatedAppUser } from '$lib/server/auth/user';
import type { UserScope } from '$lib/server/rbac';

declare global {
	namespace App {
		interface Locals {
			user: AuthenticatedAppUser | null;
			userScope: UserScope;
		}
		// Optional: add interface PageData, Error, etc. here if needed
	}
}

export {};
