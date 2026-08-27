import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWheelGame } from './useWheelGame';
import { AUTO_SPIN_PAUSE_MS, STORAGE_KEY } from './constants';
import type { Participant } from './types';

// Конфетти дёргает canvas, которого в jsdom нет, — и к логике игры отношения не имеет.
vi.mock('../lib/confetti', () => ({
  celebrateWinner: vi.fn(),
  celebratePlace: vi.fn(),
}));

type Game = ReturnType<typeof useWheelGame>;
type Rendered = { current: Game };

function setup(names: string[]) {
  const view = renderHook(() => useWheelGame());
  act(() => view.result.current.addParticipants(names));
  return view;
}

/** Выбивает участника по имени так же, как это делает колесо в конце спина. */
function knockOut(result: Rendered, name: string) {
  const target = result.current.wheelParticipants.find((p) => p.name === name);
  expect(target, `«${name}» нет в колесе`).toBeDefined();
  act(() => result.current.handleSpinEnd(target!));
}

/** Подиум хранит id — для читаемости проверок переводим его в имена. */
function podiumNames(result: Rendered): (string | null)[] {
  return result.current.podium.map(
    (id) => result.current.participants.find((p) => p.id === id)?.name ?? null,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useWheelGame — список и персистентность', () => {
  it('добавляет участников и сохраняет их в localStorage', () => {
    const { result } = setup(['Аня', 'Боря']);

    expect(result.current.participants.map((p) => p.name)).toEqual(['Аня', 'Боря']);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as { participants: Participant[] };
    expect(saved.participants.map((p) => p.name)).toEqual(['Аня', 'Боря']);
    expect(saved.participants.every((p) => p.enabled)).toBe(true);
    // Вес — настройка раунда, в хранилище его нет вовсе.
    expect(saved.participants.every((p) => p.weight === undefined)).toBe(true);
  });

  it('не сохраняет вес — после перезагрузки все снова ×1', () => {
    const { result, unmount } = setup(['Аня', 'Боря']);
    const anya = result.current.participants.find((p) => p.name === 'Аня')!;
    act(() => result.current.setWeight(anya.id, 2));
    expect(result.current.participants.find((p) => p.name === 'Аня')!.weight).toBe(2);
    unmount();

    const second = renderHook(() => useWheelGame());
    expect(second.result.current.participants.every((p) => p.weight === 1)).toBe(true);
  });

  it('выдаёт участникам уникальные id', () => {
    const { result } = setup(['Аня', 'Аня', 'Аня']);
    const ids = new Set(result.current.participants.map((p) => p.id));
    expect(ids.size).toBe(3);
  });

  it('сохраняет выключенное 🙈 состояние — после перезагрузки его не надо ставить заново', () => {
    const { result, unmount } = setup(['Аня', 'Боря']);
    const boris = result.current.participants.find((p) => p.name === 'Боря')!;
    act(() => result.current.toggleEnabled(boris.id));
    unmount();

    const second = renderHook(() => useWheelGame());
    const restored = second.result.current.participants.find((p) => p.name === 'Боря')!;
    expect(restored.enabled).toBe(false);
    // Выключенный не попадает в колесо, но остаётся в списке.
    expect(second.result.current.participants).toHaveLength(2);
    expect(second.result.current.wheelParticipants.map((p) => p.name)).toEqual(['Аня']);
  });

  it('не сохраняет выбывших — после перезагрузки все снова активны', () => {
    const { result, unmount } = setup(['Аня', 'Боря', 'Витя']);
    knockOut(result, 'Аня');
    unmount();

    const second = renderHook(() => useWheelGame());
    expect(second.result.current.eliminatedIds).toEqual([]);
    expect(second.result.current.wheelParticipants).toHaveLength(3);
  });
});

describe('useWheelGame — выбивание и подиум', () => {
  it('выбивает участника, не трогая enabled', () => {
    const { result } = setup(['Аня', 'Боря', 'Витя', 'Гена']);
    knockOut(result, 'Аня');

    expect(result.current.lastResult).toBe('Выбит: Аня');
    expect(result.current.wheelParticipants.map((p) => p.name)).toEqual(['Боря', 'Витя', 'Гена']);
    expect(result.current.participants.every((p) => p.enabled)).toBe(true);
  });

  it('заполняет подиум по ходу раунда', () => {
    const { result } = setup(['Аня', 'Боря', 'Витя', 'Гена']);

    knockOut(result, 'Аня');
    expect(podiumNames(result)).toEqual([null, null, null]);

    knockOut(result, 'Боря');
    expect(result.current.lastResult).toBe('3 место: Боря');
    expect(podiumNames(result)).toEqual([null, null, 'Боря']);

    knockOut(result, 'Витя');
    expect(result.current.lastResult).toBe('1 место: Гена 🏆');
    expect(podiumNames(result)).toEqual(['Гена', 'Витя', 'Боря']);
  });

  it('не отдаёт медаль тёзке — подиум по id', () => {
    const { result } = setup(['Аня', 'Аня']);
    knockOut(result, 'Аня');

    const [first, second] = result.current.participants;
    // Выбили первую «Аню» — золото у второй, серебро у первой, и это разные id.
    expect(result.current.podium).toEqual([second.id, first.id, null]);
  });

  it('пересчитывает подиум, когда участника выключили вручную', () => {
    const { result } = setup(['Аня', 'Боря', 'Витя']);
    knockOut(result, 'Аня');
    expect(podiumNames(result)).toEqual([null, null, 'Аня']);

    const boris = result.current.participants.find((p) => p.name === 'Боря')!;
    act(() => result.current.toggleEnabled(boris.id));

    // Остался один активный — подиум достроился сам, без спина.
    expect(podiumNames(result)).toEqual(['Витя', 'Аня', null]);
  });

  it('«Новый раунд» сбрасывает выбывших и медали, но не список', () => {
    const { result } = setup(['Аня', 'Боря', 'Витя']);
    knockOut(result, 'Аня');

    act(() => result.current.resetRound());

    expect(result.current.eliminatedIds).toEqual([]);
    expect(result.current.podium).toEqual([null, null, null]);
    expect(result.current.lastResult).toBeNull();
    expect(result.current.participants).toHaveLength(3);
  });

  it('удаление участника вычищает его из порядка выбывания', () => {
    const { result } = setup(['Аня', 'Боря', 'Витя']);
    knockOut(result, 'Аня');

    const anya = result.current.participants.find((p) => p.name === 'Аня')!;
    act(() => result.current.remove(anya.id));

    expect(result.current.eliminatedIds).toEqual([]);
  });
});

describe('useWheelGame — авто-прокрутка', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('галочка сама не запускает вращение', () => {
    const { result } = setup(['Аня', 'Боря', 'Витя']);
    const before = result.current.spinSignal;

    act(() => result.current.toggleAuto());

    expect(result.current.autoSpin).toBe(true);
    expect(result.current.autoActive).toBe(false);
    expect(result.current.spinSignal).toBe(before);
  });

  it('серия стартует по кнопке и сама планирует следующий спин', () => {
    const { result } = setup(['Аня', 'Боря', 'Витя']);
    act(() => result.current.toggleAuto());

    act(() => result.current.pressSpin());
    expect(result.current.autoActive).toBe(true);
    const afterPress = result.current.spinSignal;

    knockOut(result, 'Аня');
    expect(result.current.spinSignal).toBe(afterPress);

    act(() => vi.advanceTimersByTime(AUTO_SPIN_PAUSE_MS));
    expect(result.current.spinSignal).toBe(afterPress + 1);
  });

  it('снятая посреди спина галочка останавливает серию — таймер не стреляет', () => {
    const { result } = setup(['Аня', 'Боря', 'Витя']);
    act(() => result.current.toggleAuto());
    act(() => result.current.pressSpin());
    const afterPress = result.current.spinSignal;

    // Пользователь снимает галочку, пока колесо ещё крутится.
    act(() => result.current.toggleAuto());
    knockOut(result, 'Аня');

    act(() => vi.advanceTimersByTime(AUTO_SPIN_PAUSE_MS * 3));

    expect(result.current.autoSpin).toBe(false);
    expect(result.current.autoActive).toBe(false);
    expect(result.current.spinSignal).toBe(afterPress);
  });

  it('на победителе выключает режим и больше не крутит', () => {
    const { result } = setup(['Аня', 'Боря']);
    act(() => result.current.toggleAuto());
    act(() => result.current.pressSpin());
    const afterPress = result.current.spinSignal;

    knockOut(result, 'Аня');

    expect(result.current.autoSpin).toBe(false);
    expect(result.current.autoActive).toBe(false);

    act(() => vi.advanceTimersByTime(AUTO_SPIN_PAUSE_MS * 3));
    expect(result.current.spinSignal).toBe(afterPress);
  });

  it('«Новый раунд» гасит запланированный авто-спин', () => {
    const { result } = setup(['Аня', 'Боря', 'Витя']);
    act(() => result.current.toggleAuto());
    act(() => result.current.pressSpin());
    knockOut(result, 'Аня');

    act(() => result.current.resetRound());
    const afterReset = result.current.spinSignal;

    act(() => vi.advanceTimersByTime(AUTO_SPIN_PAUSE_MS * 3));
    expect(result.current.spinSignal).toBe(afterReset);
    expect(result.current.autoSpin).toBe(false);
  });
});
