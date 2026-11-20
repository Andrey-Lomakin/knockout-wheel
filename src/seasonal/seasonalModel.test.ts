import { describe, expect, it } from 'vitest';
import { getSeasonalTheme } from './seasonalModel';

describe('seasonalModel', () => {
  it.each([
    [new Date(2026, 10, 30), 0],
    [new Date(2026, 11, 1), 1],
    [new Date(2026, 11, 5), 1],
    [new Date(2026, 11, 6), 2],
    [new Date(2026, 11, 11), 3],
    [new Date(2026, 11, 16), 4],
    [new Date(2026, 11, 21), 5],
    [new Date(2026, 11, 26), 6],
    [new Date(2026, 11, 30), 6],
    [new Date(2026, 11, 31), 7],
    [new Date(2027, 0, 1), 5],
    [new Date(2027, 0, 6), 3],
    [new Date(2027, 0, 11), 2],
    [new Date(2027, 0, 16), 1],
    [new Date(2027, 0, 20), 1],
    [new Date(2027, 0, 21), 0],
  ])('вычисляет уровень украшений для %s', (date, level) => {
    expect(getSeasonalTheme(date).level).toBe(level);
  });

  it('на 31 декабря включает максимум снега и салют', () => {
    const theme = getSeasonalTheme(new Date(2026, 11, 31));
    expect(theme.snowflakes).toBe(64);
    expect(theme.fireworks).toBe(true);
    expect(theme.garland).toBe('gold');
  });
});
