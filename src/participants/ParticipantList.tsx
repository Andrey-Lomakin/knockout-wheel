import { useState } from 'react';
import type { Participant, Podium, Weight } from '../game/types';
import ParticipantRow from './ParticipantRow';

interface ParticipantListProps {
  participants: Participant[];
  eliminatedIds: string[];
  podium: Podium;
  onRename: (id: string, name: string) => void;
  onWeight: (id: string, weight: Weight) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onShare: () => void;
}

const MEDALS = ['🥇', '🥈', '🥉'];

/** Полный список участников с возможностью редактирования, наград, очистки и шаринга. */
export default function ParticipantList(props: ParticipantListProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    props.onShare();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  // Медаль участника по имени (1-е/2-е/3-е место из подиума) или null.
  const medalFor = (name: string): string | null => {
    const idx = props.podium.findIndex((place) => place === name);
    return idx >= 0 ? MEDALS[idx] : null;
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2>Участники</h2>
        {props.participants.length > 0 && (
          <div className="head-actions">
            <button className="link-btn" onClick={handleShare}>
              {copied ? 'Скопировано ✓' : 'Поделиться'}
            </button>
            <button className="link-btn" onClick={props.onClear}>
              Очистить
            </button>
          </div>
        )}
      </div>
      {props.participants.length === 0 ? (
        <p className="empty">Список пуст — добавьте участников.</p>
      ) : (
        <ul className="list">
          {props.participants.map((p, idx) => (
            <ParticipantRow
              key={p.id}
              participant={p}
              index={idx}
              isOut={props.eliminatedIds.includes(p.id)}
              medal={medalFor(p.name)}
              onRename={props.onRename}
              onWeight={props.onWeight}
              onToggle={props.onToggle}
              onRemove={props.onRemove}
            />
          ))}
        </ul>
      )}
    </section>
  );
}