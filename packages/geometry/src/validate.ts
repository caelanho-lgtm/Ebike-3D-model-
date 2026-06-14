/**
 * Geometry-chart validation. Rejects physically impossible or out-of-range
 * charts before they are normalized. Pure and deterministic: a given chart
 * always yields the same ordered list of issues.
 */

import type { GeometryChart, ValidationIssue } from './types.js';

/** Plausible bounds for chart fields, in display units (mm / deg). */
const LIMITS = {
  stack: { min: 200, max: 900 },
  reach: { min: 200, max: 700 },
  headTubeAngle: { min: 55, max: 85 },
  seatTubeAngle: { min: 60, max: 90 },
  headTubeLength: { min: 40, max: 350 },
  chainstay: { min: 300, max: 550 },
  wheelbase: { min: 800, max: 1400 },
  bbDrop: { min: -20, max: 150 },
  bbHeight: { min: 200, max: 420 },
} as const;

type RangedField = keyof typeof LIMITS;

function checkString(field: string, value: string, issues: ValidationIssue[]): void {
  if (value.trim().length === 0) {
    issues.push({ field, message: `${field} must be a non-empty string` });
  }
}

function checkRange(field: RangedField, value: number, issues: ValidationIssue[]): void {
  if (!Number.isFinite(value)) {
    issues.push({ field, message: `${field} must be a finite number` });
    return;
  }
  const { min, max } = LIMITS[field];
  if (value < min || value > max) {
    issues.push({
      field,
      message: `${field} (${value}) is outside the plausible range ${min}–${max}`,
    });
  }
}

/**
 * Return every problem found in a chart, in a stable order. An empty array
 * means the chart is valid.
 */
export function validateGeometryChart(chart: GeometryChart): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  checkString('brand', chart.brand, issues);
  checkString('model', chart.model, issues);
  checkString('size', chart.size, issues);

  checkRange('stack', chart.stack, issues);
  checkRange('reach', chart.reach, issues);
  checkRange('headTubeAngle', chart.headTubeAngle, issues);
  checkRange('seatTubeAngle', chart.seatTubeAngle, issues);
  checkRange('headTubeLength', chart.headTubeLength, issues);
  checkRange('chainstay', chart.chainstay, issues);
  checkRange('wheelbase', chart.wheelbase, issues);
  checkRange('bbDrop', chart.bbDrop, issues);
  checkRange('bbHeight', chart.bbHeight, issues);

  // Cross-field sanity (only meaningful once the fields are finite numbers).
  if (Number.isFinite(chart.chainstay) && Number.isFinite(chart.bbDrop)) {
    if (chart.chainstay <= Math.abs(chart.bbDrop)) {
      issues.push({
        field: 'chainstay',
        message: `chainstay (${chart.chainstay}) must exceed |bbDrop| (${Math.abs(
          chart.bbDrop,
        )}) for the rear axle to be solvable`,
      });
    }
  }
  if (Number.isFinite(chart.wheelbase) && Number.isFinite(chart.chainstay)) {
    if (chart.wheelbase <= chart.chainstay) {
      issues.push({
        field: 'wheelbase',
        message: `wheelbase (${chart.wheelbase}) must exceed chainstay (${chart.chainstay})`,
      });
    }
  }
  if (chart.wheelDiameter !== undefined) {
    if (!Number.isFinite(chart.wheelDiameter) || chart.wheelDiameter <= 0) {
      issues.push({ field: 'wheelDiameter', message: 'wheelDiameter must be a positive number' });
    } else {
      // Cross-check the implied wheel radius against bbHeight + bbDrop.
      const impliedRadius = chart.bbHeight + chart.bbDrop;
      const statedRadius = chart.wheelDiameter / 2;
      if (Math.abs(impliedRadius - statedRadius) > 25) {
        issues.push({
          field: 'wheelDiameter',
          message: `wheelDiameter/2 (${statedRadius}) disagrees with bbHeight + bbDrop (${impliedRadius}) by more than 25 mm`,
        });
      }
    }
  }

  return issues;
}

/** Error thrown when a chart fails validation. Carries the structured issues. */
export class GeometryValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(
      `Invalid geometry chart:\n${issues.map((i) => `  - ${i.field}: ${i.message}`).join('\n')}`,
    );
    this.name = 'GeometryValidationError';
    this.issues = issues;
  }
}

/** Throw `GeometryValidationError` if the chart is invalid; otherwise no-op. */
export function assertValidGeometryChart(chart: GeometryChart): void {
  const issues = validateGeometryChart(chart);
  if (issues.length > 0) {
    throw new GeometryValidationError(issues);
  }
}
