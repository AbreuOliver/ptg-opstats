<script lang="ts">
  import { useOverlay, closeOverlay } from './overlay.svelte';
  import { fly, fade } from 'svelte/transition';

  const { state } = useOverlay();

  function onBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) closeOverlay();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') closeOverlay();
  }
</script>

{#if state.open}
  <!-- BACKDROP -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[999] bg-black/50 backdrop-blur-[1px]"
    onclick={onBackdrop}
    onkeydown={onKey}
    tabindex="0"
    in:fade={{ duration: 300 }}
    out:fade={{ duration: 300 }}
  >
    <!-- PANEL (RIGHT SLIDE-OVER) -->
    <div
      class="absolute inset-y-0 right-0 w-full max-w-[28rem]
             bg-neutral-900 text-neutral-100 shadow-2xl ring-1 ring-black/10
             dark:bg-zinc-950"
      in:fly={{ x: 32, duration: 160 }}
      out:fly={{ x: 32, duration: 160 }}
    >
      {#if state.component}
        <svelte:component this={state.component} {...state.props} onClose={closeOverlay}></svelte:component>
      {/if}
    </div>
  </div>
{/if}
