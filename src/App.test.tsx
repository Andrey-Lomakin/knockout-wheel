import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useWheelGame } from './game/useWheelGame';
import type { Participant } from './game/types';

vi.mock('./game/useWheelGame', () => ({ useWheelGame: vi.fn() }));

const participants: Participant[] = [
  { id: 'a', name: 'Аня', weight: 1, enabled: true },
  { id: 'b', name: 'Боря', weight: 1, enabled: true },
];

function makeGame(spinning: boolean): ReturnType<typeof useWheelGame> {
  return {
    participants,
    activeCount: 2,
    podium: [null, null, null],
    spinning,
    lastResult: null,
    lastOut: null,
    pendingOutId: null,
    spinDuration: 5,
    eliminatedIds: [],
    wheelParticipants: participants,
    autoSpin: false,
    autoActive: false,
    spinSignal: 0,
    roundRevision: 0,
    setSpinDuration: vi.fn(),
    addParticipants: vi.fn(),
    replaceParticipants: vi.fn(),
    rename: vi.fn(),
    setWeight: vi.fn(),
    toggleEnabled: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    resetRound: vi.fn(),
    toggleAuto: vi.fn(),
    pressSpin: vi.fn(),
    stopAuto: vi.fn(),
    requestSpin: vi.fn(),
    handleSpinStart: vi.fn(),
    handleSpinEnd: vi.fn(),
  };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  window.history.replaceState({}, '', '/');
});

describe('App — шаринг во время спина', () => {
  it('ждёт конца вращения перед заменой участников', () => {
    const names = encodeURIComponent(JSON.stringify(['Витя', 'Гена']));
    window.history.replaceState({}, '', `/?users=${names}`);
    const spinningGame = makeGame(true);
    vi.mocked(useWheelGame).mockReturnValue(spinningGame);

    const view = render(<App />);
    act(() => window.dispatchEvent(new PopStateEvent('popstate')));
    expect(spinningGame.replaceParticipants).not.toHaveBeenCalled();
    expect(window.location.search).toContain('users=');

    const idleGame = { ...spinningGame, spinning: false };
    vi.mocked(useWheelGame).mockReturnValue(idleGame);
    view.rerender(<App />);

    expect(idleGame.replaceParticipants).toHaveBeenCalledWith(['Витя', 'Гена']);
    expect(window.location.search).toBe('');
  });
});

describe('App — подвал', () => {
  it('показывает ссылку на репозиторий GitHub', () => {
    vi.mocked(useWheelGame).mockReturnValue(makeGame(false));
    render(<App />);

    const link = screen.getByRole('link', { name: 'GitHub' });
    expect(link.getAttribute('href')).toBe('https://github.com/Andrey-Lomakin/knockout-wheel');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noreferrer');
  });
});
