<script lang="ts">
	import Brand from './Brand.svelte';
	import HeaderNavigation from './HeaderNavigation.svelte';
	import QuickActions from './QuickActions.svelte';
</script>

<header
	class="z-50 w-full border-b-3 border-neutral-200/10 bg-neutral-100 px-8 backdrop-blur supports-[backdrop-filter]:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950/70"
>
	<div class="flex h-14 items-center gap-4">
		<Brand />
		<p class="ml-8 text-red-600-600 font-semibold">Current Transit System (TS)</p>
		<HeaderNavigation />
		<QuickActions />
	</div>
</header>
