import type { FitCoordinates } from './types';

const deg = (d: number) => (d * Math.PI) / 180;

/**
 * Render a side-profile bike-fit diagram (SVG) from the rider's fit coordinates.
 * Origin = bottom bracket. Shows frame, contact points and rider posture.
 */
export function buildFitSvg(fit: FitCoordinates, color: string): string {
  const W = 460;
  const H = 340;

  // Bike-space points (mm), origin at BB, +x forward, +y up.
  const bb = { x: 0, y: 0 };
  const saddle = {
    x: -fit.saddleHeight * Math.cos(deg(fit.effectiveSeatAngle)),
    y: fit.saddleHeight * Math.sin(deg(fit.effectiveSeatAngle)),
  };
  const bar = { x: fit.targetReach, y: fit.targetStack };
  const AXLE_Y = 70;
  const R = 340;
  const rear = { x: -430, y: AXLE_Y };
  const front = { x: bar.x + 120, y: AXLE_Y };
  const shoulder = {
    x: saddle.x + (bar.x - saddle.x) * 0.5,
    y: saddle.y + (bar.y - saddle.y) * 0.18 + 230,
  };
  const head = { x: shoulder.x + 60, y: shoulder.y + 150 };
  const knee = { x: bb.x + 120, y: (saddle.y + bb.y) / 2 + 30 };

  const minX = rear.x - R - 60;
  const maxX = front.x + R + 60;
  const groundY = AXLE_Y - R;
  const maxY = head.y + 110;
  const spanX = maxX - minX;
  const spanY = maxY - groundY;
  const scale = Math.min((W - 20) / spanX, (H - 20) / spanY);
  const ox = 10 - minX * scale;
  const oy = H - 10 + groundY * scale;
  const px = (x: number) => ox + x * scale;
  const py = (y: number) => oy - y * scale;

  const line = (a: { x: number; y: number }, b: { x: number; y: number }, c: string, w: number) =>
    `<line x1="${px(a.x).toFixed(1)}" y1="${py(a.y).toFixed(1)}" x2="${px(b.x).toFixed(1)}" y2="${py(b.y).toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const circle = (c: { x: number; y: number }, r: number, fill: string, stroke = 'none', sw = 0) =>
    `<circle cx="${px(c.x).toFixed(1)}" cy="${py(c.y).toFixed(1)}" r="${(r * scale).toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bike fit diagram">
  <rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="#0b1220"/>
  <line x1="0" y1="${py(groundY).toFixed(1)}" x2="${W}" y2="${py(groundY).toFixed(1)}" stroke="#1e293b" stroke-width="1"/>
  ${circle(rear, R, 'none', '#334155', 6)}
  ${circle(front, R, 'none', '#334155', 6)}
  ${line(bb, saddle, color, 5)}
  ${line(bb, bar, color, 5)}
  ${line(saddle, bar, '#475569', 4)}
  ${line(bb, rear, '#475569', 3)}
  ${line(saddle, rear, '#475569', 3)}
  ${line(bar, front, '#64748b', 3)}
  ${line({ x: saddle.x - 70, y: saddle.y }, { x: saddle.x + 70, y: saddle.y }, '#e2e8f0', 4)}
  ${line(saddle, shoulder, '#22d3ee', 4)}
  ${line(shoulder, bar, '#22d3ee', 4)}
  ${line(saddle, knee, '#22d3ee', 4)}
  ${line(knee, bb, '#22d3ee', 4)}
  ${circle(saddle, 26, '#22d3ee')}
  ${circle(shoulder, 24, '#22d3ee')}
  ${circle(knee, 18, '#67e8f9')}
  ${circle(head, 80, '#22d3ee')}
  ${circle(bb, 16, '#f59e0b')}
  ${circle(bar, 18, color)}
</svg>`;
}
