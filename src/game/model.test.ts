import { describe, expect, it } from 'vitest';
import { computeElimination } from './model';
import { EMPTY_PODIUM } from './constants';
import type { Participant } from './types';

function mk(id: string, name: string, enabled = true): Participant {
  return { id, name, weight: 1, enabled };
}

const roster = [mk('a', 'Аня'), mk('b', 'Боря'), mk('c', 'Витя'), mk('d', 'Гена')];

describe('computeElimination', () => {
  it('добавляет выбывшего в список выбывших и не трогает enabled', () => {
    const out = computeElimination(roster, [], EMPTY_PODIUM, 'a', 'Аня');
    expect(out.eliminatedIds).toEqual(['a']);
    expect(out.stillActive).toBe(3);
    expect(out.lastResult).toBe('Выбит: Аня');
  });

  it('при 1 оставшемся ставит 1-е и 2-е места', () => {
    // К этому моменту выбыли a, b, c — остаётся только d.
    const prev: string[] = ['a', 'b', 'c'];
    const out = computeElimination(roster, prev, EMPTY_PODIUM, 'c', 'Витя');
    expect(out.stillActive).toBe(1);
    expect(out.podium[0]).toBe('Гена');
    expect(out.podium[1]).toBe('Витя');
    expect(out.lastResult).toBe('1 место: Гена 🏆');
  });

  it('при 2 оставшихся выбывший получает 3-е место', () => {
    const prev: string[] = ['a'];
    const out = computeElimination(roster, prev, EMPTY_PODIUM, 'b', 'Боря');
    expect(out.stillActive).toBe(2);
    expect(out.podium[2]).toBe('Боря');
    expect(out.lastResult).toBe('3 место: Боря');
  });

  it('при 0 оставшихся (выбыли все) — результат «Все выбыли»', () => {
    const prev: string[] = ['a', 'b', 'c', 'd'];
    const out = computeElimination(roster, prev, EMPTY_PODIUM, 'd', 'Гена');
    expect(out.stillActive).toBe(0);
    expect(out.lastResult).toBe('Все выбыли');
  });
});