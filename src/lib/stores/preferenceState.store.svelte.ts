/// <reference types="svelte" />
// ^ REQUIRED SO SVELTE'S RUNES ($STATE / $EFFECT) TYPE-CHECK INSIDE THIS MODULE.
// IMPORTANT: THIS FILE MUST BE NAMED WITH THE .svelte.ts EXTENSION SO RUNES ARE ALLOWED.

import { browser } from '$app/environment';
// ^ BROWSER GUARD FROM SVELTEKIT. TRUE ONLY IN THE CLIENT (NOT DURING SSR).
// WE USE THIS TO AVOID TOUCHING LOCALSTORAGE ON THE SERVER.

export type OpenMap = {
  system: boolean;
  modes: boolean;
  hours: boolean;
  contractor: boolean;
};
// ^ THE SHAPE OF OUR COLLAPSIBLE-SECTION OPEN/CLOSED STATE.

const DEFAULTS: OpenMap = { system: true, modes: false, hours: false, contractor: false };
// ^ DEFAULT OPEN/CLOSED VALUES USED ON FIRST LOAD OR WHEN RESETTING.

const KEY = 'prefs:overview-open@v1';
// ^ LOCALSTORAGE KEY. VERSION IT (@v1) SO YOU CAN CHANGE THE SHAPE LATER
// WITHOUT COLLIDING WITH OLD SAVED DATA.

export function usePersistedOpen(initial: Partial<OpenMap> = {}) {
  // BUILD THE INITIAL STATE OBJECT:
  // ORDER MATTERS! LATER SPREADS OVERRIDE EARLIER ONES.
  // 1) DEFAULTS  → BASELINE VALUES
  // 2) INITIAL   → CALLER-PROVIDED OVERRIDES (OPTIONAL)
  // 3) SAVED     → WHAT'S IN LOCALSTORAGE (IF ANY) WINS LAST ON THE CLIENT
  const start: OpenMap = browser
    ? { ...DEFAULTS, ...initial, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
    : { ...DEFAULTS, ...initial };
  // ^ ON THE SERVER (SSR), WE CAN'T READ LOCALSTORAGE, SO WE MERGE ONLY DEFAULTS+INITIAL.

  const state = $state<OpenMap>(start);
  // ^ $STATE MAKES A DEEPLY-PROXIED, MUTABLE, REACTIVE OBJECT.
  // ANY DIRECT MUTATION LIKE `state.system = false` TRIGGERS DEPENDENTS.
  // RETURNED VALUE IS STILL A PLAIN OBJECT YOU CAN READ/WRITE.

  if (browser) {
    $effect(() => {
      // $EFFECT RUNS AFTER REACTIVE CHANGES. BECAUSE WE TOUCH `state` HERE,
      // THIS EFFECT RE-RUNS WHEN ANY NESTED PROPERTY CHANGES (THANKS TO $STATE'S PROXY).
      localStorage.setItem(KEY, JSON.stringify(state));
      // ^ PERSIST THE ENTIRE OBJECT ON EVERY CHANGE. SIMPLE AND ROBUST.
    });
  }
  // ^ WE ONLY SETUP THE EFFECT IN THE BROWSER (LOCALSTORAGE DOESN'T EXIST IN SSR).

  const reset = () => Object.assign(state, DEFAULTS);
  // ^ QUICK WAY TO RESTORE DEFAULTS WHILE PRESERVING THE SAME PROXY OBJECT
  // (SO ALL EXISTING BINDINGS KEEP WORKING).

  return { open: state, reset };
  // ^ EXPOSE THE STATE AS `open` FOR ERGONOMIC USAGE:
  //    <CollapsibleSection bind:open={open.system} />
  // ALSO EXPOSE `reset()` FOR A "RESET TO DEFAULTS" UI ACTION.
}
