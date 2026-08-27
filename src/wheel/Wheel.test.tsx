import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Wheel from './Wheel';
import type { WheelParticipant } from '../game/types';

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
    spinning: false,
    durationSec: 3,
    autoRunning: false,
    spinSignal: 0,
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

  it('не перезапускает спин, если сигнал не изменился', async () => {
    const { rerender, props } = renderWheel({ spinSignal: 1 });
    await flush();

    await act(async () => {
      rerender(<Wheel {...props} spinSignal={1} durationSec={7} />);
    });

    expect(props.onSpinStart).not.toHaveBeenCalled();
  });
});
