import { describe, expect, it } from 'vitest';
import {
  buildSegments,
  computeTargetRotation,
  dropoutShares,
  fullTurnsFor,
  pickWeightedIndex,
  POINTER_ANGLE,
  spinEase,
  TWO_PI,
} from './wheelModel';
import type { WheelParticipant } from '../game/types';

const w = (id: string, name: string, weight: number): WheelParticipant => ({ id, name, weight });
const norm = (angle: number) => ((angle % TWO_PI) + TWO_PI) % TWO_PI;

describe('dropoutShares — доли на выбывание', () => {
  it('при равных весах доли равны', () => {
    const shares = dropoutShares([w('1', 'А', 1), w('2', 'Б', 1), w('3', 'В', 1)]);
    for (const share of shares) expect(share).toBeCloseTo(1 / 3);
  });

  it('множитель работает буквально: у ×2 доля ровно вдвое меньше, чем у ×1', () => {
    const [a, b, c] = dropoutShares([w('1', 'А', 1), w('2', 'Б', 1), w('3', 'В', 2)]);
    expect(a).toBeCloseTo(0.4);
    expect(b).toBeCloseTo(0.4);
    expect(c).toBeCloseTo(0.2);
    expect(c).toBeCloseTo(a / 2);
  });

  it('×3 — треть доли ×1', () => {
    const [a, b] = dropoutShares([w('1', 'А', 1), w('2', 'Б', 3)]);
    expect(b).toBeCloseTo(a / 3);
  });

  it('доли нормированы: в сумме единица', () => {
    const shares = dropoutShares([w('1', 'А', 1), w('2', 'Б', 1.4), w('3', 'В', 2), w('4', 'Г', 3)]);
    expect(shares.reduce((sum, s) => sum + s, 0)).toBeCloseTo(1);
  });

  it('единственный участник занимает весь круг', () => {
    expect(dropoutShares([w('1', 'А', 2)])).toEqual([1]);
  });
});

describe('buildSegments', () => {
  it('сегменты пропорциональны шансу вылететь и занимают весь круг', () => {
    const segments = buildSegments([w('1', 'А', 1), w('2', 'Б', 3)]);
    expect(segments).toHaveLength(2);
    // Тяжёлому достаётся узкий сектор: (1 - 3/4) / 1 = 0.25.
    expect(segments[0].end - segments[0].start).toBeCloseTo(TWO_PI * 0.75);
    expect(segments[1].end - segments[1].start).toBeCloseTo(TWO_PI * 0.25);
    expect(segments[1].end).toBeCloseTo(TWO_PI);
  });

  it('с пустым списком возвращает []', () => {
    expect(buildSegments([])).toEqual([]);
  });
});

describe('spinEase', () => {
  it('края: t=0 -> 0, t=1 -> 1', () => {
    expect(spinEase(0)).toBe(0);
    expect(spinEase(1)).toBe(1);
  });

  it('монотонно растёт', () => {
    let prev = 0;
    for (let t = 0.05; t <= 1; t += 0.05) {
      const value = spinEase(t);
      expect(value).toBeGreaterThan(prev);
      prev = value;
    }
  });

  it('стартует с разгона, а не на полной скорости', () => {
    // У ease-out за первые 10% времени прошло бы 27% пути, здесь — заметно меньше.
    expect(spinEase(0.1)).toBeLessThan(0.2);
    // Зато к трети времени основная часть пути позади — дальше долгий выкат.
    expect(spinEase(0.3)).toBeGreaterThan(0.7);
  });
});

describe('fullTurnsFor', () => {
  it('обороты растут с длительностью (270°/сек)', () => {
    expect(fullTurnsFor(3)).toBe(2);
    expect(fullTurnsFor(5)).toBe(4);
    expect(fullTurnsFor(15)).toBe(11);
  });

  it('никогда не меньше одного оборота', () => {
    expect(fullTurnsFor(0)).toBe(1);
  });
});

describe('computeTargetRotation', () => {
  const segment = { start: 0, end: TWO_PI / 4, color: '#000' };

  it('останавливается внутри сектора, а не строго в центре', () => {
    const stops = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const target = computeTargetRotation(0, segment, 5);
      // Точка, оказавшаяся под указателем после поворота.
      const underPointer = norm(POINTER_ANGLE - target);
      expect(underPointer).toBeGreaterThanOrEqual(segment.start);
      expect(underPointer).toBeLessThanOrEqual(segment.end);
      stops.add(Number(underPointer.toFixed(4)));
    }
    // Разброс есть: попадания не сходятся в одну точку.
    expect(stops.size).toBeGreaterThan(150);
  });

  it('не встаёт вплотную к границе сектора', () => {
    const span = segment.end - segment.start;
    for (let i = 0; i < 200; i++) {
      const underPointer = norm(POINTER_ANGLE - computeTargetRotation(0, segment, 5));
      expect(underPointer - segment.start).toBeGreaterThan(span * 0.05);
      expect(segment.end - underPointer).toBeGreaterThan(span * 0.05);
    }
  });

  it('крутит вперёд и тем дольше, чем длиннее спин', () => {
    const short = computeTargetRotation(0, segment, 3);
    const long = computeTargetRotation(0, segment, 15);
    expect(short).toBeGreaterThan(0);
    expect(long).toBeGreaterThan(short + 5 * TWO_PI);
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

  it('веса 1:3 дают шансы вылететь ~0.75 и ~0.25 — тяжёлый защищён', () => {
    const list = [w('1', 'А', 1), w('2', 'Б', 3)];
    let c0 = 0;
    for (let i = 0; i < N; i++) {
      if (pickWeightedIndex(list) === 0) c0++;
    }
    const p0 = c0 / N;
    expect(p0).toBeGreaterThan(0.73);
    expect(p0).toBeLessThan(0.77); // ожидается 0.75
  });

  it('один участник выбирается всегда', () => {
    const list = [w('1', 'А', 2)];
    for (let i = 0; i < 100; i++) {
      expect(pickWeightedIndex(list)).toBe(0);
    }
  });

  it('на дистанции тяжёлый выигрывает чаще своей доли веса — известный перекос `1/вес`', () => {
    const list = [w('1', 'А', 1), w('2', 'Б', 1), w('3', 'В', 2)];
    const runs = 20000;
    let heavyWins = 0;

    for (let i = 0; i < runs; i++) {
      const rest = [...list];
      while (rest.length > 1) rest.splice(pickWeightedIndex(rest), 1);
      if (rest[0].id === '3') heavyWins++;
    }

    // Доля веса ×2 при сумме 4 — 50%, но последовательное выбивание даёт ему больше.
    // Это цена наглядных секторов; формула pointauc дала бы ровно 50% (см. dropoutShares).
    expect(heavyWins / runs).toBeGreaterThan(0.5);
    expect(heavyWins / runs).toBeLessThan(0.58);
  });
});

describe('POINTER_ANGLE', () => {
  it('указатель на 12 часах', () => {
    expect(POINTER_ANGLE).toBe(-Math.PI / 2);
  });
});
