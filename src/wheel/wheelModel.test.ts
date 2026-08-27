import { describe, expect, it } from 'vitest';
import { buildSegments, easeOutCubic, pickWeightedIndex, POINTER_ANGLE, TWO_PI } from './wheelModel';
import type { WheelParticipant } from '../game/types';

const w = (id: string, name: string, weight: number): WheelParticipant => ({ id, name, weight });

describe('buildSegments', () => {
  it('сегменты пропорциональны весам и занимают весь круг', () => {
    const segments = buildSegments([w('1', 'А', 1), w('2', 'Б', 3)]);
    expect(segments).toHaveLength(2);
    expect(segments[0].end - segments[0].start).toBeCloseTo(TWO_PI * 0.25);
    expect(segments[1].end - segments[1].start).toBeCloseTo(TWO_PI * 0.75);
    // последний сегмент заканчивается на полном обороте
    expect(segments[1].end).toBeCloseTo(TWO_PI);
  });

  it('с пустым списком возвращает []', () => {
    expect(buildSegments([])).toEqual([]);
  });
});

describe('easeOutCubic', () => {
  it('края: t=0 -> 0, t=1 -> 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });
  it('монотонно растёт между краями', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(easeOutCubic(0.25));
  });
});

describe('POINTER_ANGLE', () => {
  it('указатель на 12 часах', () => {
    expect(POINTER_ANGLE).toBe(-Math.PI / 2);
  });
});

describe('pickWeightedIndex — честный рандом', () => {
  const N = 60000;

  it('равные веса дают примерно равное распределение', () => {
    const list = [w('1', 'А', 1), w('2', 'Б', 1), w('3', 'В', 1)];
    const counts = [0, 0, 0];
    for (let i = 0; i < N; i++) {
      counts[pickWeightedIndex(list)]++;
    }
    for (const c of counts) {
      const p = c / N;
      expect(p).toBeGreaterThan(0.31); // ~1/3 ≈ 0.333
      expect(p).toBeLessThan(0.36);
    }
  });

  it('веса 1:3 дают вероятности ~0.25 и ~0.75', () => {
    const list = [w('1', 'А', 1), w('2', 'Б', 3)];
    let c0 = 0;
    for (let i = 0; i < N; i++) {
      if (pickWeightedIndex(list) === 0) c0++;
    }
    const p0 = c0 / N;
    expect(p0).toBeGreaterThan(0.23);
    expect(p0).toBeLessThan(0.27); // ожидается 0.25
  });

  it('один участник выбирается всегда', () => {
    const list = [w('1', 'А', 2)];
    for (let i = 0; i < 100; i++) {
      expect(pickWeightedIndex(list)).toBe(0);
    }
  });
});