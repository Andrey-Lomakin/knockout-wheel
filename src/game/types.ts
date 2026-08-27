/** Вес участника — множитель размера/шанса сегмента колеса. */
export type Weight = 1 | 2;

/** Участник из списка. `enabled` — ручной переключатель «участвует ли в колесе» (персистится). */
export interface Participant {
  id: string;
  name: string;
  weight: Weight;
  enabled: boolean;
}

/** Подиум: [1-е, 2-е, 3-е места] по именам (или null, если ещё не определено). */
export type Podium = [string | null, string | null, string | null];

/** Данные, которые потребляет canvas-колесо. */
export interface WheelParticipant {
  id: string;
  name: string;
  weight: number;
}