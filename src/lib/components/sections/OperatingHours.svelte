<!-- src/lib/components/OperatingHoursSection.svelte -->
<script lang="ts">
  /// <reference types="svelte" />
  import CollapsibleSection from '../molecules/CollapsibleSection.svelte';
  import Checkbox from '../atoms/Checkbox.svelte';

  type FormData = {
    weekdayStart: string;
    weekdayEnd: string;
    weekdayPeakRoutes: number;
    saturdayStart?: string;
    saturdayEnd?: string;
    saturdayPeakRoutes?: number;
    sundayStart?: string;
    sundayEnd?: string;
    sundayPeakRoutes?: number;
  };

  // BINDABLE SO PARENT CAN `bind:open`
  let { title = 'Operating Hours', open = $bindable(false), data }: {
    title?: string; open: boolean; data: FormData;
  } = $props();

  // TOGGLES INIT FROM EXISTING DATA
  //   let hasSaturday = $state(false);
  let hasSaturday = $state(!!(data.saturdayStart || data.saturdayEnd || data.saturdayPeakRoutes));
  let hasSunday   = $state(!!(data.sundayStart   || data.sundayEnd   || data.sundayPeakRoutes));

  // CLEAR FIELDS WHEN DISABLED
  $effect(() => {
    if (!hasSaturday) {
      data.saturdayStart = '';
      data.saturdayEnd = '';
      data.saturdayPeakRoutes = 0 as any;
    }
  });
  $effect(() => {
    if (!hasSunday) {
      data.sundayStart = '';
      data.sundayEnd = '';
      data.sundayPeakRoutes = 0 as any;
    }
  });

  const inputCls =
    'w-full rounded-xl border-2 border-zinc-300 bg-zinc-700 px-3 py-2 ' +
    'placeholder:text-zinc-500 focus:border-transparent focus:ring-2 ' +
    'focus:ring-red-600 focus:outline-none dark:border-zinc-700';
</script>

<CollapsibleSection {title} bind:open>
  <div class="grid w-full grid-cols-4 items-start gap-y-6 py-4 pr-4">
    <!-- WEEKDAY -->
    <div class="col-span-1 pr-8 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">Weekday</div>
    <div class="col-span-3 grid grid-cols-3 gap-4">
      <div class="flex flex-col">
        <label for="weekdayStart" class="mb-1 text-xs text-zinc-400">Begin Time</label>
        <input id="weekdayStart" type="time" bind:value={data.weekdayStart} required class={inputCls} />
      </div>
      <div class="flex flex-col">
        <label for="weekdayEnd" class="mb-1 text-xs text-zinc-400">End Time</label>
        <input id="weekdayEnd" type="time" bind:value={data.weekdayEnd} required class={inputCls} />
      </div>
      <div class="flex flex-col">
        <label for="weekdayPeakRoutes" class="mb-1 text-xs text-zinc-400"># of Peak Period Routes</label>
        <!-- Option A: manual numeric coercion -->
        <input
          id="weekdayPeakRoutes"
          type="number"
          min="0"
          class={inputCls}
          value={data.weekdayPeakRoutes ?? ''}
          oninput={(e) => {
            const el = e.currentTarget as HTMLInputElement;
            data.weekdayPeakRoutes = Number.isNaN(el.valueAsNumber) ? 0 : el.valueAsNumber;
          }}
        />
      </div>
    </div>

    <!-- SATURDAY -->
    <div class="col-span-1 pr-8 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">Saturday</div>
    <div class="col-span-3 space-y-3">
      <Checkbox label="Offers Saturday Service" bind:checked={hasSaturday} />
      {#if hasSaturday}
        <div class="grid grid-cols-3 gap-4">
          <div class="flex flex-col">
            <label for="saturdayStart" class="mb-1 text-xs text-zinc-400">Begin Time</label>
            <input id="saturdayStart" type="time" bind:value={data.saturdayStart} class={inputCls} />
          </div>
          <div class="flex flex-col">
            <label for="saturdayEnd" class="mb-1 text-xs text-zinc-400">End Time</label>
            <input id="saturdayEnd" type="time" bind:value={data.saturdayEnd} class={inputCls} />
          </div>
          <div class="flex flex-col">
            <label for="saturdayPeakRoutes" class="mb-1 text-xs text-zinc-400"># of Peak Period Routes</label>
            <input
              id="saturdayPeakRoutes"
              type="number"
              min="0"
              class={inputCls}
              value={data.saturdayPeakRoutes ?? ''}
              oninput={(e) => {
                const el = e.currentTarget as HTMLInputElement;
                data.saturdayPeakRoutes = Number.isNaN(el.valueAsNumber) ? 0 : el.valueAsNumber;
              }}
            />
          </div>
        </div>
      {/if}
    </div>

    <!-- SUNDAY -->
    <div class="col-span-1 pr-8 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">Sunday</div>
    <div class="col-span-3 space-y-3">
      <Checkbox label="Offers Sunday Service" bind:checked={hasSunday} />
      {#if hasSunday}
        <div class="grid grid-cols-3 gap-4">
          <div class="flex flex-col">
            <label for="sundayStart" class="mb-1 text-xs text-zinc-400">Begin Time</label>
            <input id="sundayStart" type="time" bind:value={data.sundayStart} class={inputCls} />
          </div>
          <div class="flex flex-col">
            <label for="sundayEnd" class="mb-1 text-xs text-zinc-400">End Time</label>
            <input id="sundayEnd" type="time" bind:value={data.sundayEnd} class={inputCls} />
          </div>
          <div class="flex flex-col">
            <label for="sundayPeakRoutes" class="mb-1 text-xs text-zinc-400"># of Peak Period Routes</label>
            <input
              id="sundayPeakRoutes"
              type="number"
              min="0"
              class={inputCls}
              value={data.sundayPeakRoutes ?? ''}
              oninput={(e) => {
                const el = e.currentTarget as HTMLInputElement;
                data.sundayPeakRoutes = Number.isNaN(el.valueAsNumber) ? 0 : el.valueAsNumber;
              }}
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
</CollapsibleSection>
