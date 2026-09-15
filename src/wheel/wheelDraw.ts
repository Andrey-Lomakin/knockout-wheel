import { TWO_PI, type Segment } from './wheelModel';

/** Обрезает длинный текст с многоточием. */
export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

/**
 * Чистая отрисовка колеса на canvas при заданном повороте.
 * `size` — CSS-размер стороны в пикселях; приходит снаружи (из ResizeObserver),
 * чтобы не читать `clientWidth` на каждом кадре и не вызывать лишний reflow.
 * Бэкбуфер переустанавливается только когда размер реально изменился.
 */
export function drawWheel(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  size: number,
  segments: Segment[],
  names: string[],
  rotation: number,
  /** Индекс погасшего сектора (выбывший ждёт следующего спина); -1 — такого нет. */
  dimmedIndex = -1,
): void {
  if (size <= 0) return;

  const dpr = window.devicePixelRatio || 1;
  const pixels = Math.round(size * dpr);
  if (canvas.width !== pixels || canvas.height !== pixels) {
    canvas.width = pixels;
    canvas.height = pixels;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;
  ctx.clearRect(0, 0, size, size);

  if (segments.length === 0) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TWO_PI);
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, seg.start, seg.end);
    ctx.closePath();
    ctx.fillStyle = i === dimmedIndex ? '#334155' : seg.color;
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  // Шрифт имён масштабируется от размера колеса (мин. 14px на маленьких экранах),
  // чтобы надписи росли вместе с колесом и не вылезали за пределы сектора.
  const fontSize = Math.max(14, Math.round(size * 0.035));
  ctx.font = `600 ${fontSize}px system-ui`;
  ctx.textAlign = 'right';
  // Подпись пропускается, если сектор для неё слишком узкий (высокий вес = узкая доля):
  // сравниваем длину дуги на радиусе текста с высотой строки, иначе имена налезают друг на друга.
  const textRadius = radius - 12;
  for (let i = 0; i < segments.length; i++) {
    const span = segments[i].end - segments[i].start;
    if (span * textRadius < fontSize * 1.1) continue;
    const mid = (segments[i].start + segments[i].end) / 2;
    ctx.save();
    ctx.rotate(mid);
    ctx.translate(textRadius, 4);
    ctx.fillStyle = i === dimmedIndex ? 'rgba(226, 232, 240, 0.45)' : '#ffffff';
    ctx.fillText(truncate(names[i] ?? '', 14), 0, 0);
    ctx.restore();
  }

  ctx.restore();
}
