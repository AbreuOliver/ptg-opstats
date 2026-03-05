<script lang="ts">
	import Brand from './Brand.svelte';
	import HeaderNavigation from './HeaderNavigation.svelte';
	import QuickActions from './QuickActions.svelte';
</script>

<header
	class="z-50 w-full border-b-3 border-neutral-200/10 bg-neutral-100 px-4 backdrop-blur supports-[backdrop-filter]:bg-transparent dark:border-neutral-800 dark:bg-neutral-950/70"
>
	<div class="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-4">
		<div class="justify-self-start">
			<Brand />
		</div>
		<!-- <p class="ml-8 text-[var(--theme-color)] font-semibold">Admin Mode</p> -->
		<HeaderNavigation />
		<div class="justify-self-end">
			<QuickActions />
		</div>
	</div>
</header>
