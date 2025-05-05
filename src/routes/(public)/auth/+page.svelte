<script lang="ts">
	import { supabase } from '$lib/supabase';

	let email = '';
	let code = '';
	let step: 'email' | 'verify' = 'email';
	let loading = false;
	let error: string | null = null;

	const checkEmailAllowed = async (): Promise<boolean> => {
		const res = await fetch('/api/check-email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email })
		});

		if (!res.ok) return false;

		const { allowed } = await res.json();
		return allowed;
	};

	const sendCode = async () => {
		error = null;
		loading = true;

		const allowed = await checkEmailAllowed();
		if (!allowed) {
			error = 'Access denied for this email address.';
			loading = false;
			return;
		}

		const { error: sendErr } = await supabase.auth.signInWithOtp({
			email,
			options: { shouldCreateUser: true }
		});

		loading = false;

		if (sendErr) {
			error = sendErr.message;
			return;
		}

		step = 'verify';
	};

	// const verifyCode = async () => {
	// 	error = null;
	// 	loading = true;

	// 	const { error: verifyErr, data } = await supabase.auth.verifyOtp({
	// 		email,
	// 		token: code,
	// 		type: 'email'
	// 	});

	// 	console.log('verifyOtp:', { error: verifyErr, data });

	// 	loading = false;

	// 	if (verifyErr) {
	// 		error = verifyErr.message;
	// 		return;
	// 	}

	// 	window.location.href = '/dashboard';
	// };

	const verifyCode = async () => {
		error = null;
		loading = true;

		const { error: verifyErr } = await supabase.auth.verifyOtp({
			email,
			token: code,
			type: 'email'
		});

		if (verifyErr) {
			error = verifyErr.message;
			loading = false;
			return;
		}

		// 👇 This line ensures Supabase sets the auth cookie
		await supabase.auth.getSession();

		// 👇 Now it's safe to navigate
		window.location.href = '/dashboard';
	};
</script>

<div
	class="card preset-filled-surface-100-900 border-surface-200-800 mx-auto mt-20 max-w-md space-y-6 border p-8 shadow-xl"
>
	<h2 class="h4">
		{step === 'email' ? 'Log in with your email' : 'Enter the 6-digit code'}
	</h2>

	{#if step === 'email'}
		<form on:submit|preventDefault={sendCode} class="space-y-4">
			<div>
				<label class="form-label mb-1 block">Email address</label>
				<input
					type="email"
					class="form-input w-full"
					bind:value={email}
					required
					placeholder="you@example.com"
				/>
			</div>
			<button type="submit" class="btn btn-primary w-full" disabled={loading}>
				{loading ? 'Sending...' : 'Send Login Code'}
			</button>
		</form>
	{:else}
		<form on:submit|preventDefault={verifyCode} class="space-y-4">
			<div>
				<label class="form-label mb-1 block">Verification Code</label>
				<input
					type="text"
					class="form-input w-full"
					bind:value={code}
					inputmode="numeric"
					maxlength="6"
					required
					placeholder="123456"
				/>
			</div>
			<button type="submit" class="btn btn-primary w-full" disabled={loading}>
				{loading ? 'Verifying...' : 'Verify Code'}
			</button>
			<button type="button" class="btn btn-secondary w-full" on:click={() => (step = 'email')}>
				Back
			</button>
		</form>
	{/if}

	{#if error}
		<p class="text-error mt-2 text-sm">{error}</p>
	{/if}
</div>
