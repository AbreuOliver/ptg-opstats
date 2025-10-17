/// <reference types="svelte" />
import { browser } from '$app/environment';

type Days = { saturday: boolean; sunday: boolean };
const KEY = 'prefs:offers-days@v1';
const defaults: Days = { saturday: false, sunday: false };

const start: Days = browser
  ? { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  : defaults;

export const days = $state<Days>(start);

if (browser) {
  $effect(() => {
    localStorage.setItem(KEY, JSON.stringify(days));
  });
}
