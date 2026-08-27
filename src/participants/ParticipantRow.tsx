import { WEIGHTS } from '../game/constants';
import type { Participant, Weight } from '../game/types';

interface ParticipantRowProps {
  participant: Participant;
  index: number;
  isOut: boolean;
  medal: string | null;
  onRename: (id: string, name: string) => void;
  onWeight: (id: string, weight: Weight) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

/** Одна строка участника: номер + награда, имя, вес, вкл/выкл, удалить. */
export default function ParticipantRow({
  participant: p,
  index,
  isOut,
  medal,
  onRename,
  onWeight,
  onToggle,
  onRemove,
}: ParticipantRowProps) {
  const rowClass = `row ${p.enabled ? '' : 'off'} ${isOut ? 'eliminated' : ''}`;

  return (
    <li className={rowClass}>
      <span className="idx">{index + 1}.</span>
      {medal && (
        <span className="medal" title={`Место в раунде`}>
          {medal}
        </span>
      )}
      <input
        className="row-name"
        value={p.name}
        onChange={(e) => onRename(p.id, e.target.value)}
        aria-label={`Имя участника ${index + 1}`}
      />
      {isOut && !medal && <span className="out-badge">выбыл</span>}
      <div className="weights">
        {WEIGHTS.map((w) => (
          <button
            key={w}
            className={`weight ${p.weight === w ? 'active' : ''}`}
            onClick={() => onWeight(p.id, w)}
            title={`Вес x${w}`}
            disabled={!p.enabled}
          >
            x{w}
          </button>
        ))}
      </div>
      <button
        className={`toggle ${p.enabled ? 'on' : 'off'}`}
        onClick={() => onToggle(p.id)}
        title={p.enabled ? 'Выключить (не участвует в колесе)' : 'Включить'}
      >
        {p.enabled ? '✋' : '🙈'}
      </button>
      <button className="remove" onClick={() => onRemove(p.id)} title="Удалить">
        ✕
      </button>
    </li>
  );
}