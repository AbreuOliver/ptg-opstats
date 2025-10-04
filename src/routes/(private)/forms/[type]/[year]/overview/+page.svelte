<!-- ADD LOGIC TO INTELLIGENTLY DISPLAY THE CORRECT OVERVIEW BASED ON THE TRANSPORATION TYPE -->
<script lang="ts">
    import { page } from "$app/state";
	import UrbanOverview from "$lib/components/UrbanOverview.component.svelte";
</script>

<section class="flex px-8">
    {#if page.url.pathname.includes('urban')}
    <UrbanOverview />
    {/if}
</section>