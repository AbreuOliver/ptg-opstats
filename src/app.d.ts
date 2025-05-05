// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
// See https://kit.svelte.dev/docs/types#app
import type { SupabaseClient, Session } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			session: Session | null;
		}
		// Optional: add interface PageData, Error, etc. here if needed
	}
}

export {};

