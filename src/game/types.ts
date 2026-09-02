/** Вес участника — множитель размера сегмента, то есть шанса вылететь (диапазон и шаг — в constants). */
export type Weight = number;

/** Участник из списка. `enabled` — ручной переключатель «участвует ли в колесе» (персистится). */
export interface Participant {
  id: string;
  name: string;
  weight: Weight;
  enabled: boolean;
}

/**
 * Подиум: [1-е, 2-е, 3-е места] по **id** участников (или null, если место ещё не занято).
 * Именно id, а не имена: тёзки не делят медаль, переименование её не теряет.
 */
export type Podium = [string | null, string | null, string | null];

/** Данные, которые потребляет canvas-колесо. */
export interface WheelParticipant {
  id: string;
  name: string;
  weight: number;
}
