import type { Podium, Weight } from './types';

/** Начальный пустой подиум. */
export const EMPTY_PODIUM: Podium = [null, null, null];

/** Доступные веса. */
export const WEIGHTS: Weight[] = [1, 2];

/** Доступные длительности вращения (сек). */
export const SPIN_DURATIONS = [3, 5, 7, 13];

/** Пауза между авто-спинами (мс), чтобы увидеть, кто выбыл. */
export const AUTO_SPIN_PAUSE_MS = 2000;

/** Ключ localStorage. */
export const STORAGE_KEY = 'wheel-out-state';