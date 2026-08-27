import { describe, expect, it } from 'vitest';
import { computeElimination, nextAutoAction, selectPodium } from './model';
import { EMPTY_PODIUM } from './constants';
import type { Participant } from './types';

function mk(id: string, name: string, enabled = true): Participant {
  return { id, name, weight: 1, enabled };
}

const roster = [mk('a', 'Аня'), mk('b', 'Боря'), mk('c', 'Витя'), mk('d', 'Гена')];

describe('computeElimination', () => {
  it('добавляет выбывшего в список выбывших и не трогает enabled', () => {
    const out = computeElimination(roster, [], 'a', 'Аня');
    expect(out.eliminatedIds).toEqual(['a']);
    expect(out.stillActive).toBe(3);
    expect(out.lastResult).toBe('Выбит: Аня');
    expect(roster.every((p) => p.enabled)).toBe(true);
  });

  it('при двух оставшихся объявляет 3-е место', () => {
    const out = computeElimination(roster, ['a'], 'b', 'Боря');
    expect(out.stillActive).toBe(2);
    expect(out.lastResult).toBe('3 место: Боря');
  });

  it('при одном оставшемся объявляет победителя', () => {
    const out = computeElimination(roster, ['a', 'b'], 'c', 'Витя');
    expect(out.stillActive).toBe(1);
    expect(out.lastResult).toBe('1 место: Гена 🏆');
  });

  it('не считает выключенных вручную активными', () => {
    const withOff = [mk('a', 'Аня'), mk('b', 'Боря'), mk('c', 'Витя', false)];
    const out = computeElimination(withOff, [], 'a', 'Аня');
    expect(out.stillActive).toBe(1);
    expect(out.lastResult).toBe('1 место: Боря 🏆');
  });

  it('сообщает, что выбыли все', () => {
    const out = computeElimination(roster, ['a', 'b', 'c'], 'd', 'Гена');
    expect(out.stillActive).toBe(0);
    expect(out.lastResult).toBe('Все выбыли');
  });
});

describe('selectPodium', () => {
  it('пуст, пока никто не выбыл', () => {
    expect(selectPodium(roster, [])).toEqual(EMPTY_PODIUM);
  });

  it('пуст, пока активных больше двух', () => {
    expect(selectPodium(roster, ['a'])).toEqual(EMPTY_PODIUM);
  });

  it('при двух оставшихся отдаёт 3-е место последнему выбитому', () => {
    expect(selectPodium(roster, ['a', 'b'])).toEqual([null, null, 'b']);
  });

  it('при одном оставшемся отдаёт все три места по id', () => {
    expect(selectPodium(roster, ['a', 'b', 'c'])).toEqual(['d', 'c', 'b']);
  });

  it('на двоих участников заполняет только золото и серебро', () => {
    const duo = [mk('a', 'Аня'), mk('b', 'Боря')];
    expect(selectPodium(duo, ['a'])).toEqual(['b', 'a', null]);
  });

  it('различает тёзок — подиум по id, а не по имени', () => {
    const twins = [mk('a', 'Аня'), mk('b', 'Аня'), mk('c', 'Витя')];
    expect(selectPodium(twins, ['c', 'b'])).toEqual(['a', 'b', 'c']);
  });

  it('пересчитывается, когда участника выключили вручную посреди раунда', () => {
    // Выбыл только «a», но «d» выключили 🙈 → активных двое, бронза уже определена.
    const withOff = [mk('a', 'Аня'), mk('b', 'Боря'), mk('c', 'Витя'), mk('d', 'Гена', false)];
    expect(selectPodium(withOff, ['a'])).toEqual([null, null, 'a']);
  });
});

describe('nextAutoAction', () => {
  it('останавливает режим, когда остался победитель', () => {
    expect(nextAutoAction(1, true, true)).toBe('stop');
  });

  it('останавливает режим, когда выбыли все', () => {
    expect(nextAutoAction(0, true, true)).toBe('stop');
  });

  it('планирует следующий спин, пока серия идёт', () => {
    expect(nextAutoAction(3, true, true)).toBe('schedule');
  });

  it('ничего не делает, если режим выключили посреди спина', () => {
    expect(nextAutoAction(3, false, true)).toBe('idle');
    expect(nextAutoAction(3, true, false)).toBe('idle');
  });
});
