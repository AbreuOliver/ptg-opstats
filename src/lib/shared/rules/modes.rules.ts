import type { ModeDef, UrbanModeId, RuralModeId } from '$lib/shared/types/modes.types';

export const URBAN_MODES: ModeDef<UrbanModeId>[] = [
  { id: 'fixed_route', label: 'Fixed Route' },
  { id: 'dial_a_ride', label: 'Dial-A-Ride' },
  { id: 'light_rail', label: 'Light Rail' },
  { id: 'street_car', label: 'Street Car' },
  { id: 'vanpool', label: 'Vanpool' },
  { id: 'microtransit', label: 'Microtransit' }
];

export const RURAL_MODES: ModeDef<RuralModeId>[] = [
  { id: 'dr_do', label: 'Demand Response Directly Operated (DR DO)' },
  { id: 'dr_pt', label: 'Demand Response Purchased (DR PT)' },
  { id: 'mb_do', label: 'Fixed Route Directly Operated (MB DO)' },
  { id: 'mb_pt', label: 'Fixed Route Purchased (MB PT)' },
  { id: 'mt_do', label: 'Microtransit (MT DO)' },
  { id: 'mt_pt', label: 'Microtransit (MT PT)' }
];
