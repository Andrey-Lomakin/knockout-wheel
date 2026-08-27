import { useCallback, useRef } from 'react';

/**
 * Хранит актуальное значение и возвращает стабильный геттер.
 * Защита от устаревших замыканий в хуках/колбэках (важно для анимации).
 */
export default function useLatest<T>(value: T): () => T {
  const ref = useRef(value);
  ref.current = value;
  return useCallback(() => ref.current, []);
}