import type { Podium, Weight } from './types';

/** Начальный пустой подиум. */
export const EMPTY_PODIUM: Podium = [null, null, null];

/** Минимальный вес: сектор обычного размера. */
export const MIN_WEIGHT: Weight = 1;

/** Максимальный вес. */
export const MAX_WEIGHT: Weight = 3;

/** Шаг изменения веса в степпере строки участника (×1, ×1.2, ×1.4 …). */
export const WEIGHT_STEP = 0.2;

/** Вес по умолчанию: с ним создаётся новый участник и с ним же список поднимается из хранилища. */
export const DEFAULT_WEIGHT: Weight = 1;

/** Доступные длительности вращения (сек). */
export const SPIN_DURATIONS = [3, 5, 10, 15];

/** Пауза между авто-спинами (мс), чтобы увидеть, кто выбыл. */
export const AUTO_SPIN_PAUSE_MS = 2000;

/** Ключ localStorage. */
export const STORAGE_KEY = 'wheel-out-state';