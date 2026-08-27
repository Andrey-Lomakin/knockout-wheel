import { useCallback, useEffect, useRef, useState } from 'react';
import type { Participant, Podium, Weight } from '../game/types';
import ParticipantRow from './ParticipantRow';

interface ParticipantListProps {
  participants: Participant[];
  eliminatedIds: string[];
  podium: Podium;
  /** Список заблокирован на время спина, чтобы состав колеса не менялся посреди вращения. */
  locked: boolean;
  onRename: (id: string, name: string) => void;
  onWeight: (id: string, weight: Weight) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  /** Возвращает, удалось ли скопировать ссылку в буфер обмена. */
  onShare: () => Promise<boolean>;
}

const MEDALS = ['🥇', '🥈', '🥉'];

type CopyState = 'idle' | 'copied' | 'failed';

const COPY_LABEL: Record<CopyState, string> = {
  idle: 'Поделиться',
  copied: 'Скопировано ✓',
  failed: 'Не удалось скопировать',
};

/** Полный список участников с возможностью редактирования, наград, очистки и шаринга. */
export default function ParticipantList(props: ParticipantListProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const resetTimerRef = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(resetTimerRef.current), []);

  const { onShare } = props;
  const handleShare = useCallback(async () => {
    const copied = await onShare();
    setCopyState(copied ? 'copied' : 'failed');
    window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => setCopyState('idle'), 1500);
  }, [onShare]);

  // Медаль участника по его id (1-е/2-е/3-е место из подиума) или null.
  const medalFor = (id: string): string | null => {
    const idx = props.podium.findIndex((place) => place === id);
    return idx >= 0 ? MEDALS[idx] : null;
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2>Участники</h2>
        {props.participants.length > 0 && (
          <div className="head-actions">
            <button className={`link-btn ${copyState === 'failed' ? 'failed' : ''}`} onClick={handleShare}>
              {COPY_LABEL[copyState]}
            </button>
            <button className="link-btn" onClick={props.onClear} disabled={props.locked}>
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
              medal={medalFor(p.id)}
              locked={props.locked}
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
