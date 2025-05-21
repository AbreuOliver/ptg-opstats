import { createServerClient } from '@supabase/ssr';
import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Wrap SvelteKit's event.cookies to match Supabase's new CookieMethodsServer interface
	const cookieWrapper = {
		getAll: () => event.cookies.getAll().map(({ name, value }) => ({ name, value })),

		setAll: (
			cookies: { name: string; value: string; options?: Parameters<typeof event.cookies.set>[2] }[]
		) => {
			for (const cookie of cookies) {
				event.cookies.set(cookie.name, cookie.value, cookie.options);
			}
		}
	};

	const supabase = createServerClient(
		import.meta.env.PUBLIC_SUPABASE_URL,
		import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: cookieWrapper,
			cookieEncoding: 'base64' as any, 
            cookieOptions: {
                path: '/',
                sameSite: 'lax',
                secure: !dev,
                domain: dev ? undefined : 'yourdomain.com'
            }
		}
	);

	event.locals.supabase = supabase;

    const {
        data: { session },
        error 
    } = await supabase.auth.getSession();
    
    // console.log('📦 Supabase session:', session);

	event.locals.session = session;

	// console.log('🔍 Incoming cookies:', event.cookies.getAll());
	// console.log('session', session);
	// console.log('error', error);

	return resolve(event);
};
