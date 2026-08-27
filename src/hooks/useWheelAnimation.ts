import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { WheelParticipant } from '../game/types';
import useLatest from './useLatest';
import { buildSegments, computeTargetRotation, easeOutCubic, pickWeightedIndex } from '../wheel/wheelModel';

interface UseWheelAnimationParams {
  /** Ref с актуальными участниками колеса. */
  participantsRef: MutableRefObject<WheelParticipant[]>;
  /** Ref с длительностью спина (сек). */
  durationRef: MutableRefObject<number>;
  /** Ref с флагом «идёт спин». */
  spinningRef: MutableRefObject<boolean>;
  onSpinStart: () => void;
  onSpinEnd: (p: WheelParticipant) => void;
  /** Вызывается, когда начался спин (например, показать мем). */
  onMemeStart?: () => void;
  /** Вызывается, когда спин закончился (убрать мем). */
  onMemeEnd?: () => void;
}

/**
 * Управляет анимацией спина колеса на requestAnimationFrame.
 * Возвращает текущий угол поворота и метод запуска. Данные читаются через refs,
 * чтобы колбэки не замыкали устаревшие значения.
 */
export function useWheelAnimation(params: UseWheelAnimationParams) {
  const paramsRef = useLatest(params);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const animRef = useRef(0);

  const runSpin = useCallback(() => {
    const { participantsRef, durationRef, spinningRef, onSpinStart, onSpinEnd, onMemeStart, onMemeEnd } =
      paramsRef();

    if (spinningRef.current || participantsRef.current.length === 0) return;

    const list = participantsRef.current;
    const index = pickWeightedIndex(list);
    const segments = buildSegments(list);
    const segment = segments[index];
    const target = computeTargetRotation(rotationRef.current, segment);
    const duration = durationRef.current * 1000;
    const startTime = performance.now();
    const from = rotationRef.current;

    onSpinStart();
    onMemeStart?.();

    cancelAnimationFrame(animRef.current);
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = easeOutCubic(t);
      const value = from + (target - from) * eased;
      rotationRef.current = value;
      setRotation(value);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        rotationRef.current = target;
        setRotation(target);
        onMemeEnd?.();
        const winner = list[index];
        if (winner) onSpinEnd(winner);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, [paramsRef]);

  // Отменяем анимацию при размонтировании.
  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  return { rotation, runSpin };
}