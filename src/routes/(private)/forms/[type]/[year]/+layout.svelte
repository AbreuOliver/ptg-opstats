<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();

	let type = $derived(() => page.params.type);
	let year = $derived(() => page.params.year);
	let path = $derived(() => page.url.pathname);

	const currentTabs = ['overview', 'weekday', 'saturday', 'sunday', 'finance'];

	function isActiveTab(tab: string) {
		const segments = path().split('/').filter(Boolean);
		return segments.at(-1) === tab;
	}
</script>

<!-- CONTAINTER -->
<!-- Outer container must be a flex column layout -->
<div class="flex flex-col min-h-[50vh] max-w-screen min-w-[75vw] overflow-hidden rounded-xl border-none bg-transparent pt-0 shadow-none">
	
	<!-- TAB BAR -->
	<div class="flex items-center gap-1 border-b border-gray-300 bg-transparent px-0 pt-2">
		{#each currentTabs as tab}
			<a
				href={`/forms/${type()}/${year()}/${tab}`}
				class={`text-md min-w-40 rounded-t-xl border px-4 pt-2 pb-1.5 font-medium capitalize
              ${
								isActiveTab(tab)
									? 'border-b-0 border-gray-300 bg-white text-indigo-600'
									: 'border-b-0 border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-100'
							}
            `}
				aria-current={isActiveTab(tab) ? 'page' : undefined}
			>
				{tab.replace('-', ' ')}
			</a>
		{/each}
	</div>

	<!-- CONTENTS (fills remaining height) -->
	<div class="flex-grow w-full border-t-0 bg-white p-4 border-2 border-l border-r border-b border-gray-300 rounded-b-xl">
		{@render children()}
	  </div>
	  
</div>

