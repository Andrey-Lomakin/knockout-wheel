import { useEffect, useMemo, useRef, useState } from 'react';
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
  /** Идёт ли последовательность авто-спинов. */
  autoRunning: boolean;
  /** Инкрементируется при каждом запросе спина (кнопка или авто). */
  spinSignal: number;
  onSpinRequest: () => void;
  onSpinStart: () => void;
  onSpinEnd: (winner: WheelParticipant) => void;
}

/** Canvas-колесо: рисует сегменты и анимирует вращение. */
export default function Wheel({
  participants,
  spinning,
  durationSec,
  autoRunning,
  spinSignal,
  onSpinRequest,
  onSpinStart,
  onSpinEnd,
}: WheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // CSS-размер стороны канваса; обновляется по ResizeObserver, а не читается каждый кадр.
  const [size, setSize] = useState(0);

  const { spinVideo, hasVideos, showRandom, hide } = useMemes();
  const { rotation, runSpin } = useWheelAnimation({
    participants,
    durationSec,
    spinning,
    onSpinStart,
    onSpinEnd,
    onMemeStart: showRandom,
    // Во время авто-последовательности мем спина остаётся на паузе (тот же), не очищаем.
    // В ручном режиме — очищаем после каждого спина.
    onMemeEnd: autoRunning ? undefined : hide,
  });

  // Запускаем спин по каждому новому сигналу (защита от двойного запуска в StrictMode).
  const handledSignalRef = useRef(spinSignal);
  useEffect(() => {
    if (spinSignal > 0 && spinSignal !== handledSignalRef.current) {
      handledSignalRef.current = spinSignal;
      runSpin();
    }
  }, [spinSignal, runSpin]);

  // Следим за реальным размером канваса — иначе после ресайза окна колесо оставалось бы
  // нарисованным в старом разрешении до следующего спина.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const update = () => setSize(canvas.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const segments = useMemo(() => buildSegments(participants), [participants]);

  // Победитель: остался ровно один участник → вместо кнопки показываем мем.
  const isChampion = participants.length === 1;

  // Когда определился победитель — подхватываем случайный зацикленный мем.
  // `hasVideos` в зависимостях обязателен: победитель мог определиться раньше, чем загрузился
  // манифест, и без этого он навсегда остался бы с запасным 🏆.
  useEffect(() => {
    if (isChampion && hasVideos && !spinVideo) showRandom();
  }, [isChampion, hasVideos, spinVideo, showRandom]);

  // Отрисовка колеса при изменении поворота, состава или размера.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawWheel(
      canvas,
      ctx,
      size,
      segments,
      participants.map((p) => p.name),
      rotation,
    );
  }, [segments, participants, rotation, size]);

  // Если авто выключили (не победитель, не крутим) — убираем мем, чтобы вернуть «Крутить».
  useEffect(() => {
    if (!autoRunning && !spinning && !isChampion && spinVideo) hide();
  }, [autoRunning, spinning, isChampion, spinVideo, hide]);

  // Кнопка некликабельна, пока показывается мем (спин или пауза авто).
  const buttonDisabled = participants.length === 0 || spinning || !!spinVideo;

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
          disabled={buttonDisabled}
          spinVideo={spinVideo}
          onClick={onSpinRequest}
        />
      )}
    </div>
  );
}
