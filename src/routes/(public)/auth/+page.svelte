<script lang="ts">
	import StyledButton from '$lib/components/StyledButton.svelte';
	import { tick } from 'svelte';

	let email = $state('');
	let otpDigits = $state(['', '', '', '', '', '']);
	let otpInputs = $state<Array<HTMLInputElement | null>>([]);
	let step = $state<'email' | 'verify'>('email');
	let loading = $state(false);
	let error = $state<string | null>(null);
	const otpLength = 6;
	const code = $derived.by(() => otpDigits.join(''));
	const codeComplete = $derived.by(() => otpDigits.every((digit) => /^\d$/.test(digit)));

	function setOtpDigit(index: number, value: string) {
		const digit = value.replace(/\D/g, '').slice(-1);
		otpDigits[index] = digit;
	}

	async function focusOtpIndex(index: number) {
		await tick();
		otpInputs[index]?.focus();
		otpInputs[index]?.select();
	}

	function handleOtpInput(event: Event, index: number) {
		const input = event.currentTarget as HTMLInputElement;
		const raw = input.value.replace(/\D/g, '');
		if (!raw) {
			setOtpDigit(index, '');
			return;
		}

		const digits = raw.slice(0, otpLength - index).split('');
		for (let offset = 0; offset < digits.length; offset += 1) {
			otpDigits[index + offset] = digits[offset];
		}

		const nextIndex = Math.min(index + digits.length, otpLength - 1);
		if (index + digits.length < otpLength) {
			void focusOtpIndex(index + digits.length);
		} else {
			void focusOtpIndex(nextIndex);
		}
	}

	function handleOtpKeydown(event: KeyboardEvent, index: number) {
		const input = event.currentTarget as HTMLInputElement;
		if (event.key === 'Backspace') {
			event.preventDefault();
			if (otpDigits[index]) {
				setOtpDigit(index, '');
				return;
			}
			if (index > 0) {
				setOtpDigit(index - 1, '');
				void focusOtpIndex(index - 1);
			}
			return;
		}

		if (event.key === 'ArrowLeft' && index > 0) {
			event.preventDefault();
			void focusOtpIndex(index - 1);
			return;
		}

		if (event.key === 'ArrowRight' && index < otpLength - 1) {
			event.preventDefault();
			void focusOtpIndex(index + 1);
			return;
		}

		if (event.key.length === 1 && !/^\d$/.test(event.key)) {
			event.preventDefault();
		}
	}

	function handleOtpPaste(event: ClipboardEvent, index: number) {
		event.preventDefault();
		const pasted = event.clipboardData?.getData('text').replace(/\D/g, '') ?? '';
		if (!pasted) return;
		const digits = pasted.slice(0, otpLength - index).split('');
		for (let offset = 0; offset < digits.length; offset += 1) {
			otpDigits[index + offset] = digits[offset];
		}
		void focusOtpIndex(Math.min(index + digits.length, otpLength - 1));
	}

	function resetOtp() {
		otpDigits = ['', '', '', '', '', ''];
	}

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
			resetOtp();
			await focusOtpIndex(0);
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
		const normalizedCode = code.replace(/\D/g, '');

		try {
			const response = await fetch('/api/auth/verify-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, code: normalizedCode })
			});
			const result = (await response.json().catch(() => ({}))) as {
				error?: string;
				redirectTo?: string;
			};

			if (!response.ok) {
				error = result.error ?? 'An unexpected error occurred.';
				return;
			}

			window.location.href = result.redirectTo ?? '/forms';
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
                        <div class="text-center flex flex-col items-center">
                            <label for="code-input" class="mb-1 block text-sm/6 font-medium text-neutral-900">
                                Verification Code
                            </label>
                            <div class="mt-2">
                                <div class="flex gap-2">
                                    {#each Array.from({ length: otpLength }) as _, index}
                                        <input
                                            bind:this={otpInputs[index]}
                                            id={index === 0 ? 'code-input' : `code-input-${index + 1}`}
                                            type="text"
                                            class="h-12 w-11 rounded-xl bg-white text-center text-lg font-semibold tracking-[0.2em] text-neutral-900 outline-1 -outline-offset-1 outline-neutral-300 placeholder:text-neutral-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                                            value={otpDigits[index]}
                                            autocomplete={index === 0 ? 'one-time-code' : 'off'}
                                            inputmode="numeric"
                                            maxlength="6"
                                            pattern="[0-9]*"
                                            placeholder="•"
                                            aria-label={`Digit ${index + 1} of ${otpLength}`}
                                            oninput={(event) => handleOtpInput(event, index)}
                                            onkeydown={(event) => handleOtpKeydown(event, index)}
                                            onpaste={(event) => handleOtpPaste(event, index)}
                                        />
                                    {/each}
                                </div>
                            </div>
                        </div>

                        <div>
                            <StyledButton
                                text={loading ? 'Verifying...' : 'Verify Code'}
                                type="submit"
                                variant="primary"
                                extraClass="w-full justify-center"
                                disabled={loading || !codeComplete}
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
