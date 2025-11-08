<script lang="ts">
  const availablePaths: string[] = ['urban', 'rural'];
</script>

<div class="grid w-full h-full place-content-center grid-cols-1 sm:grid-cols-2 gap-6 p-8">
  {#each availablePaths as path}
    <a
      href={`/forms/${path}`}
      class="relative flex items-center justify-center overflow-hidden rounded-xl
             bg-white/70 border border-zinc-300 dark:border-0 dark:border-none backdrop-blur-md dark:bg-zinc-900
             px-6 py-12 text-2xl font-semibold text-neutral-900 dark:text-neutral-100
             transition hover:bg-white/80 dark:hover:bg-zinc-800
             focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500
             h-40 capitalize"
      data-sveltekit-preload-data="hover"
    >{path}</a>
  {/each}
</div>
