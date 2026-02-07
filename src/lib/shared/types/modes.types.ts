export const URBAN_MODE_IDS = [
  'fixed_route',
  'dial_a_ride',
  'light_rail',
  'street_car',
  'vanpool',
  'microtransit'
] as const;

export type UrbanModeId = (typeof URBAN_MODE_IDS)[number];

export const RURAL_MODE_IDS = [
  'dr_do',
  'dr_pt',
  'mb_do',
  'mb_pt',
  'mt_do',
  'mt_pt'
] as const;

export type RuralModeId = (typeof RURAL_MODE_IDS)[number];

export type ModeDef<T extends string> = {
  id: T;
  label: string;
};
