<!-- RELATIVE PATH: src/routes/(private)/forms/+page.svelte -->

<main
	class="mx-auto flex min-h-full w-full max-w-md flex-col justify-center rounded-xl border-2 border-gray-200 bg-white/45 px-6 py-12 shadow-xl backdrop-blur-[1.5px] lg:px-8"
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
					class="relative overflow-x-auto rounded-lg border-1 border-gray-300 bg-gray-100 p-4 font-semibold text-gray-700 hover:border-indigo-600 hover:bg-indigo-100 hover:text-indigo-600"
				>
					Urban
				</div>
			</a>
		</li>
		<li>
			<a href="/forms/rural">
				<div
					class="relative overflow-x-auto rounded-lg border-1 border-gray-300 bg-gray-100 p-4 font-semibold text-gray-700 hover:border-indigo-600 hover:bg-indigo-100 hover:text-indigo-600"
				>
					Rural
				</div>
			</a>
		</li>
	</ul>
</main>
