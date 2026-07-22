<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import SignatureModal from '$lib/components/forms/SignatureModal.svelte';
	import { formatReportCertificationTimestamp } from '$lib/components/forms/reportCertificationTimestamp';

	type SignatureRole = 'AUTHORIZED_OFFICIAL' | 'FINANCIAL_MANAGER' | 'TAB_CHAIRPERSON';
	type SignatureStatus = 'active' | 'revoked' | 'invalidated';
	type PublicSignature = {
		reportKey: string;
		agency: string;
		type: 'urban' | 'rural';
		year: number;
		id: number;
		role: SignatureRole;
		signerName: string;
		signerEmail: string;
		signatureImage: string;
		signedAt: string;
		signerLocale: string | null;
		signerTimeZone: string | null;
		signerUtcOffsetMinutes: number | null;
		status: SignatureStatus;
		revokedAt: string | null;
		invalidatedAt: string | null;
	};

	type SignerUser = { userId: number; email: string; displayName: string } | null;
	type SignatureMode = 'create' | 'replace';

	const ROLE_CONFIG: Array<{
		role: SignatureRole;
		label: string;
		helper: string;
	}> = [
		{
			role: 'AUTHORIZED_OFFICIAL',
			label: 'Signature of Authorized Official',
			helper: 'Authorized Official'
		},
		{
			role: 'FINANCIAL_MANAGER',
			label: 'Signature of Financial Manager',
			helper: 'Financial Manager'
		},
		{
			role: 'TAB_CHAIRPERSON',
			label: 'Signature of TAB Chairperson',
			helper: 'TAB Chairperson'
		}
	];

	const CERTIFICATION_TEXT =
		'I hereby certify that, to the best of my knowledge, the information in this report is accurate and complete.';
	const SUPPORTING_TEXT =
		'By applying your signature, you certify that the report information is accurate and complete and acknowledge that your account, timestamp, and request information will be recorded.';

	let {
		agency,
		type,
		year,
		signatures: initialSignatures = [],
		canSign = false,
		currentUser = null
	}: {
		agency: string;
		type: 'urban' | 'rural';
		year: number;
		signatures: PublicSignature[];
		canSign?: boolean;
		currentUser?: SignerUser;
	} = $props();

	let signatures = $state<PublicSignature[]>([]);
	let modalOpen = $state(false);
	let modalRole = $state<SignatureRole | null>(null);
	let modalMode = $state<SignatureMode>('create');
	let modalSubmitting = $state(false);
	let modalError = $state<string | null>(null);
	let rowErrors = $state<Partial<Record<SignatureRole, string>>>({});
	let rowBusy = $state<Partial<Record<SignatureRole, boolean>>>({});

	const apiBase = $derived(`/api/report-signatures/${encodeURIComponent(agency)}/${type}/${year}`);

	$effect(() => {
		signatures = initialSignatures;
	});

	function sortedForRole(role: SignatureRole): PublicSignature[] {
		return signatures
			.filter((signature) => signature.role === role)
			.sort((left, right) => {
				const leftTime = new Date(left.signedAt).getTime();
				const rightTime = new Date(right.signedAt).getTime();
				if (leftTime !== rightTime) return rightTime - leftTime;
				return right.id - left.id;
			});
	}

	function latestForRole(role: SignatureRole): PublicSignature | null {
		return sortedForRole(role)[0] ?? null;
	}

	function activeForRole(role: SignatureRole): PublicSignature | null {
		return signatures.find((signature) => signature.role === role && signature.status === 'active') ?? null;
	}

	function statusLabel(status: SignatureStatus): string {
		if (status === 'active') return 'Active';
		if (status === 'revoked') return 'Removed';
		return 'Invalidated';
	}

	function getSignerLocale(): string | undefined {
		if (typeof navigator === 'undefined') return undefined;
		return navigator.languages?.[0] ?? navigator.language ?? undefined;
	}

	function formatSignedAt(signature: PublicSignature): string {
		if (!browser) return '';
		return formatReportCertificationTimestamp(signature, {
			locale: getSignerLocale()
		});
	}

	function canEditSignature(): boolean {
		if (!canSign) return false;
		return true;
	}

	function openModal(role: SignatureRole, mode: SignatureMode) {
		if (!canSign) return;
		modalRole = role;
		modalMode = mode;
		modalError = null;
		modalOpen = true;
	}

	function closeModal() {
		if (modalSubmitting) return;
		modalOpen = false;
		modalRole = null;
		modalError = null;
	}

	async function refreshSignatures() {
		const response = await fetch(apiBase, {
			method: 'GET',
			headers: { accept: 'application/json' }
		});
		const payload = (await response.json().catch(() => null)) as { signatures?: PublicSignature[]; error?: string } | null;
		if (!response.ok || !payload?.signatures) {
			throw new Error(payload?.error ?? 'Failed to load signatures.');
		}
		signatures = payload.signatures;
	}

	async function submitSignature(payload: { signatureImage: string; signatureStrokeData: unknown[] }) {
		if (!modalRole) return;
		const role = modalRole;
		const mode = modalMode;
		modalSubmitting = true;
		modalError = null;
		rowBusy[role] = true;
		rowErrors[role] = undefined;
		rowBusy = rowBusy;
		rowErrors = rowErrors;

		try {
			const response = await fetch(apiBase, {
				method: mode === 'replace' ? 'PUT' : 'POST',
				headers: {
					'content-type': 'application/json',
					accept: 'application/json'
				},
				body: JSON.stringify({
					role,
					signatureMethod: 'HANDWRITTEN_CANVAS',
					signatureImage: payload.signatureImage,
					signatureStrokeData: payload.signatureStrokeData,
					consentText: CERTIFICATION_TEXT,
					supportingText: SUPPORTING_TEXT,
					signerLocale: getSignerLocale()
				})
			});

			const result = (await response.json().catch(() => null)) as
				| { signature?: PublicSignature; error?: string }
				| null;

			if (!response.ok) {
				throw new Error(result?.error ?? 'Failed to save signature.');
			}

			await refreshSignatures();
			modalOpen = false;
			modalRole = null;
			rowErrors[role] = undefined;
			rowErrors = rowErrors;
			await invalidateAll();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to save signature.';
			modalError = message;
			rowErrors[role] = message;
			rowErrors = rowErrors;
		} finally {
			rowBusy[role] = false;
			rowBusy = rowBusy;
			modalSubmitting = false;
		}
	}

	async function removeSignature(role: SignatureRole) {
		if (!canSign) return;
		const active = activeForRole(role);
		if (!active) return;
		const confirmed = window.confirm(`Remove the ${ROLE_CONFIG.find((entry) => entry.role === role)?.helper ?? role} signature?`);
		if (!confirmed) return;
		rowBusy[role] = true;
		rowBusy = rowBusy;
		rowErrors[role] = undefined;
		rowErrors = rowErrors;
		try {
			const response = await fetch(apiBase, {
				method: 'DELETE',
				headers: {
					'content-type': 'application/json',
					accept: 'application/json'
				},
				body: JSON.stringify({ role })
			});
			const result = (await response.json().catch(() => null)) as { error?: string } | null;
			if (!response.ok) {
				throw new Error(result?.error ?? 'Failed to remove signature.');
			}
			await refreshSignatures();
			await invalidateAll();
		} catch (error) {
			rowErrors[role] = error instanceof Error ? error.message : 'Failed to remove signature.';
			rowErrors = rowErrors;
		} finally {
			rowBusy[role] = false;
			rowBusy = rowBusy;
		}
	}

	function fieldClasses(signature: PublicSignature | null): string {
		const base =
			'w-full min-h-16 rounded-lg border bg-white px-3 py-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] dark:bg-zinc-900';
		if (!signature) {
			return `${base} border-dashed border-zinc-300 text-zinc-400 hover:border-[var(--theme-color)] hover:bg-[color-mix(in_srgb,var(--theme-color)_5%,white)] dark:border-zinc-700 dark:text-zinc-400`;
		}
		if (signature.status === 'active') {
			return `${base} border-zinc-300 hover:border-[var(--theme-color)] dark:border-zinc-700`;
		}
		return `${base} border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-50`;
	}
</script>

<section class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 sm:p-6">
	<div class="space-y-3">
		<div class="text-base font-semibold text-zinc-950 dark:text-zinc-50">
			I hereby certify that, to the best of my knowledge, the information in this report is accurate and complete.
		</div>
		<div class="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
			By applying your signature, you certify that the report information is accurate and complete and acknowledge that your account, timestamp, and request information will be recorded.
		</div>
	</div>

	<div class="mt-6 space-y-6">
	{#each ROLE_CONFIG as roleConfig}
		{@const activeSignature = activeForRole(roleConfig.role)}
		{@const latestSignature = latestForRole(roleConfig.role)}
		<div class="space-y-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<div class="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
						{roleConfig.helper}
					</div>
					<div class="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
						{roleConfig.label}
					</div>
				</div>
				{#if activeSignature}
					<span
						class={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
							activeSignature.status === 'active'
								? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200'
								: 'bg-amber-100 text-amber-950 dark:bg-amber-500/15 dark:text-amber-100'
						}`}
					>
						{statusLabel(activeSignature.status)}
					</span>
				{/if}
			</div>

			<div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
				<div class="space-y-2">
					<button
						type="button"
						class={fieldClasses(activeSignature)}
						onclick={() => openModal(roleConfig.role, activeSignature ? 'replace' : 'create')}
						disabled={!canEditSignature() || Boolean(rowBusy[roleConfig.role])}
						aria-label={`${roleConfig.label}${activeSignature ? `, ${statusLabel(activeSignature.status)}` : ', click to sign'}`}
					>
						{#if activeSignature?.status === 'active'}
							<div class="flex min-h-16 items-center justify-center overflow-hidden">
								<img
									src={activeSignature.signatureImage}
									alt={`${roleConfig.helper} signature`}
									class="max-h-16 max-w-full object-contain"
								/>
							</div>
						{:else if activeSignature}
							<div class="flex min-h-16 items-center justify-center overflow-hidden opacity-80">
								<img
									src={activeSignature.signatureImage}
									alt={`${roleConfig.helper} signature`}
									class="max-h-16 max-w-full object-contain opacity-80"
								/>
							</div>
						{:else}
							<div class="flex min-h-16 items-center justify-center text-sm font-medium">
								Click to sign
							</div>
						{/if}
					</button>
					{#if latestSignature && !activeSignature}
						<div class="text-sm text-amber-800 dark:text-amber-200">
							{#if latestSignature.status === 'revoked'}
								This signature was removed. Sign again to certify.
							{:else}
								This signature was invalidated after the report changed. Sign again to certify.
							{/if}
						</div>
					{/if}
				</div>

					<div class="space-y-2">
						<label class="block text-sm font-semibold text-zinc-700 dark:text-zinc-200" for={`signature-date-${roleConfig.role}`}>
							Date
						</label>
						<input
							id={`signature-date-${roleConfig.role}`}
							type="text"
							readonly
							tabindex="-1"
							placeholder=""
						value={activeSignature ? formatSignedAt(activeSignature) : ''}
						class="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 shadow-sm read-only:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
					/>
					{#if activeSignature?.signerName}
						<div class="text-sm text-zinc-600 dark:text-zinc-300">{activeSignature.signerName}</div>
					{/if}
					{#if activeSignature?.signerEmail}
						<div class="text-sm text-zinc-500 dark:text-zinc-400">{activeSignature.signerEmail}</div>
					{/if}
				</div>
			</div>

			{#if activeSignature && canSign}
				<div class="flex flex-wrap gap-2 pt-1">
					<button
						type="button"
							class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
							onclick={() => openModal(roleConfig.role, 'replace')}
							disabled={Boolean(rowBusy[roleConfig.role])}
						>
							Replace Signature
						</button>
						<button
							type="button"
							class="inline-flex h-10 items-center justify-center rounded-md border border-red-300 bg-red-50 px-4 text-sm font-medium text-red-900 transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-100 dark:hover:bg-red-950/40"
							onclick={() => removeSignature(roleConfig.role)}
							disabled={Boolean(rowBusy[roleConfig.role])}
						>
							Remove Signature
						</button>
					</div>
				{:else if canSign}
					<div class="flex flex-wrap gap-2 pt-1">
						<button
							type="button"
							class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
							onclick={() => openModal(roleConfig.role, 'create')}
							disabled={Boolean(rowBusy[roleConfig.role])}
						>
							Sign
						</button>
					</div>
				{/if}

				{#if rowErrors[roleConfig.role]}
					<div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-100">
						{rowErrors[roleConfig.role]}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	{#if modalOpen && modalRole}
		<SignatureModal
			open={modalOpen}
			title={`Sign as ${ROLE_CONFIG.find((entry) => entry.role === modalRole)?.helper ?? modalRole}`}
			roleLabel={ROLE_CONFIG.find((entry) => entry.role === modalRole)?.label ?? modalRole}
			signerName={currentUser?.displayName ?? null}
			signerEmail={currentUser?.email ?? null}
			certificationText={CERTIFICATION_TEXT}
			supportingText={SUPPORTING_TEXT}
			submitting={modalSubmitting}
			error={modalError}
			onCancel={closeModal}
			onApply={submitSignature}
		/>
	{/if}
</section>
