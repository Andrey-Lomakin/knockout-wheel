import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Автоочистка RTL не включается сама, потому что `globals: false`.
afterEach(() => {
  cleanup();
});

// jsdom не реализует ResizeObserver, а колесо на него подписано.
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub);

// jsdom не умеет 2d-контекст: возвращаем null, как и предусмотрено в коде отрисовки.
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
