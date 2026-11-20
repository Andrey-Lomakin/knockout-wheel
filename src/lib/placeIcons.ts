export type MedalPlace = 1 | 2 | 3;

/** Среда в нумерации Date.getDay(): воскресенье — 0. */
export const FROG_DAY = 3;

const MEDALS: Record<MedalPlace, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function getPlaceIcon(place: MedalPlace, date = new Date()): string {
  return place === 1 && date.getDay() === FROG_DAY ? '🐸' : MEDALS[place];
}
