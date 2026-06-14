/**
 * Minimal pure 2D vector helpers for the sagittal-plane solver. No Three.js —
 * the engine must run identically in the browser and on the server.
 * Coordinates are BB-anchored metres (Vec2 from @dtf/geometry).
 */

import type { Vec2 } from '@dtf/geometry';

export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const length = (a: Vec2): number => Math.hypot(a.x, a.y);
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

export const normalize = (a: Vec2): Vec2 => {
  const len = length(a);
  return len === 0 ? { x: 0, y: 0 } : { x: a.x / len, y: a.y / len };
};

/** Rotate a vector +90° (CCW): used to offset a joint off the root→target line. */
export const perpCCW = (a: Vec2): Vec2 => ({ x: -a.y, y: a.x });

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

/** Interior angle (radians) at vertex `b` for the path a–b–c. */
export const angleAt = (a: Vec2, b: Vec2, c: Vec2): number => {
  const u = sub(a, b);
  const v = sub(c, b);
  const denom = length(u) * length(v);
  if (denom === 0) return 0;
  return Math.acos(clamp(dot(u, v) / denom, -1, 1));
};
