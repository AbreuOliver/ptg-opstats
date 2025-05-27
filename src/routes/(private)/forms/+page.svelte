
<!-- RELATIVE PATH: src/routes/(private)/forms/+page.svelte -->

<main
	class="mx-auto flex min-h-full w-full max-w-md flex-col justify-center rounded-md border border-gray-200 bg-white px-6 py-12 shadow-xl lg:px-8"
>
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="text-center text-2xl/9 font-bold tracking-tight text-gray-900">
			Select Transporation Type
		</h2>
	</div>
	<hr class="mt-8 w-full border-none" />
	<ul class="max-w-2xl space-y-4">
		<li>
			<a href="/forms/urban">
				<div
					class="hover:border-indigo-600 hover:text-indigo-600 relative font-semibold text-gray-700 overflow-x-auto rounded-lg border-1 border-gray-300 p-4 hover:bg-indigo-100/10"
				>
					Urban
				</div>
			</a>
		</li>
		<li>
			<a href="/forms/rural">
				<div
					class="hover:border-indigo-600 hover:text-indigo-600 relative font-semibold text-gray-700 overflow-x-auto rounded-lg border-1 border-gray-300 p-4 hover:bg-indigo-100/10"
				>
					Rural
				</div>
			</a>
		</li>
	</ul>
</main>
