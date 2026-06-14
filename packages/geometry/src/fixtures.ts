/**
 * Real-bike geometry fixtures (representative published figures). Used by the
 * golden tests and reusable by downstream packages (e.g. fit-core fixtures).
 *
 * Values are in chart/display units (mm, degrees). The Norco Sight VLT matches
 * the geometry baked into docs/prototype.html, so the normalizer reproduces the
 * prototype's frame anchor points exactly.
 */

import type { GeometryChart } from './types.js';

/** Norco Sight VLT — e-MTB, 29". Mirrors the prototype's frame geometry. */
export const NORCO_SIGHT_VLT: GeometryChart = {
  brand: 'Norco',
  model: 'Sight VLT',
  size: 'M',
  stack: 645,
  reach: 497.5,
  headTubeAngle: 64.0,
  seatTubeAngle: 77.75,
  headTubeLength: 125,
  chainstay: 440,
  wheelbase: 1281,
  bbDrop: 28,
  bbHeight: 342,
  wheelDiameter: 740,
};

/** Specialized Tarmac SL7 — road race, 700c, size 56. */
export const SPECIALIZED_TARMAC_SL7: GeometryChart = {
  brand: 'Specialized',
  model: 'Tarmac SL7',
  size: '56',
  stack: 562,
  reach: 395,
  headTubeAngle: 73.5,
  seatTubeAngle: 73.5,
  headTubeLength: 162,
  chainstay: 410,
  wheelbase: 996,
  bbDrop: 72,
  bbHeight: 268,
  topTubeEffective: 565,
  seatTubeLength: 540,
  wheelDiameter: 680,
};

/** Canyon Grail — gravel, 700c, size M. */
export const CANYON_GRAIL: GeometryChart = {
  brand: 'Canyon',
  model: 'Grail',
  size: 'M',
  stack: 567,
  reach: 390,
  headTubeAngle: 71.75,
  seatTubeAngle: 73.5,
  headTubeLength: 150,
  chainstay: 425,
  wheelbase: 1027,
  bbDrop: 70,
  bbHeight: 285,
  topTubeEffective: 560,
  seatTubeLength: 530,
  wheelDiameter: 710,
};

/** All real-bike fixtures, for table-driven tests. */
export const REAL_BIKE_CHARTS: readonly GeometryChart[] = [
  NORCO_SIGHT_VLT,
  SPECIALIZED_TARMAC_SL7,
  CANYON_GRAIL,
];
