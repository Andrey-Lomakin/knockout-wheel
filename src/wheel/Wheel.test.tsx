import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Wheel from './Wheel';
import type { WheelParticipant } from '../game/types';
import { getPlaceIcon } from '../lib/placeIcons';

// Мемы тянутся fetch-ем из public/ — в тестах подменяем на управляемый список.
const memes = vi.hoisted(() => ({ videos: [] as string[] }));

vi.mock('../lib/memes', () => ({
  getMemeVideos: () => Promise.resolve(memes.videos),
  pickRandomVideo: (list: string[]) => list[0],
}));

function wheelParticipants(...names: string[]): WheelParticipant[] {
  return names.map((name, i) => ({ id: `p${i}`, name, weight: 1 }));
}

function renderWheel(overrides: Partial<React.ComponentProps<typeof Wheel>> = {}) {
  const props = {
    participants: wheelParticipants('Аня', 'Боря', 'Витя'),
    activeCount: 3,
    spinning: false,
    durationSec: 3,
    autoRunning: false,
    spinSignal: 0,
    roundRevision: 0,
    lastOut: null,
    dimmedId: null,
    onSpinRequest: vi.fn(),
    onSpinStart: vi.fn(),
    onSpinEnd: vi.fn(),
    ...overrides,
  };
  const view = render(<Wheel {...props} />);
  return { ...view, props };
}

/** Даёт отработать промису загрузки мемов, чтобы не ловить предупреждение act(). */
async function flush() {
  await act(async () => {});
}

beforeEach(() => {
  memes.videos = [];
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Wheel — кнопка спина', () => {
  it('крутится по клику, когда участников хватает', async () => {
    const { props } = renderWheel();
    await flush();

    const button = screen.getByText('Крутить') as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    expect(props.onSpinRequest).toHaveBeenCalledTimes(1);
  });

  it('заблокирована на пустом списке', async () => {
    renderWheel({ participants: [] });
    await flush();

    expect((screen.getByText('Крутить') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Добавьте участников')).toBeTruthy();
  });

  it('во время спина показывает «Крутим…» и не кликается', async () => {
    renderWheel({ spinning: true });
    await flush();

    const button = screen.getByText('Крутим…') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});

describe('Wheel — победитель', () => {
  it('на последнем участнике заменяет кнопку на 🏆, если мемов нет', async () => {
    renderWheel({ participants: wheelParticipants('Аня') });
    await flush();

    expect(screen.queryByText('Крутить')).toBeNull();
    const champion = screen.getByLabelText('Победитель');
    expect(champion.textContent).toBe('🏆');
  });

  it('на последнем участнике крутит зацикленный мем, если он есть', async () => {
    memes.videos = ['memes/mp4/1.mp4'];
    const { container } = renderWheel({ participants: wheelParticipants('Аня') });
    await flush();

    const video = container.querySelector('video.spin-video') as HTMLVideoElement;
    expect(video).toBeTruthy();
    expect(video.getAttribute('src')).toBe('memes/mp4/1.mp4');
    expect(video.loop).toBe(true);
    expect(video.muted).toBe(true);
  });
});

describe('Wheel — реакция на сигнал спина', () => {
  it('запускает анимацию при новом spinSignal и сообщает о старте', async () => {
    const { rerender, props } = renderWheel();
    await flush();

    expect(props.onSpinStart).not.toHaveBeenCalled();

    await act(async () => {
      rerender(<Wheel {...props} spinSignal={1} />);
    });

    expect(props.onSpinStart).toHaveBeenCalledTimes(1);
  });

  it('показывает барабаны снизу и останавливает их к концу колеса', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    memes.videos = ['memes/mp4/1.mp4'];
    const { rerender, props } = renderWheel({ autoRunning: true, participants: wheelParticipants('Аня', 'Боря', 'Витя'), activeCount: 2, dimmedId: 'p2' });
    await flush();

    await act(async () => {
      rerender(<Wheel {...props} spinSignal={1} />);
    });

    expect(screen.getByText('LUCKY SPIN')).toBeTruthy();
    expect(document.querySelector('video.spin-video')).toBeTruthy();
    const tracks = Array.from(document.querySelectorAll<HTMLElement>('.casino-reel-track'));
    expect(tracks.map((track) => track.style.animationDuration)).toEqual(['2100ms', '2550ms', '3000ms']);
    expect(props.onSpinStart).toHaveBeenCalledTimes(1);
  });

  it('при джекпоте никого не выбивает и запускает обычный спин на 3 секунды', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    const { rerender, props } = renderWheel({ participants: wheelParticipants('Аня', 'Боря'), activeCount: 2 });
    await flush();

    await act(async () => {
      rerender(<Wheel {...props} spinSignal={1} />);
    });
    now = 3000;
    await act(async () => frames[0](now));

    expect(props.onSpinEnd).not.toHaveBeenCalled();
    expect(props.onSpinStart).toHaveBeenCalledTimes(1);
    expect(screen.getByText('JACKPOT')).toBeTruthy();
    expect(frames).toHaveLength(1);

    await act(async () => vi.advanceTimersByTime(699));
    expect(props.onSpinStart).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTime(1));
    expect(props.onSpinStart).toHaveBeenCalledTimes(2);
    expect(document.querySelector('.casino-layer')).toBeNull();
    expect(frames).toHaveLength(2);

    now = 5999;
    await act(async () => frames[1](now));
    expect(props.onSpinEnd).not.toHaveBeenCalled();

    now = 6000;
    await act(async () => frames[2](now));
    expect(props.onSpinEnd).toHaveBeenCalledTimes(1);
    expect(props.onSpinEnd).toHaveBeenCalledWith(props.participants[0]);
    expect(frames).toHaveLength(3);
  });

  it('отменяет отложенный респин при смене раунда', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    const { rerender, props } = renderWheel({ participants: wheelParticipants('Аня', 'Боря'), activeCount: 2 });
    await flush();

    rerender(<Wheel {...props} spinSignal={1} />);
    now = 3000;
    await act(async () => frames[0](now));
    expect(screen.getByText('JACKPOT')).toBeTruthy();

    rerender(<Wheel {...props} spinSignal={1} roundRevision={1} />);
    await act(async () => vi.advanceTimersByTime(1000));

    expect(props.onSpinStart).toHaveBeenCalledTimes(1);
    expect(frames).toHaveLength(1);
    expect(document.querySelector('.casino-layer')).toBeNull();
  });

  it('без джекпота выбивает сразу и сбрасывается по roundRevision', async () => {
    const randomValues = [0.1, 0.1, 0.1, 0.9];
    vi.spyOn(Math, 'random').mockImplementation(() => randomValues.shift() ?? 0.1);
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    const { rerender, props } = renderWheel({ participants: wheelParticipants('Аня', 'Боря'), activeCount: 2 });
    await flush();

    await act(async () => {
      rerender(<Wheel {...props} spinSignal={1} />);
    });
    expect(frames).toHaveLength(1);
    now = 3000;
    await act(async () => frames[0](now));

    expect(props.onSpinEnd).toHaveBeenCalledTimes(1);
    // Панель остаётся, но без подписи: участник уже выбыл.
    expect(document.querySelector('.casino-layer')).not.toBeNull();
    expect(document.querySelector('.casino-machine-title')).toBeNull();
    const reels = Array.from(document.querySelectorAll('.casino-reel'));
    expect(reels.map((reel) => reel.getAttribute('data-final-symbol'))).toEqual(['7️⃣', '7️⃣', '🍒']);

    rerender(<Wheel {...props} participants={wheelParticipants('Аня')} spinSignal={1} />);
    expect(document.querySelector('.casino-layer')).not.toBeNull();
    expect(document.querySelector('.casino-machine-title')).toBeNull();
    rerender(<Wheel {...props} spinSignal={1} roundRevision={1} />);
    expect(document.querySelector('.casino-layer')).toBeNull();
  });

  it('не показывает casino, пока участников больше двух', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const { rerender, props } = renderWheel();
    await flush();

    await act(async () => {
      rerender(<Wheel {...props} spinSignal={1} />);
    });

    expect(screen.queryByText('LUCKY SPIN')).toBeNull();
    expect(document.querySelector('.casino-layer')).toBeNull();
  });

  it('не запускает барабаны, если анимация отклонила пустой состав', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const { rerender, props } = renderWheel({ participants: [] });
    await flush();

    await act(async () => {
      rerender(<Wheel {...props} spinSignal={1} />);
    });

    expect(props.onSpinStart).not.toHaveBeenCalled();
    expect(document.querySelector('.casino-layer')).toBeNull();
  });

  it('не перезапускает спин, если сигнал не изменился', async () => {
    const { rerender, props } = renderWheel({ spinSignal: 1 });
    await flush();

    await act(async () => {
      rerender(<Wheel {...props} spinSignal={1} durationSec={7} />);
    });

    expect(props.onSpinStart).not.toHaveBeenCalled();
  });
});

describe('Wheel — карточка выбывания', () => {
  it('показывает имя и подпись выбывшего', async () => {
    renderWheel({ lastOut: { name: 'Боря', place: null } });
    await flush();

    expect(screen.getByText('Боря')).toBeTruthy();
    expect(screen.getByText('выбывает')).toBeTruthy();
  });

  it('для победителя показывает медаль и подпись «победитель»', async () => {
    renderWheel({ lastOut: { name: 'Гена', place: 1 } });
    await flush();

    expect(screen.getByText(getPlaceIcon(1))).toBeTruthy();
    expect(screen.getByText('победитель')).toBeTruthy();
  });

  it('без объявления карточки нет', async () => {
    renderWheel();
    await flush();

    expect(screen.queryByText('выбывает')).toBeNull();
  });
});
