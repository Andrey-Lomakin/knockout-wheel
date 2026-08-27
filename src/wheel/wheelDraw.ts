import { TWO_PI, type Segment } from './wheelModel';

/** Обрезает длинный текст с многоточием. */
export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

/** Чистая отрисовка колеса на canvas при заданном повороте. */
export function drawWheel(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  segments: Segment[],
  names: string[],
  rotation: number,
): void {
  const dpr = window.devicePixelRatio || 1;
  const size = canvas.clientWidth;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
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

  for (const seg of segments) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, seg.start, seg.end);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 14px system-ui';
  ctx.textAlign = 'right';
  for (let i = 0; i < segments.length; i++) {
    const mid = (segments[i].start + segments[i].end) / 2;
    ctx.save();
    ctx.rotate(mid);
    ctx.translate(radius - 12, 4);
    ctx.fillText(truncate(names[i] ?? '', 14), 0, 0);
    ctx.restore();
  }

  ctx.restore();
}