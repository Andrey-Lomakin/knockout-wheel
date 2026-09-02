import { describe, expect, it } from 'vitest';
import { clampWeight, formatWeight, stepWeight } from './weights';

describe('clampWeight', () => {
  it('округляет к ближайшему шагу 0.2', () => {
    expect(clampWeight(1.17)).toBe(1.2);
    expect(clampWeight(1.25)).toBe(1.2);
    expect(clampWeight(2.44)).toBe(2.4);
  });

  it('не даёт ошибок плавающей точки', () => {
    expect(clampWeight(1.4)).toBe(1.4);
    expect(clampWeight(7 * 0.2)).toBe(1.4);
  });

  it('зажимает в [1, 3]', () => {
    expect(clampWeight(0.5)).toBe(1);
    expect(clampWeight(5)).toBe(3);
    expect(clampWeight(-2)).toBe(1);
  });
});

describe('stepWeight', () => {
  it('двигает вес на дельту шагов от текущего', () => {
    expect(stepWeight(1, 1)).toBe(1.2);
    expect(stepWeight(1.4, -1)).toBe(1.2);
    expect(stepWeight(1, 5)).toBe(2);
  });

  it('не выходит за границы', () => {
    expect(stepWeight(1, -1)).toBe(1);
    expect(stepWeight(3, 1)).toBe(3);
  });
});

describe('formatWeight', () => {
  it('форматирует целые и дробные значения', () => {
    expect(formatWeight(1)).toBe('x1');
    expect(formatWeight(1.2)).toBe('x1.2');
    expect(formatWeight(2)).toBe('x2');
    expect(formatWeight(3)).toBe('x3');
  });

  it('чинит ошибки плавающей точки', () => {
    expect(formatWeight(1.4000000000000001)).toBe('x1.4');
    expect(formatWeight(2.2)).toBe('x2.2');
  });
});
