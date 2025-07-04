<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import StyledButton from '$lib/components/StyledButton.svelte';

	let email = '';
	let code = '';
	let step: 'email' | 'verify' = 'email';
	let loading = false;
	let error: string | null = null;
	let authenticated = false;

	onMount(async () => {
		const { data } = await supabase.auth.getUser();
		authenticated = !!data?.user;
	});

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
		console.log('sendCode triggered'); // Debug log to confirm form submit fires
		error = null;
		loading = true;

		try {
			const allowed = await checkEmailAllowed();
			if (!allowed) {
				error =
					'This email address is not authorized to log in. If you believe this is an error, contact jscott@ncsu.edu for support.';
				return;
			}

			const { error: sendErr } = await supabase.auth.signInWithOtp({
				email,
				options: { shouldCreateUser: true }
			});

			if (sendErr) {
				error = sendErr.message;
				return;
			}

			step = 'verify';
		} catch (e) {
			console.error('Error in sendCode:', e);
			error = 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	};

	const verifyCode = async () => {
		console.log('verifyCode triggered'); // Optional debug for second step
		error = null;
		loading = true;

		try {
			const { error: verifyErr } = await supabase.auth.verifyOtp({
				email,
				token: code,
				type: 'email'
			});

			if (verifyErr) {
				error = verifyErr.message;
				return;
			}

			window.location.href = '/dashboard';
		} catch (e) {
			console.error('Error in verifyCode:', e);
			error = 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	};
</script>

<section
	class="relative flex w-full max-w-md flex-col overflow-hidden rounded-xl border-2 border-neutral-600/20 bg-white/70 shadow-xl backdrop-blur-md"
>
	<!-- OVERLAY FOR FROSTED GRADIENT ACCENT -->
	<div class="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-orange-100/40 pointer-events-none"></div>

	<main class="relative z-10 flex min-h-full w-full flex-col justify-center px-6 py-12 lg:px-8">
		<div class="sm:mx-auto sm:w-full sm:max-w-md">
			<h2 class="text-center text-2xl/9 font-bold tracking-tight text-neutral-900">
				{step === 'email' ? 'Log in with your email' : 'Enter the 6-digit code'}
			</h2>
		</div>

		<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
			{#if step === 'email'}
				<form on:submit|preventDefault={sendCode} class="space-y-6">
					<div>
						<label for="email-input" class="mb-1 block text-sm/6 font-medium text-neutral-900">
							Email address
						</label>
						<div class="mt-2">
							<input
								id="email-input"
								type="email"
								class="block min-h-12 w-full rounded-xl bg-white px-3 py-1.5 text-base text-neutral-900 outline-1 -outline-offset-1 outline-neutral-300 placeholder:text-neutral-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
								bind:value={email}
								required
								placeholder="you@example.com"
							/>
						</div>
					</div>

					<StyledButton
						text={loading ? 'Sending...' : 'Send Login Code'}
						type="submit"
						variant="secondary"
						extraClass="w-full justify-center cursor-pointer"
						disabled={loading}
					/>
				</form>
			{:else}
				<form on:submit|preventDefault={verifyCode} class="space-y-6">
					<div>
						<label for="code-input" class="mb-1 block text-sm/6 font-medium text-neutral-900">
							Verification Code
						</label>
						<div class="mt-2">
							<input
								id="code-input"
								type="text"
								class="block min-h-12 w-full rounded-xl bg-white px-3 py-1.5 text-base text-neutral-900 outline-1 -outline-offset-1 outline-neutral-300 placeholder:text-neutral-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
								bind:value={code}
								inputmode="numeric"
								maxlength="6"
								required
								placeholder="123456"
							/>
						</div>
					</div>
					<div>
						<StyledButton
							text={loading ? 'Verifying...' : 'Verify Code'}
							type="submit"
							variant="primary"
							extraClass="w-full justify-center"
							disabled={loading}
						/>
					</div>
					<div>
						<StyledButton
							href="/"
							text={'Back'}
							variant="secondary"
							extraClass="w-full justify-center"
							disabled={loading}
							on:click={() => (step = 'email')}
						/>
					</div>
				</form>
			{/if}

			{#if error}
				<p class="mt-6 text-center text-sm/6 text-red-600">{error}</p>
			{/if}
		</div>
	</main>
</section>


<style>
</style>
