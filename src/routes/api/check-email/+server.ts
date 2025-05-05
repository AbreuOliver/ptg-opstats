import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	const { email } = await request.json();

	if (!email) {
		return json({ allowed: false }, { status: 400 });
	}

	const supabase = locals.supabase;

	const { data, error } = await supabase
		.from('allowed_emails')
		.select('email')
		.ilike('email', email)
		.single();

	if (error || !data) {
		return json({ allowed: false }, { status: 403 });
	}

	return json({ allowed: true });
}
