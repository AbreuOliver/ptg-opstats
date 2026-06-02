/// <reference types="svelte" />
import type { Component } from 'svelte';

type AnyProps = Record<string, unknown>;

const state = $state<{
  open: boolean;
  component: Component | null;
  props: AnyProps;
}>({ open: false, component: null, props: {} });

export function openOverlay(component: Component, props: AnyProps = {}) {
  state.component = component;
  state.props = props;
  state.open = true;
}

export function closeOverlay() {
  state.open = false;
  // (optional) small delay to unmount content after transition
  setTimeout(() => { state.component = null; state.props = {}; }, 200);
}

export function useOverlay() {
  // handy hook if you prefer to import a single API
  return { state, openOverlay, closeOverlay };
}
