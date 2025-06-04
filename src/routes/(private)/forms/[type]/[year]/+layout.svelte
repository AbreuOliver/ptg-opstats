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
<div class="flex flex-col min-h-[75vh] max-w-screen min-w-[85vw] overflow-hidden rounded-b-xl rounded-tr-xl bg-transparent pt-0 shadow-none justify-center mt-10"
style="box-shadow: -6px 8px 16px rgba(0,0,0,0.04);">
	<div class="flex items-center gap-0.25 border-b border-neutral-300 bg-transparent px-0 pt-2">
		{#each currentTabs as tab}
			<a
				href={`/forms/${type()}/${year()}/${tab}`}
				class={`text-md min-w-40 rounded-t-xl border px-4 pt-2.5 pb-2 -mt-2 font-semibold capitalize border-b -mb-0.5
              ${
					isActiveTab(tab)
					? 'border-b-0 border-neutral-300 bg-white text-indigo-700 '
					: 'border-b-0 border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-00'
				}
            `}
				aria-current={isActiveTab(tab) ? 'page' : undefined}
			>
				{tab.replace('-', ' ')}
			</a>
		{/each}
	</div>

	<!-- CONTENTS (FILLS REMAINING H -->
	<div class="flex flex-col flex-grow w-full border-t-0 bg-white border-2 border-l border-r border-b border-neutral-300 rounded-b-xl">
		<div class="min-w-full flex flex-col grow-1 justify-start p-8 items-start bg-white rounded-b-xl">
		{@render children()}
		</div>
	  </div>
</div>

