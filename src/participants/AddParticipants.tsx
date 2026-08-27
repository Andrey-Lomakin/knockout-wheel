import { useState } from 'react';

interface AddParticipantsProps {
  onAdd: (names: string[]) => void;
}

/** Быстрое добавление участников списком (по имени в строке). */
export default function AddParticipants({ onAdd }: AddParticipantsProps) {
  const [bulkText, setBulkText] = useState('');

  const handleAdd = () => {
    const names = bulkText.split('\n').map((line) => line.trim()).filter(Boolean);
    if (names.length === 0) return;
    onAdd(names);
    setBulkText('');
  };

  return (
    <section className="card">
      <h2>Добавить участников</h2>
      <textarea
        className="bulk"
        placeholder={'По одному имени в строке:\nАня\nБоря\nВитя\nГена'}
        value={bulkText}
        onChange={(e) => setBulkText(e.target.value)}
        rows={5}
      />
      <button className="btn" onClick={handleAdd}>
        Добавить
      </button>
    </section>
  );
}