<script lang="ts">
  /// <reference types="svelte" />
  // PROPS (RUNES MODE)
  let {
    placement = 'top',                // 'top' | 'bottom' | 'left' | 'right'
    offset = 8,                       // px gap from trigger
    hoverOpenDelay = 80,
    hoverCloseDelay = 120,
    contentClass = 'rounded-md bg-neutral-900 text-neutral-100 p-3 shadow-lg ring-1 ring-black/20',
    z = 9999,                         // z-index
    portal = false                    // render to <body> to avoid clipping
  }: {
    placement?: 'top' | 'bottom' | 'left' | 'right';
    offset?: number;
    hoverOpenDelay?: number;
    hoverCloseDelay?: number;
    contentClass?: string;
    z?: number;
    portal?: boolean;
  } = $props();

  // INTERNAL STATE
  let triggerEl: HTMLElement | null = null;
  let contentEl: HTMLElement | null = null;
  let open$ = $state(false);

  // POSITION
  const pos = $state<{ top: number; left: number } | null>(null);

  function place() {
    if (!triggerEl || !contentEl) return;
    const t = triggerEl.getBoundingClientRect();
    const c = contentEl.getBoundingClientRect();

    let top = 0, left = 0;
    if (placement === 'top') {
      top = t.top - c.height - offset;
      left = t.left + t.width / 2 - c.width / 2;
    } else if (placement === 'bottom') {
      top = t.bottom + offset;
      left = t.left + t.width / 2 - c.width / 2;
    } else if (placement === 'left') {
      top = t.top + t.height / 2 - c.height / 2;
      left = t.left - c.width - offset;
    } else {
      // 'right'
      top = t.top + t.height / 2 - c.height / 2;
      left = t.right + offset;
    }

    // Clamp within viewport
    top = Math.max(8, Math.min(top, window.innerHeight - c.height - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - c.width - 8));

    pos!.top = top;
    pos!.left = left;
  }

  // HOVER LOGIC (DELAYED OPEN/CLOSE, STICKY WHILE HOVERING CONTENT)
  let openTimer: number | null = null;
  let closeTimer: number | null = null;

  function scheduleOpen() {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    if (!open$) {
      openTimer = window.setTimeout(() => {
        open$ = true;
        // next microtask so contentEl is in the DOM
        queueMicrotask(() => { place(); });
      }, hoverOpenDelay);
    }
  }

  function scheduleClose() {
    if (openTimer) { clearTimeout(openTimer); openTimer = null; }
    closeTimer = window.setTimeout(() => { open$ = false; }, hoverCloseDelay);
  }

  function onTriggerEnter() { scheduleOpen(); }
  function onTriggerLeave() { scheduleClose(); }
  function onContentEnter() { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } }
  function onContentLeave() { scheduleClose(); }

  // REPOSITION ON SCROLL/RESIZE WHILE OPEN
  function onWin() { if (open$) place(); }
  $effect(() => {
    if (!open$) return;
    window.addEventListener('scroll', onWin, true);
    window.addEventListener('resize', onWin, true);
    return () => {
      window.removeEventListener('scroll', onWin, true);
      window.removeEventListener('resize', onWin, true);
    };
  });

  // SIMPLE "PORTAL" ACTION (OPTIONAL)
  function portalAction(node: HTMLElement) {
    document.body.appendChild(node);
    return { destroy: () => node.remove() };
  }
</script>

<!-- TRIGGER: provide with {#snippet trigger()} or default slot -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  bind:this={triggerEl}
  onmouseenter={onTriggerEnter}
  onmouseleave={onTriggerLeave}
  class="inline-flex"
>
  <slot name="trigger" />
</span>

<!-- CONTENT -->
{#if open$}
  {#if portal}
    <div
      use:portalAction
      bind:this={contentEl}
      onmouseenter={onContentEnter}
      onmouseleave={onContentLeave}
      class={contentClass}
      style={`position:fixed; top:${pos?.top ?? -9999}px; left:${pos?.left ?? -9999}px; z-index:${z}`}
      role="tooltip"
    >
      <slot />
    </div>
  {:else}
    <div
      bind:this={contentEl}
      onmouseenter={onContentEnter}
      onmouseleave={onContentLeave}
      class={contentClass}
      style={`position:fixed; top:${pos?.top ?? -9999}px; left:${pos?.left ?? -9999}px; z-index:${z}`}
      role="tooltip"
    >
      <slot name="content"><slot /></slot>
    </div>
  {/if}
{/if}
