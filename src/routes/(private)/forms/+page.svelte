<!-- RELATIVE PATH: src/routes/(private)/forms/+page.svelte -->

<!-- <main
	class="mx-auto flex min-h-full w-full max-w-md flex-col justify-center rounded-xl border-2 border-neutral-200 bg-white/45 px-6 py-12 shadow-xl backdrop-blur-[1.5px] lg:px-8"
>	<div class="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-neutral-200/40 pointer-events-none"></div>
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="text-center text-2xl/9 font-bold tracking-tight text-neutral-900">
			Select Transporation Type
		</h2>
	</div>
	<hr class="mt-8 w-full border-none" />
	<ul class="max-w-2xl space-y-4">
		<li>
			<a href="/forms/urban">
				<div
					class="relative overflow-x-auto rounded-lg border-1 border-neutral-300 bg-neutral-100 p-4 font-semibold text-neutral-700 hover:border-indigo-600 hover:bg-indigo-100 hover:text-indigo-600"
				>
					Urban
				</div>
			</a>
		</li>
		<li>
			<a href="/forms/rural">
				<div
					class="relative overflow-x-auto rounded-lg border-1 border-neutral-300 bg-neutral-100 p-4 font-semibold text-neutral-700 hover:border-indigo-600 hover:bg-indigo-100 hover:text-indigo-600"
				>
					Rural
				</div>
			</a>
		</li>
	</ul>
</main> -->

<script lang="ts">
	import StyledButton from '$lib/components/StyledButton.svelte';
	import FrostedButtonPanel from '$lib/components/FrostedButtonPanel.svelte';
</script>

<FrostedButtonPanel title="Select Transporation Type" headingStyle="secondary">
	<li>
		<StyledButton href="/forms/urban" text="Urban" variant="tertiary" extraClass="w-full text-center" />
	</li>
	<li>
		<StyledButton href="/forms/rural" text="Rural" variant="tertiary" extraClass="w-full text-center" />
	</li>
</FrostedButtonPanel>
