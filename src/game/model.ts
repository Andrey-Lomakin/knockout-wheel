import type { Participant, Podium } from './types';

export interface EliminationOutcome {
  /** Полный список выбывших с учётом только что выбитого. */
  eliminatedIds: string[];
  /** Сколько активных (включённых и не выбывших) осталось после выбытия. */
  stillActive: number;
  /** Строка-результат для отображения. */
  lastResult: string;
  /** Обновлённый подиум. */
  podium: Podium;
}

/**
 * Чистая логика одного акта выбивания: добавляет победителя в выбывшие,
 * считает оставшихся активных и заполняет результат/подиум.
 * Не совершает побочных эффектов (конфетти) — их триггерит хук по `stillActive`.
 */
export function computeElimination(
  participants: Participant[],
  prevEliminated: string[],
  prevPodium: Podium,
  winnerId: string,
  winnerName: string,
): EliminationOutcome {
  const eliminatedIds = [...prevEliminated, winnerId];
  const stillActive = participants.filter((e) => e.enabled && !eliminatedIds.includes(e.id)).length;

  let podium: Podium = prevPodium;
  let lastResult = '';

  if (stillActive === 1) {
    const champ = participants.find((e) => e.enabled && !eliminatedIds.includes(e.id));
    podium = [champ?.name ?? null, winnerName, prevPodium[2]];
    lastResult = `1 место: ${champ?.name} 🏆`;
  } else if (stillActive === 2) {
    podium = [prevPodium[0], prevPodium[1], winnerName];
    lastResult = `3 место: ${winnerName}`;
  } else if (stillActive === 0) {
    lastResult = 'Все выбыли';
  } else {
    lastResult = `Выбит: ${winnerName}`;
  }

  return { eliminatedIds, stillActive, lastResult, podium };
}