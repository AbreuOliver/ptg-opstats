<!-- src/lib/components/OperatingHoursSection.svelte -->
<script lang="ts">
  /// <reference types="svelte" />
  import CollapsibleSection from '../molecules/CollapsibleSection.svelte';
  import Checkbox from '../atoms/Checkbox.svelte';

  import type { DayService, DaySlug } from '$lib/features/forms/shared/types/capabilities.types';

  type Days = Record<DaySlug, DayService>;

  // BINDABLE SO PARENT CAN `bind:open`
  let { title = 'Operating Hours', open = $bindable(false), days }: {
    title?: string; open: boolean; days: Days;
  } = $props();

  // TOGGLES INIT FROM EXISTING DATA
  //   let hasSaturday = $state(false);
  let hasSaturday = $state(days.saturday.offered);
  let hasSunday   = $state(days.sunday.offered);

  // CLEAR FIELDS WHEN DISABLED
  $effect(() => {
    days.saturday.offered = hasSaturday;
    if (!hasSaturday) {
      days.saturday.start = '';
      days.saturday.end = '';
      days.saturday.peakRoutes = 0;
    }
  });
  $effect(() => {
    days.sunday.offered = hasSunday;
    if (!hasSunday) {
      days.sunday.start = '';
      days.sunday.end = '';
      days.sunday.peakRoutes = 0;
    }
  });

  const inputCls =
    'w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 ' +
    'placeholder:text-[var(--text-muted)] focus:border-transparent focus:ring-2 ' +
    'focus:ring-[var(--theme-color)] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400';
</script>

<CollapsibleSection {title} bind:open>
  <div class="grid w-full grid-cols-4 items-start gap-y-6 py-4 pr-4">
    <!-- WEEKDAY -->
    <div class="col-span-1 pr-8 text-right text-xl font-medium text-[var(--text)] dark:text-zinc-300">Weekday</div>
    <div class="col-span-3 grid grid-cols-3 gap-4">
      <div class="flex flex-col">
        <label for="weekdayStart" class="mb-1 text-xl text-[var(--text-muted)]">Begin Time</label>
        <input id="weekdayStart" type="time" bind:value={days.weekday.start} required class={inputCls} />
      </div>
      <div class="flex flex-col">
        <label for="weekdayEnd" class="mb-1 text-xl text-[var(--text-muted)]">End Time</label>
        <input id="weekdayEnd" type="time" bind:value={days.weekday.end} required class={inputCls} />
      </div>
      <div class="flex flex-col">
        <label for="weekdayPeakRoutes" class="mb-1 text-xl text-[var(--text-muted)]"># of Peak Period Routes</label>
        <!-- Option A: manual numeric coercion -->
        <input
          id="weekdayPeakRoutes"
          type="number"
          min="0"
          class={inputCls}
          value={days.weekday.peakRoutes ?? ''}
          oninput={(e) => {
            const el = e.currentTarget as HTMLInputElement;
            days.weekday.peakRoutes = Number.isNaN(el.valueAsNumber) ? 0 : el.valueAsNumber;
          }}
        />
      </div>
    </div>

    <!-- SATURDAY -->
    <div class="col-span-1 pr-8 text-right text-xl font-medium text-[var(--text)] dark:text-zinc-300">Saturday</div>
    <div class="col-span-3 space-y-3">
      <Checkbox label="Offers Saturday Service" bind:checked={hasSaturday} />
      {#if hasSaturday}
        <div class="grid grid-cols-3 gap-4">
          <div class="flex flex-col">
            <label for="saturdayStart" class="mb-1 text-xl text-[var(--text-muted)]">Begin Time</label>
            <input id="saturdayStart" type="time" bind:value={days.saturday.start} class={inputCls} />
          </div>
          <div class="flex flex-col">
            <label for="saturdayEnd" class="mb-1 text-xl text-[var(--text-muted)]">End Time</label>
            <input id="saturdayEnd" type="time" bind:value={days.saturday.end} class={inputCls} />
          </div>
          <div class="flex flex-col">
            <label for="saturdayPeakRoutes" class="mb-1 text-xl text-[var(--text-muted)]"># of Peak Period Routes</label>
            <input
              id="saturdayPeakRoutes"
              type="number"
              min="0"
              class={inputCls}
              value={days.saturday.peakRoutes ?? ''}
              oninput={(e) => {
                const el = e.currentTarget as HTMLInputElement;
                days.saturday.peakRoutes = Number.isNaN(el.valueAsNumber) ? 0 : el.valueAsNumber;
              }}
            />
          </div>
        </div>
      {/if}
    </div>

    <!-- SUNDAY -->
    <div class="col-span-1 pr-8 text-right text-xl font-medium text-[var(--text)] dark:text-zinc-300">Sunday</div>
    <div class="col-span-3 space-y-3">
      <Checkbox label="Offers Sunday Service" bind:checked={hasSunday} />
      {#if hasSunday}
        <div class="grid grid-cols-3 gap-4">
          <div class="flex flex-col">
            <label for="sundayStart" class="mb-1 text-xl text-[var(--text-muted)]">Begin Time</label>
            <input id="sundayStart" type="time" bind:value={days.sunday.start} class={inputCls} />
          </div>
          <div class="flex flex-col">
            <label for="sundayEnd" class="mb-1 text-xl text-[var(--text-muted)]">End Time</label>
            <input id="sundayEnd" type="time" bind:value={days.sunday.end} class={inputCls} />
          </div>
          <div class="flex flex-col">
            <label for="sundayPeakRoutes" class="mb-1 text-xl text-[var(--text-muted)]"># of Peak Period Routes</label>
            <input
              id="sundayPeakRoutes"
              type="number"
              min="0"
              class={inputCls}
              value={days.sunday.peakRoutes ?? ''}
              oninput={(e) => {
                const el = e.currentTarget as HTMLInputElement;
                days.sunday.peakRoutes = Number.isNaN(el.valueAsNumber) ? 0 : el.valueAsNumber;
              }}
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
</CollapsibleSection>
