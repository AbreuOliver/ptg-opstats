<script lang="ts">
  import { page } from '$app/stores';

  // single source of truth
  const ADMIN_SLUGS = [
    'requirements',
    'adr',          // I’d use lowercase here for URLs
    'design',
    'quick-start',
    'weekly-totals'
  ] as const;

  type AdminSlug = (typeof ADMIN_SLUGS)[number];

  const hrefFor = (slug: AdminSlug) => `/admin/${slug}`;

  const isActive = (slug: AdminSlug) => {
    const path = $page.url.pathname;
    const base = hrefFor(slug);
    return path === base || path.startsWith(base + '/');
  };

  const toLabel = (slug: AdminSlug) =>
    slug
      .split('-')
      .map((word) => word.toUpperCase() === word ? word : word[0].toUpperCase() + word.slice(1))
      .join(' ');
</script>

<div class="min-w-11/12 border-t-3 border-zinc-300 dark:border-neutral-800 dark:bg-neutral-950/70">
  <div class="flex h-16 items-center gap-4">
    <nav
      class="hidden items-stretch gap-6 pl-6 md:flex"
      data-sveltekit-preload-code="hover"
      data-sveltekit-preload-data="hover"
    >
      {#each ADMIN_SLUGS as s}
        <a
          href={hrefFor(s)}
          aria-current={isActive(s) ? 'page' : undefined}
          class="relative flex min-w-18 items-center px-1 text-lg font-medium transition-colors
            {isActive(s)
              ? 'dark:text-white text-zinc-900'
              : 'text-neutral-400 hover:text-neutral-100'}"
        >
          {toLabel(s)}
          <span
            class="pointer-events-none absolute right-2 -bottom-5 left-2 h-1 rounded
              {isActive(s) ? 'bg-red-700' : 'bg-transparent'}"
          />
        </a>
      {/each}
    </nav>
  </div>
</div>
