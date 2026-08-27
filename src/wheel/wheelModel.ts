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

/** Строит сегменты пропорционально весам участников. */
export function buildSegments(participants: WheelParticipant[], palette: string[] = PALETTE): Segment[] {
  const total = participants.reduce((sum, p) => sum + p.weight, 0);
  if (total === 0) return [];
  let cursor = 0;
  return participants.map((p, i) => {
    const span = (p.weight / total) * TWO_PI;
    const seg = { start: cursor, end: cursor + span, color: palette[i % palette.length] };
    cursor += span;
    return seg;
  });
}

/** Выбирает индекс участника случайно с учётом весов. */
export function pickWeightedIndex(participants: WheelParticipant[]): number {
  const total = participants.reduce((sum, p) => sum + p.weight, 0);
  let r = Math.random() * total;
  let index = participants.length - 1;
  for (let i = 0; i < participants.length; i++) {
    r -= participants[i].weight;
    if (r <= 0) {
      index = i;
      break;
    }
  }
  return index;
}

/** Целое вращение с полными оборотами, чтобы центр сектора встал под указатель. */
export function computeTargetRotation(currentRotation: number, segment: Segment, fullTurns = 4): number {
  const centerLocal = (segment.start + segment.end) / 2;
  const targetMod = (((POINTER_ANGLE - centerLocal) % TWO_PI) + TWO_PI) % TWO_PI;
  const currentMod = ((currentRotation % TWO_PI) + TWO_PI) % TWO_PI;
  let delta = targetMod - currentMod;
  if (delta < 0) delta += TWO_PI;
  const turns = fullTurns + Math.floor(Math.random() * 4);
  return currentRotation + turns * TWO_PI + delta;
}

/** Плавное замедление (ease-out cubic) для анимации спина. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}