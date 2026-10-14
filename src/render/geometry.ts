export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where the line from `rect`'s center toward (tx, ty) crosses `rect`'s
 * border — i.e. a clean arrow anchor point on the box's edge, whatever
 * direction the other node currently is (works under free dragging, not
 * just a fixed left-to-right layout). */
export function borderPoint(rect: Rect, tx: number, ty: number): { x: number; y: number } {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  const halfW = rect.width / 2;
  const halfH = rect.height / 2;
  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);

  return { x: cx + dx * scale, y: cy + dy * scale };
}

export function rectCenter(rect: Rect): { x: number; y: number } {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}
