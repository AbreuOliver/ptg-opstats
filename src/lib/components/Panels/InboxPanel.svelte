<!-- src/lib/panels/InboxPanel.svelte -->
<script lang="ts">
  /// <reference types="svelte" />

  // PROPS VIA $props() (NOT export let)
  let { title = 'Inbox', onClose }: { title?: string; onClose?: () => void } = $props();
  // If you need reactivity to prop changes later, use:
  // $: ({ title = 'Inbox', onClose } = $props());

  type Message = {
    id: string; from: string; subject: string; preview: string; body: string; date: string; read: boolean;
  };

  const inbox = $state<Message[]>([
    { id: '1', from: 'Wake County Transit', subject: 'Q2 submitted',
      preview: 'We uploaded the Q2 dataset…', body: 'Q2 has been submitted.', date: '2025-04-26T14:05:00Z', read: false },
    { id: '2', from: 'Durham Transit', subject: 'Reconciliation question',
      preview: 'Quick question about column G…', body: 'Is paratransit included?', date: '2025-04-25T10:42:00Z', read: true }
  ]);

  let openId = $state<string | null>(null);
  const unread = $derived(() => inbox.reduce((n, m) => n + (m.read ? 0 : 1), 0));

  function toggleOpen(id: string) {
    openId = openId === id ? null : id;
    const m = inbox.find(x => x.id === id);
    if (m && !m.read) m.read = true;
  }
  function markRead(id: string, value = true) {
    const m = inbox.find(x => x.id === id);
    if (m) m.read = value;
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose?.();
  }
</script>

<div class="flex h-full flex-col" role="dialog" aria-modal="true" aria-labelledby="inboxTitle" tabindex="0" onkeydown={onKey}>
  <header class="flex items-center justify-between border-b border-white/10 p-4">
    <h2 id="inboxTitle" class="text-2xl font-semibold">{title}</h2>
    <!-- <div class="flex items-center gap-3 text-sm">
      <span class="rounded bg-red-600/20 px-2 py-0.5 text-red-400">{unread} unread</span>
      {#if onClose}
        <button class="rounded px-2 py-1 hover:bg-white/10" onclick={onClose} aria-label="Close">Close</button>
      {/if}
    </div> -->
  </header>

  <ul class="flex-1 overflow-auto p-2">
    {#each inbox as m (m.id)}
      <li class="mb-2 rounded-md border border-white/10 bg-neutral-900/60">
        <button
          class="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-md px-3 py-2 text-left
                 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-red-600"
          onclick={() => toggleOpen(m.id)}
          aria-expanded={openId === m.id}
        >
          <div class="min-w-0">
            <div class="flex items-baseline gap-2">
              <span class="truncate text-sm {m.read ? 'text-neutral-300' : 'font-semibold text-neutral-100'}">{m.from}</span>
              <span class="truncate text-xs text-neutral-400">{new Date(m.date).toLocaleString()}</span>
            </div>
            <div class="truncate text-sm text-neutral-200">{m.subject}</div>
            <div class="truncate text-xs text-neutral-400">{m.preview}</div>
          </div>
          <span class="h-2 w-2 rounded-full {m.read ? 'bg-transparent' : 'bg-red-500'}" aria-hidden="true"></span>
        </button>

        {#if openId === m.id}
          <div class="border-t border-white/10 p-3 text-sm text-neutral-100">
            <pre class="whitespace-pre-wrap font-sans">{m.body}</pre>
            <div class="mt-3">
              {#if m.read}
                <button class="rounded px-3 py-1 text-sm hover:bg-white/10" onclick={() => markRead(m.id, false)}>Mark unread</button>
              {:else}
                <button class="rounded px-3 py-1 text-sm hover:bg-white/10" onclick={() => markRead(m.id, true)}>Mark read</button>
              {/if}
            </div>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
</div>
