<!-- RELATIVE PATH: src/routes/(private)/forms/[type]/+page.svelte -->

<script lang="ts">
	import { page } from '$app/state';
	import StyledButton from '$lib/components/StyledButton.svelte';
	import FrostedButtonPanel from '$lib/components/FrostedButtonPanel.svelte';

	const currentYear: number = new Date().getFullYear();
	const lastFiveYears: number[] = Array.from({ length: 5 }, (_, i) => currentYear - i);

	const segments: string[] = page.url.pathname.split('/');
	const type: string = segments[segments.length - 1];

	// onMount(() => {
	// 	console.log("Last Five Years:", lastFiveYears)
	// });
</script>


<!-- <main
	class="mx-auto flex min-h-full w-full max-w-md flex-col justify-center lg:px-8 rounded-xl border-2 border-neutral-200 bg-white/45 px-6 py-12 shadow-xl backdrop-blur-[1.5px]"
>
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="text-center text-2xl/9 font-bold tracking-tight text-neutral-900">
			Select Financial Year
		</h2>
	</div>
	<hr class="mt-8 w-full border-none" />
	<ul class="max-w-2xl space-y-4">
        {#each lastFiveYears as year}
		<li >
			<a href={`/forms/${type}/${year}`}>
				<div
					class="hover:border-indigo-600 relative font-semibold overflow-x-auto rounded-lg border-1 border-neutral-300 bg-neutral-100 p-4  text-neutral-700 hover:bg-indigo-100 hover:text-indigo-600"
				>
                FY{year}
				</div>
			</a>
		</li>
        {/each}
	</ul>
</main> -->

<!-- <script lang="ts">
	import StyledButton from '$lib/components/StyledButton.svelte';
	import FrostedButtonPanel from '$lib/components/FrostedButtonPanel.svelte';
	import { page } from '$app/state';

	const currentYear: number = new Date().getFullYear();
	const lastFiveYears: number[] = Array.from({ length: 5 }, (_, i) => currentYear - i);

	const segments: string[] = page.url.pathname.split('/');
	const type: string = segments[segments.length - 1];
</script> -->

<!-- <FrostedButtonPanel title="Select Financial Year" headingStyle="secondary">
	{#each lastFiveYears as year}
		<li>
			<StyledButton
				href={`/forms/${type}/${year}`}
				text={`FY${year}`}
				variant="tertiary"
				extraClass="w-full text-center"
			/>
		</li>
	{/each}
</FrostedButtonPanel> -->

<p>src/routes/(private)/forms/[type]/+page.svelte</p>
