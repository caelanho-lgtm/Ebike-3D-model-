/**
 * Geometry-chart normalizer: turns a manufacturer chart (mm / degrees) into a
 * `CanonicalBike` (BB-anchored, metres / radians) with derived reference
 * points. Pure and deterministic.
 */

import type { BikePoints, CanonicalBike, GeometryChart, Vec2 } from './types.js';
import { assertValidGeometryChart } from './validate.js';
import { degToRad, mmToMetres } from './units.js';

/** Deterministic id slug from brand/model/size, e.g. "norco-sight-vlt-c1". */
export function slugify(brand: string, model: string, size: string): string {
  return [brand, model, size]
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Compute BB-anchored reference points (metres). All inputs are already SI.
 *
 * - BB is the origin.
 * - Axles sit `bbDrop` above the BB; the rear axle is `chainstay` away from the
 *   BB (straight line), the front axle a horizontal `wheelbase` ahead of it.
 * - The head-tube top is `(reach, stack)` by definition; the bottom is
 *   `headTubeLength` down the head-tube axis (forward and down at the HTA).
 * - The seat-tube axis is the up-and-back unit vector at the (effective) STA.
 */
function computePoints(args: {
  reach: number;
  stack: number;
  headTubeAngle: number;
  seatTubeAngle: number;
  headTubeLength: number;
  chainstay: number;
  wheelbase: number;
  bbDrop: number;
}): BikePoints {
  const bottomBracket: Vec2 = { x: 0, y: 0 };

  const rearAxleX = -Math.sqrt(args.chainstay * args.chainstay - args.bbDrop * args.bbDrop);
  const rearAxle: Vec2 = { x: rearAxleX, y: args.bbDrop };
  const frontAxle: Vec2 = { x: rearAxleX + args.wheelbase, y: args.bbDrop };

  const headTubeTop: Vec2 = { x: args.reach, y: args.stack };
  const headTubeBottom: Vec2 = {
    x: headTubeTop.x + args.headTubeLength * Math.cos(args.headTubeAngle),
    y: headTubeTop.y - args.headTubeLength * Math.sin(args.headTubeAngle),
  };

  const seatTubeAxis: Vec2 = {
    x: -Math.cos(args.seatTubeAngle),
    y: Math.sin(args.seatTubeAngle),
  };

  return { bottomBracket, rearAxle, frontAxle, headTubeTop, headTubeBottom, seatTubeAxis };
}

/**
 * Normalize a geometry chart into a `CanonicalBike`. Validates first and throws
 * `GeometryValidationError` if the chart is physically implausible.
 */
export function normalizeGeometryChart(chart: GeometryChart): CanonicalBike {
  assertValidGeometryChart(chart);

  const reach = mmToMetres(chart.reach);
  const stack = mmToMetres(chart.stack);
  const headTubeAngle = degToRad(chart.headTubeAngle);
  const seatTubeAngle = degToRad(chart.seatTubeAngle);
  const headTubeLength = mmToMetres(chart.headTubeLength);
  const chainstay = mmToMetres(chart.chainstay);
  const wheelbase = mmToMetres(chart.wheelbase);
  const bbDrop = mmToMetres(chart.bbDrop);
  const bbHeight = mmToMetres(chart.bbHeight);
  const wheelRadius = bbHeight + bbDrop;

  const points = computePoints({
    reach,
    stack,
    headTubeAngle,
    seatTubeAngle,
    headTubeLength,
    chainstay,
    wheelbase,
    bbDrop,
  });

  return {
    id: slugify(chart.brand, chart.model, chart.size),
    brand: chart.brand,
    model: chart.model,
    size: chart.size,
    stack,
    reach,
    headTubeAngle,
    seatTubeAngle,
    headTubeLength,
    chainstay,
    wheelbase,
    bbDrop,
    bbHeight,
    wheelRadius,
    ...(chart.topTubeEffective !== undefined
      ? { topTubeEffective: mmToMetres(chart.topTubeEffective) }
      : {}),
    ...(chart.seatTubeLength !== undefined
      ? { seatTubeLength: mmToMetres(chart.seatTubeLength) }
      : {}),
    ...(chart.standover !== undefined ? { standover: mmToMetres(chart.standover) } : {}),
    ...(chart.forkRake !== undefined ? { forkRake: mmToMetres(chart.forkRake) } : {}),
    points,
  };
}
