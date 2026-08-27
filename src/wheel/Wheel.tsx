import { useEffect, useMemo, useRef } from 'react';
import type { WheelParticipant } from '../game/types';
import { useWheelAnimation } from '../hooks/useWheelAnimation';
import { useMemes } from '../hooks/useMemes';
import { buildSegments } from './wheelModel';
import { drawWheel } from './wheelDraw';
import SpinButton from './SpinButton';

interface WheelProps {
  participants: WheelParticipant[];
  spinning: boolean;
  durationSec: number;
  onSpinStart: () => void;
  onSpinEnd: (winner: WheelParticipant) => void;
}

/** Canvas-колесо: рисует сегменты и анимирует вращение. Данные — через refs (без устаревших замыканий). */
export default function Wheel({ participants, spinning, durationSec, onSpinStart, onSpinEnd }: WheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Актуальные значения для анимации — читаются из refs внутри хука.
  const participantsRef = useRef(participants);
  participantsRef.current = participants;
  const durationRef = useRef(durationSec);
  durationRef.current = durationSec;
  const spinningRef = useRef(spinning);
  spinningRef.current = spinning;

  const { spinVideo, showRandom, hide } = useMemes();
  const { rotation, runSpin } = useWheelAnimation({
    participantsRef,
    durationRef,
    spinningRef,
    onSpinStart,
    onSpinEnd,
    onMemeStart: showRandom,
    onMemeEnd: hide,
  });

  const segments = useMemo(() => buildSegments(participants), [participants]);

  // Победитель: остался ровно один участник → вместо кнопки показываем мем.
  const isChampion = participants.length === 1;

  // Когда определился победитель — подхватываем случайный зацикленный мем.
  useEffect(() => {
    if (isChampion && !spinVideo) showRandom();
  }, [isChampion, spinVideo, showRandom]);

  // Отрисовка колеса при каждом изменении поворота/сегментов.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawWheel(canvas, ctx, segments, participants.map((p) => p.name), rotation);
  }, [segments, participants, rotation]);

  return (
    <div className="wheel-wrap">
      <canvas ref={canvasRef} className="wheel-canvas" />
      <div className="wheel-pointer" />
      {isChampion ? (
        <div className="spin-btn champion-meme" aria-label="Победитель">
          {spinVideo ? (
            <video className="spin-video" src={spinVideo} autoPlay loop muted playsInline />
          ) : (
            '🏆'
          )}
        </div>
      ) : (
        <SpinButton
          spinning={spinning}
          disabled={spinning || participants.length === 0}
          spinVideo={spinVideo}
          onClick={runSpin}
        />
      )}
    </div>
  );
}