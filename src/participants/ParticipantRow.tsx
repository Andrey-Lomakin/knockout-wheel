import { MAX_WEIGHT, MIN_WEIGHT } from '../game/constants';
import type { Participant, Weight } from '../game/types';
import { formatWeight, stepWeight } from '../game/weights';

interface ParticipantRowProps {
  participant: Participant;
  index: number;
  isOut: boolean;
  medal: string | null;
  /** Строка заблокирована на время спина. */
  locked: boolean;
  onRename: (id: string, name: string) => void;
  onWeight: (id: string, weight: Weight) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

/**
 * Одна строка участника: номер + награда, имя, вес (степпер − / ×1.4 / +), вкл/выкл, удалить.
 * Вес меняется с шагом 0.2 в пределах [MIN_WEIGHT, MAX_WEIGHT].
 */
export default function ParticipantRow({
  participant: p,
  index,
  isOut,
  medal,
  locked,
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
        <span className="medal" title="Место в раунде">
          {medal}
        </span>
      )}
      <input
        className="row-name"
        value={p.name}
        onChange={(e) => onRename(p.id, e.target.value)}
        readOnly={locked}
        aria-label={`Имя участника ${index + 1}`}
      />
      {isOut && !medal && <span className="out-badge">выбыл</span>}
      <div className="weights" aria-label={`Вес участника ${index + 1}`}>
        <button
          className="weight step"
          onClick={() => onWeight(p.id, stepWeight(p.weight, -1))}
          title="Уменьшить вес"
          aria-label="Уменьшить вес"
          disabled={!p.enabled || locked || p.weight <= MIN_WEIGHT}
        >
          −
        </button>
        <span
          className="weight-value"
          title={`Вес ${formatWeight(p.weight)} — во столько раз больше шанс вылететь`}
        >
          {formatWeight(p.weight)}
        </span>
        <button
          className="weight step"
          onClick={() => onWeight(p.id, stepWeight(p.weight, 1))}
          title="Увеличить вес"
          aria-label="Увеличить вес"
          disabled={!p.enabled || locked || p.weight >= MAX_WEIGHT}
        >
          +
        </button>
      </div>
      <button
        className={`toggle ${p.enabled ? 'on' : 'off'}`}
        onClick={() => onToggle(p.id)}
        title={p.enabled ? 'Выключить (не участвует в колесе)' : 'Включить'}
        disabled={locked}
      >
        {p.enabled ? '✋' : '🙈'}
      </button>
      <button className="remove" onClick={() => onRemove(p.id)} title="Удалить" disabled={locked}>
        ✕
      </button>
    </li>
  );
}
