<!-- ADD LOGIC TO INTELLIGENTLY DISPLAY THE CORRECT OVERVIEW BASED ON THE TRANSPORATION TYPE -->
<script lang="ts">
    import { page } from "$app/state";
	import RuralWeekday from "$lib/components/RuralWeekday.svelte";
	import UrbanOverview from "$lib/components/UrbanOverview.component.svelte";
</script>

<section class="flex flex-col">
    <h1 class="text-zinc-800 dark:text-white text-3xl font-semibold mb-4 pl-4">Weekday</h1>
    {#if page.url.pathname.includes('urban')}
    <!-- <UrbanOverview /> -->
     {:else}
     <RuralWeekday />
    {/if}

</section>