<script lang="ts">
	import { supabase } from '$lib/supabase';

	let email = '';
	let code = '';
	let step: 'email' | 'verify' = 'email';
	let loading = false;
	let error: string | null = null;

	const sendCode = async () => {
		error = null;
		loading = true;

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

	const verifyCode = async () => {
		error = null;
		loading = true;

		const { error: verifyErr } = await supabase.auth.verifyOtp({
			email,
			token: code,
			type: 'email'
		});

		loading = false;

		if (verifyErr) {
			error = verifyErr.message;
			return;
		}

		// Redirect after successful login
		window.location.href = '/dashboard';
	};
</script>

<div class="card preset-filled-surface-100-900 max-w-md mx-auto mt-20 p-8 shadow-xl border border-surface-200-800 space-y-6">
	<h2 class="h4">
		{step === 'email' ? 'Log in with your email' : 'Enter the 6-digit code'}
	</h2>

	{#if step === 'email'}
		<form on:submit|preventDefault={sendCode} class="space-y-4">
			<div>
				<label class="form-label block mb-1">Email address</label>
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
				<label class="form-label block mb-1">Verification Code</label>
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
		<p class="text-error text-sm mt-2">{error}</p>
	{/if}
</div>
