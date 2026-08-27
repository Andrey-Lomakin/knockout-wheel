import { STORAGE_KEY } from './constants';
import type { Participant, Weight } from './types';

export interface PersistedState {
  participants: Participant[];
}

/** Читает список участников из localStorage (безопасно). */
export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { participants: [] };
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      participants: Array.isArray(parsed.participants)
        ? parsed.participants.map((p) => ({ ...p, enabled: p.enabled !== false }))
        : [],
    };
  } catch {
    return { participants: [] };
  }
}

/** Пишет список участников в localStorage (безопасно). */
export function persistState({ participants }: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ participants }));
  } catch {
    // Хранилище может быть недоступно (private mode / квота) — игнорируем.
  }
}

/** Максимальный числовой суффикс id — для продолжения генерации без дублей. */
function deriveNextId(participants: Participant[]): number {
  return participants.reduce((max, p) => {
    const n = Number(p.id.replace(/\D/g, ''));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
}

let idCounter = 0;

/** Синхронизирует счётчик id после загрузки списка. */
export function restoreIdCounter(participants: Participant[]): void {
  idCounter = deriveNextId(participants);
}

/** Создаёт нового участника с уникальным id и весом по умолчанию. */
export function createEntry(name: string, weight: Weight = 1): Participant {
  return { id: `p${++idCounter}`, name, weight, enabled: true };
}