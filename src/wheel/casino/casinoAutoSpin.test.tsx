import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWheelGame } from '../../game/useWheelGame';
import { AUTO_SPIN_PAUSE_MS } from '../../game/constants';
import WheelStage from '../WheelStage';
import { CASINO_CONFIG } from './casinoConfig';

/**
 * Сквозной сценарий: настоящий `useWheelGame` + настоящее колесо.
 * Нужен, потому что казино зависит от `activeCount`, который при авто-прокрутке
 * меняется только по ходу серии — на изолированном `Wheel` это не проверить.
 */

// Мемы тянутся fetch-ем из public/ — в тестах список пустой, как в Wheel.test.tsx.
vi.mock('../../lib/memes', () => ({
  getMemeVideos: () => Promise.resolve([] as string[]),
  pickRandomVideo: (list: string[]) => list[0],
}));

vi.mock('../../lib/confetti', () => ({
  celebrateWinner: vi.fn(),
  celebratePlace: vi.fn(),
}));

let game: ReturnType<typeof useWheelGame>;

function Harness() {
  game = useWheelGame();
  return (
    <WheelStage
      participants={game.wheelParticipants}
      activeCount={game.activeCount}
      spinning={game.spinning}
      durationSec={game.spinDuration}
      spinDuration={game.spinDuration}
      lastResult={game.lastResult}
      autoSpin={game.autoSpin}
      autoRunning={game.autoActive}
      spinSignal={game.spinSignal}
      roundRevision={game.roundRevision}
      lastOut={game.lastOut}
      dimmedId={game.pendingOutId}
      onDurationChange={game.setSpinDuration}
      onAutoChange={game.toggleAuto}
      onSpinRequest={game.pressSpin}
      onSpinStart={game.handleSpinStart}
      onSpinEnd={game.handleSpinEnd}
      onResetRound={game.resetRound}
    />
  );
}

// Один спин тратит random на СТАРТЕ, а не на остановке: выбор сектора, точка внутри сектора,
// решение о казино (только при двух активных), джекпот (только при казино).
// Поэтому очередь выставляем на каждый спин отдельно и ДО его запуска —
// до pressSpin/nextAutoSpin/паузы джекпота. И только после addParticipants:
// запасной newId() в jsdom тоже берёт Math.random.
// Дефолт 0.9 — за пределами обоих порогов: забытая очередь не включит казино случайно.
let randomQueue: number[] = [];
let now = 0;
const frames: FrameRequestCallback[] = [];

/** Отдаёт кадр анимации время за пределами длительности спина: спин завершается. */
async function finishSpin(durationSec = game.spinDuration) {
  const frame = frames[frames.length - 1];
  if (!frame) throw new Error('Спин не запущен: нет кадра анимации');
  now += durationSec * 1000;
  await act(async () => {
    frame(now);
  });
}

/** Пауза авто-прокрутки: после неё хук сам запрашивает следующий спин. */
async function nextAutoSpin() {
  await act(async () => {
    vi.advanceTimersByTime(AUTO_SPIN_PAUSE_MS);
  });
}

beforeEach(() => {
  localStorage.clear();
  randomQueue = [];
  frames.length = 0;
  now = 0;
  vi.useFakeTimers();
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.spyOn(Math, 'random').mockImplementation(() => randomQueue.shift() ?? 0.9);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function startAutoRound(names: string[]) {
  render(<Harness />);
  await act(async () => {});
  act(() => {
    game.addParticipants(names);
    game.setSpinDuration(3);
  });
  await act(async () => {
    game.toggleAuto();
  });
}

/** Отдельно от startAutoRound: очередь random выставляем уже ПОСЛЕ добавления участников. */
async function pressSpin() {
  await act(async () => {
    game.pressSpin();
  });
}

describe('Казино при авто-прокрутке', () => {
  it('включается на спине с двумя активными и после джекпота доводит серию до чемпиона', async () => {
    await startAutoRound(['Аня', 'Боря', 'Витя', 'Гена']);
    randomQueue = [0, 0.5];
    await pressSpin();

    // Четверо активных: казино недоступно.
    expect(game.activeCount).toBe(4);
    expect(document.querySelector('.casino-layer')).toBeNull();

    await finishSpin();
    expect(game.lastResult).toBe('Выбит: Аня');
    expect(game.activeCount).toBe(3);

    // Трое активных: казино всё ещё недоступно.
    randomQueue = [0, 0.5];
    await nextAutoSpin();
    expect(game.spinSignal).toBe(2);
    expect(document.querySelector('.casino-layer')).toBeNull();

    await finishSpin();
    expect(game.lastResult).toBe('3 место: Боря');
    expect(game.activeCount).toBe(2);

    // Двое активных: авто-прокрутка сама запускает спин, и на нём появляется автомат.
    randomQueue = [0, 0.5, 0.1, 0.1];
    await nextAutoSpin();
    expect(game.spinSignal).toBe(3);
    expect(screen.getByText('LUCKY SPIN')).toBeTruthy();

    await finishSpin();
    expect(screen.getByText(CASINO_CONFIG.label)).toBeTruthy();
    // Джекпот никого не выбивает и не планирует следующий авто-спин.
    expect(game.activeCount).toBe(2);
    expect(game.spinSignal).toBe(3);

    // Повторный спин запускает анимация, а не таймер авто-прокрутки. И не раньше паузы.
    randomQueue = [0, 0.5];
    const framesBeforeRespin = frames.length;
    await act(async () => {
      vi.advanceTimersByTime(CASINO_CONFIG.jackpotPauseMs - 1);
    });
    expect(frames).toHaveLength(framesBeforeRespin);
    expect(screen.getByText(CASINO_CONFIG.label)).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(frames).toHaveLength(framesBeforeRespin + 1);
    expect(document.querySelector('.casino-layer')).toBeNull();
    expect(game.spinSignal).toBe(3);

    await finishSpin(CASINO_CONFIG.jackpotRespinSec);
    expect(game.lastResult).toBe('1 место: Гена 🏆');
    expect(game.activeCount).toBe(1);
    expect(game.autoSpin).toBe(false);
    expect(game.autoActive).toBe(false);
  });

  it('включается на первом же спине, если в раунде сразу два участника', async () => {
    await startAutoRound(['Аня', 'Боря']);
    randomQueue = [0, 0.5, 0.1, 0.9];
    await pressSpin();

    expect(game.activeCount).toBe(2);
    expect(screen.getByText('LUCKY SPIN')).toBeTruthy();

    await finishSpin();
    expect(game.lastResult).toBe('1 место: Боря 🏆');
    expect(game.autoSpin).toBe(false);
  });

  it('при невыпавшем казино финальный спин авто-серии остаётся обычным', async () => {
    await startAutoRound(['Аня', 'Боря']);
    randomQueue = [0, 0.5, 0.9];
    await pressSpin();

    expect(game.activeCount).toBe(2);
    expect(document.querySelector('.casino-layer')).toBeNull();

    await finishSpin();
    expect(game.lastResult).toBe('1 место: Боря 🏆');
    expect(game.autoSpin).toBe(false);
  });

  it('при смешанной комбинации выбивает сразу и завершает авто-серию', async () => {
    await startAutoRound(['Аня', 'Боря', 'Витя']);
    randomQueue = [0, 0.5];
    await pressSpin();

    await finishSpin();
    expect(game.activeCount).toBe(2);

    randomQueue = [0, 0.5, 0.1, 0.9];
    await nextAutoSpin();
    expect(screen.getByText('LUCKY SPIN')).toBeTruthy();

    await finishSpin();

    // Панель остаётся, но без подписи: участник уже выбыл.
    expect(document.querySelector('.casino-layer')).not.toBeNull();
    expect(document.querySelector('.casino-machine-title')).toBeNull();
    const reels = Array.from(document.querySelectorAll('.casino-reel'));
    expect(reels.map((reel) => reel.getAttribute('data-final-symbol'))).toEqual(CASINO_CONFIG.miss);
    expect(game.lastResult).toBe('1 место: Витя 🏆');
    expect(game.activeCount).toBe(1);
    expect(game.autoSpin).toBe(false);

    // Лишнего спина после чемпиона нет.
    const spinSignal = game.spinSignal;
    await nextAutoSpin();
    expect(game.spinSignal).toBe(spinSignal);
  });
});
