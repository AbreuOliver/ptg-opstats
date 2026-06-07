<script lang="ts">
	import StyledButton from '$lib/components/StyledButton.svelte';

	let email = '';
	let code = '';
	let step: 'email' | 'verify' = 'email';
	let loading = false;
	let error: string | null = null;

	const sendCode = async () => {
		error = null;
		loading = true;

		try {
			const response = await fetch('/api/auth/request-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			const result = (await response.json().catch(() => ({}))) as { error?: string };

			if (!response.ok) {
				error = result.error ?? 'An unexpected error occurred.';
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
		error = null;
		loading = true;

		try {
			const response = await fetch('/api/auth/verify-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, code })
			});
			const result = (await response.json().catch(() => ({}))) as {
				error?: string;
				redirectTo?: string;
			};

			if (!response.ok) {
				error = result.error ?? 'An unexpected error occurred.';
				return;
			}

			window.location.href = result.redirectTo ?? '/dashboard';
		} catch (e) {
			console.error('Error in verifyCode:', e);
			error = 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	};
</script>

<section class="flex h-screen items-center justify-center">
	<div
		class="relative flex w-full max-w-md flex-col overflow-hidden rounded-xl border-2 border-neutral-600/20 bg-white/70 shadow-xl backdrop-blur-md"
	>
		<!-- OVERLAY FOR FROSTED GRADIENT ACCENT -->
		<div
			class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-orange-100/40"
		></div>

		<main class="relative z-10 flex min-h-full w-full flex-col justify-center px-6 py-12 lg:px-8">
			<div class="sm:mx-auto sm:w-full sm:max-w-md">
				<h2 class="text-center text-2xl/9 font-bold tracking-tight text-neutral-900">
					{step === 'email' ? 'Log in with your email' : 'Enter the 6-digit code'}
				</h2>
				<p class="mt-3 text-center text-sm/6 text-neutral-600">
					{step === 'email'
						? "Enter your email address and we'll send a 6-digit login code if the address is authorized for NC OpStats."
						: 'Check your email for a 6-digit code. Codes expire after 10 minutes.'}
				</p>
			</div>

			<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
				{#if step === 'email'}
					<form
						onsubmit={(e) => {
							e.preventDefault();
							sendCode();
						}}
						class="space-y-6"
					>
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
					<form
						onsubmit={(e) => {
							e.preventDefault();
							verifyCode();
						}}
						class="space-y-6"
					>
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
								onClick={() => (step = 'email')}
								text={'Back'}
								variant="secondary"
								extraClass="w-full justify-center"
								disabled={loading}
							/>
						</div>
					</form>
				{/if}

				{#if error}
					<p class="mt-6 text-center text-sm/6 text-red-600">{error}</p>
				{/if}
			</div>
		</main>
	</div>
</section>
