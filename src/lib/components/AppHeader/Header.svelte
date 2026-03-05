<script lang="ts">
	import Brand from './Brand.svelte';
	import HeaderNavigation from './HeaderNavigation.svelte';
	import QuickActions from './QuickActions.svelte';
</script>

<header
	class="z-50 w-full border-b-2 border-[var(--border)] bg-[var(--surface-1)] px-4 backdrop-blur supports-[backdrop-filter]:bg-transparent"
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
