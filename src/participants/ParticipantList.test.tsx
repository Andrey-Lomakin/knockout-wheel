import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ParticipantList from './ParticipantList';
import type { Participant, Podium } from '../game/types';

function mk(id: string, name: string, enabled = true): Participant {
  return { id, name, weight: 1, enabled };
}

const roster = [mk('a', 'Аня'), mk('b', 'Боря'), mk('c', 'Витя')];

function renderList(overrides: Partial<React.ComponentProps<typeof ParticipantList>> = {}) {
  const props = {
    participants: roster,
    eliminatedIds: [] as string[],
    podium: [null, null, null] as Podium,
    locked: false,
    onRename: vi.fn(),
    onWeight: vi.fn(),
    onToggle: vi.fn(),
    onRemove: vi.fn(),
    onClear: vi.fn(),
    onShare: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
  render(<ParticipantList {...props} />);
  return props;
}

/** Все контролы строки участника: имя + кнопки веса, ✋/🙈 и удаления. */
function rowControls(name: string) {
  const input = screen.getByDisplayValue(name) as HTMLInputElement;
  const row = input.closest('li')!;
  return { input, buttons: Array.from(row.querySelectorAll('button')) };
}

describe('ParticipantList — блокировка на время спина', () => {
  it('в обычном состоянии всё редактируется', () => {
    renderList();
    const { input, buttons } = rowControls('Аня');

    expect(input.readOnly).toBe(false);
    expect(buttons.every((b) => !b.disabled)).toBe(true);
  });

  it('во время спина имя только для чтения, а кнопки строки недоступны', () => {
    renderList({ locked: true });
    const { input, buttons } = rowControls('Аня');

    expect(input.readOnly).toBe(true);
    expect(buttons.every((b) => b.disabled)).toBe(true);
  });

  it('во время спина «Очистить» заблокирована, а «Поделиться» — нет', () => {
    renderList({ locked: true });

    expect((screen.getByText('Очистить') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByText('Поделиться') as HTMLButtonElement).disabled).toBe(false);
  });
});

describe('ParticipantList — медали', () => {
  it('вешает медаль по id, а не по имени', () => {
    const twins = [mk('a', 'Аня'), mk('b', 'Аня')];
    renderList({ participants: twins, podium: ['b', null, null], eliminatedIds: ['a'] });

    const medals = screen.getAllByTitle('Место в раунде');
    expect(medals).toHaveLength(1);

    // Медаль стоит в строке второй «Ани» — той, у которой id = b.
    const row = medals[0].closest('li')!;
    const inputs = Array.from(row.querySelectorAll('input'));
    expect(inputs[0].value).toBe('Аня');
    expect(screen.getAllByDisplayValue('Аня')[1]).toBe(inputs[0]);
  });

  it('у награждённого не показывает бейдж «выбыл»', () => {
    renderList({ eliminatedIds: ['a', 'b'], podium: ['c', 'b', 'a'] });
    expect(screen.queryByText('выбыл')).toBeNull();
  });

  it('выбывшему без медали показывает бейдж «выбыл»', () => {
    renderList({ eliminatedIds: ['a'] });
    expect(screen.getAllByText('выбыл')).toHaveLength(1);
  });
});

describe('ParticipantList — шаринг', () => {
  it('показывает «Скопировано ✓» только при удачном копировании', async () => {
    renderList({ onShare: vi.fn().mockResolvedValue(true) });

    fireEvent.click(screen.getByText('Поделиться'));

    expect(await screen.findByText('Скопировано ✓')).toBeTruthy();
  });

  it('честно сообщает, что скопировать не вышло', async () => {
    renderList({ onShare: vi.fn().mockResolvedValue(false) });

    fireEvent.click(screen.getByText('Поделиться'));

    expect(await screen.findByText('Не удалось скопировать')).toBeTruthy();
    expect(screen.queryByText('Скопировано ✓')).toBeNull();
  });
});

describe('ParticipantList — действия', () => {
  it('прокидывает переименование, вес, переключение и удаление', () => {
    const props = renderList();
    const { input, buttons } = rowControls('Аня');

    fireEvent.change(input, { target: { value: 'Анна' } });
    expect(props.onRename).toHaveBeenCalledWith('a', 'Анна');

    fireEvent.click(screen.getAllByTitle(/Вес x2/)[0]);
    expect(props.onWeight).toHaveBeenCalledWith('a', 2);

    const toggle = buttons.find((b) => b.textContent === '✋')!;
    fireEvent.click(toggle);
    expect(props.onToggle).toHaveBeenCalledWith('a');

    const remove = buttons.find((b) => b.title === 'Удалить')!;
    fireEvent.click(remove);
    expect(props.onRemove).toHaveBeenCalledWith('a');
  });

  it('на пустом списке прячет действия и показывает подсказку', () => {
    renderList({ participants: [] });

    expect(screen.getByText('Список пуст — добавьте участников.')).toBeTruthy();
    expect(screen.queryByText('Поделиться')).toBeNull();
    expect(screen.queryByText('Очистить')).toBeNull();
  });
});
