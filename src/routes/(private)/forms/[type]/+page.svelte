<!-- RELATIVE PATH: src/routes/(private)/forms/[type]/+page.svelte -->

<script lang="ts">
	import { page } from '$app/state';
	// import { onMount } from 'svelte';

	const currentYear: number = new Date().getFullYear();
	const lastFiveYears: number[] = Array.from({ length: 5 }, (_, i) => currentYear - i);

	const segments: string[] = page.url.pathname.split('/');
	const type: string = segments[segments.length - 1];

	// onMount(() => {
	// 	console.log("Last Five Years:", lastFiveYears)
	// });
</script>


<main
	class="mx-auto flex min-h-full w-full max-w-md flex-col justify-center rounded-md border border-gray-200 bg-white px-6 py-12 shadow-xl lg:px-8"
>
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="text-center text-2xl/9 font-bold tracking-tight text-gray-900">
			Select Financial Year
		</h2>
	</div>
	<hr class="mt-8 w-full border-none" />
	<ul class="max-w-2xl space-y-4">
        {#each lastFiveYears as year}
		<li >
			<a href={`/forms/${type}/${year}`}>
				<div
					class="hover:border-indigo-600 hover:text-indigo-600 relative font-semibold overflow-x-auto rounded-lg border-1 border-gray-300 p-4 hover:bg-indigo-100/10 text-gray-700"
				>
                FY{year}
				</div>
			</a>
		</li>
        {/each}
	</ul>
</main>
