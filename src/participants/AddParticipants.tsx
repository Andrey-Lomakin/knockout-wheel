import { useState } from 'react';

interface AddParticipantsProps {
  onAdd: (names: string[]) => void;
  /** Добавление заблокировано на время спина. */
  locked: boolean;
}

/** Сворачиваемое добавление участников списком (по имени в строке). */
export default function AddParticipants({ onAdd, locked }: AddParticipantsProps) {
  const [bulkText, setBulkText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    const names = bulkText.split('\n').map((line) => line.trim()).filter(Boolean);
    if (names.length === 0) return;
    onAdd(names);
    setBulkText('');
  };

  return (
    <section className={`card add-participants ${isOpen ? 'is-open' : ''}`}>
      <h2 className="card-toggle-heading">
        <button
          type="button"
          className="card-toggle"
          aria-expanded={isOpen}
          aria-controls="add-participants-panel"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span>Добавить участников</span>
          <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
        </button>
      </h2>
      <div id="add-participants-panel" hidden={!isOpen}>
        <textarea
          className="bulk"
          aria-label="Новые участники"
          placeholder={'По одному имени в строке:\nАня\nБоря\nВитя\nГена'}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={5}
          disabled={locked}
        />
        <button className="btn" onClick={handleAdd} disabled={locked}>
          Добавить
        </button>
      </div>
    </section>
  );
}
