import { useCallback, useInsertionEffect, useRef } from 'react';

/**
 * Хранит актуальное значение и возвращает стабильный геттер.
 * Защита от устаревших замыканий в хуках/колбэках (важно для анимации).
 *
 * Значение кладётся в ref из `useInsertionEffect`, а не прямо в теле рендера:
 * запись в ref во время рендера запрещена в конкурентном React (проход могут отбросить).
 * `useInsertionEffect` выполняется раньше layout- и обычных эффектов, поэтому к моменту
 * любого коллбэка в ref уже лежит значение последнего закоммиченного рендера.
 */
export default function useLatest<T>(value: T): () => T {
  const ref = useRef(value);

  useInsertionEffect(() => {
    ref.current = value;
  }, [value]);

  return useCallback(() => ref.current, []);
}
