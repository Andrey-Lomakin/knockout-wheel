import { EMPTY_PODIUM } from './constants';
import type { Participant, Podium } from './types';

export interface EliminationOutcome {
  /** Полный список выбывших с учётом только что выбитого (в порядке выбывания). */
  eliminatedIds: string[];
  /** Сколько активных (включённых и не выбывших) осталось после выбытия. */
  stillActive: number;
  /** Строка-результат для отображения. */
  lastResult: string;
}

/** Активные: включены вручную и ещё не выбыли. */
function selectActive(participants: Participant[], eliminatedIds: string[]): Participant[] {
  const out = new Set(eliminatedIds);
  return participants.filter((p) => p.enabled && !out.has(p.id));
}

/**
 * Чистая логика одного акта выбивания: добавляет выбитого в список выбывших,
 * считает оставшихся активных и формирует строку результата.
 * Не совершает побочных эффектов (конфетти) — их триггерит хук по `stillActive`.
 */
export function computeElimination(
  participants: Participant[],
  prevEliminated: string[],
  winnerId: string,
  winnerName: string,
): EliminationOutcome {
  const eliminatedIds = [...prevEliminated, winnerId];
  const active = selectActive(participants, eliminatedIds);
  const stillActive = active.length;

  let lastResult: string;
  if (stillActive === 1) {
    lastResult = `1 место: ${active[0].name} 🏆`;
  } else if (stillActive === 2) {
    lastResult = `3 место: ${winnerName}`;
  } else if (stillActive === 0) {
    lastResult = 'Все выбыли';
  } else {
    lastResult = `Выбит: ${winnerName}`;
  }

  return { eliminatedIds, stillActive, lastResult };
}

/**
 * Подиум как ЧИСТАЯ выборка из состава и порядка выбывания — отдельного состояния нет.
 * Благодаря этому подиум самовосстанавливается: изменение `enabled` по ходу раунда
 * пересчитывает места, а не оставляет их в устаревшем виде.
 *
 * - остался один активный → он 1-е место, последний выбитый — 2-е, предыдущий — 3-е;
 * - осталось двое → последний выбитый уже занял 3-е место;
 * - иначе мест ещё нет.
 *
 * Хранит **id**, а не имена: тёзки не получают чужую медаль, переименование её не ломает.
 */
export function selectPodium(participants: Participant[], eliminatedIds: string[]): Podium {
  if (eliminatedIds.length === 0) return EMPTY_PODIUM;

  const active = selectActive(participants, eliminatedIds);
  const lastOut = eliminatedIds[eliminatedIds.length - 1] ?? null;
  const prevOut = eliminatedIds[eliminatedIds.length - 2] ?? null;

  if (active.length === 1) return [active[0].id, lastOut, prevOut];
  if (active.length === 2) return [null, null, lastOut];
  return EMPTY_PODIUM;
}

/** Что делать с авто-прокруткой после окончания спина. */
export type AutoAction = 'schedule' | 'stop' | 'idle';

/**
 * Чистое решение по авто-прокрутке: продолжать серию, остановить режим или ничего не делать.
 * Вынесено из хука, чтобы «не останавливающийся авто-спин» ловился тестом, а не руками.
 */
export function nextAutoAction(stillActive: number, autoEnabled: boolean, autoRunning: boolean): AutoAction {
  if (stillActive <= 1) return 'stop';
  return autoEnabled && autoRunning ? 'schedule' : 'idle';
}
