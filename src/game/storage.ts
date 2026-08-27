import { DEFAULT_WEIGHT, STORAGE_KEY } from './constants';
import type { Participant, Weight } from './types';

export interface PersistedState {
  participants: Participant[];
}

/**
 * Что реально уезжает в хранилище. Вес НЕ персистится: это настройка конкретного раунда,
 * а не свойство человека — новый запуск начинается со всех ×1.
 */
type StoredParticipant = Pick<Participant, 'id' | 'name' | 'enabled'>;

/** Читает список участников из localStorage (безопасно). */
export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { participants: [] };
    const parsed = JSON.parse(raw) as { participants?: StoredParticipant[] };
    return {
      participants: Array.isArray(parsed.participants)
        ? parsed.participants.map((p) => ({
            id: p.id,
            name: p.name,
            enabled: p.enabled !== false,
            weight: DEFAULT_WEIGHT,
          }))
        : [],
    };
  } catch {
    return { participants: [] };
  }
}

/** Пишет список участников в localStorage (безопасно). */
export function persistState({ participants }: PersistedState): void {
  try {
    const stored: StoredParticipant[] = participants.map(({ id, name, enabled }) => ({ id, name, enabled }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ participants: stored }));
  } catch {
    // Хранилище может быть недоступно (private mode / квота) — игнорируем.
  }
}

/**
 * Уникальный id участника. `crypto.randomUUID` есть только в защищённом контексте (https/localhost),
 * поэтому для http-страниц оставлен запасной вариант.
 */
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `p-${Math.random().toString(36).slice(2)}-${performance.now().toString(36)}`;
}

/** Создаёт нового участника с уникальным id и весом по умолчанию. */
export function createEntry(name: string, weight: Weight = DEFAULT_WEIGHT): Participant {
  return { id: newId(), name, weight, enabled: true };
}
