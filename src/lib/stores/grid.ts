import { writable } from 'svelte/store';
import type { Grid } from '../types/cell';

export const grid = writable<Grid>([]);
