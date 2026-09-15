import type { WheelParticipant } from '../game/types';

/** Сегмент колеса: углы (рад, от 12 часов по часовой) и цвет заливки. */
export interface Segment {
  start: number;
  end: number;
  color: string;
}

export const PALETTE = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#eab308',
  '#06b6d4',
  '#84cc16',
  '#f43f5e',
];

export const TWO_PI = Math.PI * 2;

/** Указатель колеса стоит на 12 часах (угол -PI/2 в координатах canvas). */
export const POINTER_ANGLE = -Math.PI / 2;

/**
 * Доли круга для колеса на выбывание: доля обратна множителю (`1 / вес`, нормировано).
 * Множитель работает буквально: ×2 — ровно половина того сектора, что был бы при ×1,
 * то есть вдвое меньший шанс вылететь НА КАЖДОМ спине.
 *
 * Альтернатива, которую мы пробовали и отвергли, — формула pointauc
 * (`PredictionService.getReverseSize`, `q = (1 - p) / (n - 1)`). Она честнее на дистанции:
 * шанс дожить до победы выходит ровно пропорциональным весу, тогда как здесь тяжёлые
 * слегка переоценены (×3 против трёх ×1 берёт 58% побед вместо 50%). Но она делает сектора
 * почти одинаковыми — при восьми участниках ×3 сужает сектор всего на пятую часть, — и раз
 * процентов на экране нет, преимущество стало бы невидимым. Выбрана наглядность.
 *
 * Единственный источник правды для геометрии и для выбора: если считать их по-разному,
 * указатель встанет не на того, кого объявили выбывшим.
 */
export function dropoutShares(participants: WheelParticipant[]): number[] {
  const inverted = participants.map((p) => (p.weight > 0 ? 1 / p.weight : 0));
  const total = inverted.reduce((sum, share) => sum + share, 0);
  if (total === 0) return inverted;
  return inverted.map((share) => share / total);
}

/** Строит сегменты пропорционально шансам вылететь (`dropoutShares`). */
export function buildSegments(participants: WheelParticipant[], palette: string[] = PALETTE): Segment[] {
  const shares = dropoutShares(participants);
  const total = shares.reduce((sum, share) => sum + share, 0);
  if (total === 0) return [];
  let cursor = 0;
  return shares.map((share, i) => {
    const span = (share / total) * TWO_PI;
    const seg = { start: cursor, end: cursor + span, color: palette[i % palette.length] };
    cursor += span;
    return seg;
  });
}

/** Выбирает выбывающего случайно, с вероятностью, равной его доле круга. */
export function pickWeightedIndex(participants: WheelParticipant[]): number {
  const shares = dropoutShares(participants);
  const total = shares.reduce((sum, share) => sum + share, 0);
  let r = Math.random() * total;
  let index = participants.length - 1;
  for (let i = 0; i < shares.length; i++) {
    r -= shares[i];
    if (r <= 0) {
      index = i;
      break;
    }
  }
  return index;
}

/** Полных оборотов за спин: 270°/сек, как `calculateFixedAngle` в pointauc. Минимум один. */
export function fullTurnsFor(durationSec: number): number {
  return Math.max(1, Math.round((durationSec * 270) / 360));
}

/** Отступ от краёв сектора, чтобы указатель не вставал ровно на линию между соседями. */
const EDGE_INSET = 0.06;

/**
 * Целое вращение до случайной точки ВНУТРИ сектора (а не до его центра, как было).
 * Так указатель встаёт то у края, то посередине, и до последнего момента непонятно,
 * на ком колесо остановится — приём из pointauc (`distanceToItem`).
 * Число оборотов растёт с длительностью, иначе долгий спин выглядел бы вялым.
 */
export function computeTargetRotation(currentRotation: number, segment: Segment, durationSec = 5): number {
  const span = segment.end - segment.start;
  const inset = span * EDGE_INSET;
  const stopLocal = segment.start + inset + Math.random() * (span - 2 * inset);
  const targetMod = (((POINTER_ANGLE - stopLocal) % TWO_PI) + TWO_PI) % TWO_PI;
  const currentMod = ((currentRotation % TWO_PI) + TWO_PI) % TWO_PI;
  let delta = targetMod - currentMod;
  if (delta < 0) delta += TWO_PI;
  return currentRotation + fullTurnsFor(durationSec) * TWO_PI + delta;
}

type Point = readonly [x: number, y: number];
type Cubic = readonly [Point, Point, Point, Point];

/**
 * Кривая темпа спина из pointauc (`SPIN_PATH`, скармливается gsap CustomEase) — два кубических
 * сегмента в координатах «доля времени → доля пути». Здесь она посчитана без gsap.
 *
 * Главное отличие от ease-out: колесо НЕ стартует на полной скорости, а раскручивается —
 * за первые 10% времени проходит 14% пути (ease-out прошёл бы 27%), разгоняется к t≈0.2
 * и дальше долго выкатывается.
 */
const SPIN_SEGMENTS: readonly [Cubic, Cubic] = [
  [
    [0, 0],
    [0.102, 0.044],
    [0.171, 0.365],
    [0.212, 0.542],
  ],
  [
    [0.212, 0.542],
    [0.344, 0.988],
    [0.808, 1],
    [1, 1],
  ],
];

const bezier = (a: number, b: number, c: number, d: number, s: number): number => {
  const u = 1 - s;
  return u * u * u * a + 3 * u * u * s * b + 3 * u * s * s * c + s * s * s * d;
};

/** Доля пройденного пути в момент `t` ∈ [0, 1]. */
export function spinEase(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const [p0, p1, p2, p3] = t <= SPIN_SEGMENTS[0][3][0] ? SPIN_SEGMENTS[0] : SPIN_SEGMENTS[1];
  // x(s) монотонна, поэтому параметр кривой ищем делением пополам — так же делает CustomEase.
  let lo = 0;
  let hi = 1;
  let s = 0.5;
  for (let i = 0; i < 24; i++) {
    s = (lo + hi) / 2;
    if (bezier(p0[0], p1[0], p2[0], p3[0], s) < t) lo = s;
    else hi = s;
  }
  return bezier(p0[1], p1[1], p2[1], p3[1], s);
}