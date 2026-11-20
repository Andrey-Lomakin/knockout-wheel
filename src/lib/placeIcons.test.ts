import { describe, expect, it } from 'vitest';
import { FROG_DAY, getPlaceIcon } from './placeIcons';

describe('placeIcons', () => {
  it('заменяет жабой только первое место по средам', () => {
    const wednesday = new Date(2026, 10, 18, 12);
    expect(FROG_DAY).toBe(3);
    expect(getPlaceIcon(1, wednesday)).toBe('🐸');
    expect(getPlaceIcon(2, wednesday)).toBe('🥈');
    expect(getPlaceIcon(3, wednesday)).toBe('🥉');
  });

  it('в остальные дни возвращает обычные медали', () => {
    const friday = new Date(2026, 10, 20, 12);
    expect(getPlaceIcon(1, friday)).toBe('🥇');
    expect(getPlaceIcon(2, friday)).toBe('🥈');
    expect(getPlaceIcon(3, friday)).toBe('🥉');
  });
});
