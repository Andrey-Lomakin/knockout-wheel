import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AddParticipants from './AddParticipants';

describe('AddParticipants', () => {
  it('свёрнут по умолчанию, сохраняет текст и добавляет имена после раскрытия', () => {
    const onAdd = vi.fn();
    render(<AddParticipants onAdd={onAdd} locked={false} />);

    expect(screen.queryByRole('textbox')).toBeNull();
    const toggle = screen.getByRole('button', { name: 'Добавить участников' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const textarea = screen.getByRole('textbox', { name: 'Новые участники' });
    fireEvent.change(textarea, { target: { value: ' Аня \n\nБоря\nВитя' } });

    fireEvent.click(toggle);
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(toggle);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(' Аня \n\nБоря\nВитя');

    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));
    expect(onAdd).toHaveBeenCalledWith(['Аня', 'Боря', 'Витя']);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
  });
});
