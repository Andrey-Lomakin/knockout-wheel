import { MAX_WEIGHT, MIN_WEIGHT, WEIGHT_STEP } from './constants';
import type { Weight } from './types';

/**
 * Округляет вес к ближайшему шагу (WEIGHT_STEP) и зажимает в [MIN_WEIGHT, MAX_WEIGHT].
 * Безопасно для ошибок плавающей точки (например, 7 * 0.2 не станет весом 1.4000000000000001).
 */
export function clampWeight(value: number): Weight {
  const stepped = Math.round(value / WEIGHT_STEP) * WEIGHT_STEP;
  const clamped = Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, stepped));
  return Number(clamped.toFixed(2));
}

/** Вес со сдвигом на `delta` шагов от текущего, зажатый в допустимые границы. */
export function stepWeight(current: number, delta: number): Weight {
  return clampWeight(current + delta * WEIGHT_STEP);
}

/** Формат для отображения: 1 → 'x1', 1.4 → 'x1.4', 2 → 'x2', 3 → 'x3'. */
export function formatWeight(value: number): string {
  return `x${String(Number(value.toFixed(1)))}`;
}
