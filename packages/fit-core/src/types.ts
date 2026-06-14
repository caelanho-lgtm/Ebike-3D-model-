/**
 * Public types for the fit engine. Render-agnostic: `FitState` carries
 * BB-anchored SI joint positions and metrics that any renderer (R3F or the 2D
 * SVG fallback) can draw. SI internally — convert to mm/deg only for display.
 */

import type { Vec2 } from '@dtf/geometry';
import type { QualityWindow, WindowStatus } from './windows.js';

/** Rider body measurements (SI). Segment lengths derive from these. */
export interface RiderMeasurements {
  readonly heightM: number;
  readonly inseamM: number;
}

/** Derived body-segment lengths (metres). */
export interface RiderSegments {
  readonly thigh: number;
  readonly shank: number;
  readonly torso: number;
  readonly upperArm: number;
  readonly forearm: number;
  /** Effective straight-line shoulder→hand reach. */
  readonly armReach: number;
  readonly headRadius: number;
  readonly neck: number;
}

/** The directly-manipulated surfaces. SI; optional fields fall back to RIG defaults. */
export interface Adjustments {
  readonly saddleHeightM: number; // BB → saddle top, along the seat-tube axis
  readonly stemAngleRad: number; // bar swing about the steerer top
  readonly crankLengthM?: number;
  readonly stemLengthM?: number;
}

export type MetricKind = 'length' | 'angle';

/** A single fit metric. `si` is metres (length) or radians (angle). */
export interface Metric {
  readonly kind: MetricKind;
  readonly si: number;
  /** Quality band (display units) from windows.ts, when the metric has one. */
  readonly window?: QualityWindow;
  /** Classification of `si` against `window`, when present. */
  readonly status?: WindowStatus;
}

/** BB-anchored SI joint positions for the posed rider. */
export interface FitJoints {
  readonly hip: Vec2;
  readonly kneeDown: Vec2;
  readonly ankleDown: Vec2;
  readonly kneeUp: Vec2;
  readonly ankleUp: Vec2;
  readonly shoulder: Vec2;
  readonly elbow: Vec2;
  readonly hand: Vec2;
  readonly head: Vec2;
}

export interface FitMetrics {
  readonly saddleHeight: Metric;
  readonly kneeExtension: Metric; // interior hip–knee–ankle angle at the down pedal
  readonly torsoAngle: Metric; // torso from horizontal
  readonly barDrop: Metric; // saddle top above the grip (positive = saddle higher)
  readonly stemReach: Metric; // horizontal stem reach
}

export type FitWarningCode = 'leg-over-extended' | 'bars-unreachable';

export interface FitWarning {
  readonly code: FitWarningCode;
  readonly message: string;
}

/** The complete, render-agnostic result of `solve()`. */
export interface FitState {
  readonly joints: FitJoints;
  readonly metrics: FitMetrics;
  readonly warnings: readonly FitWarning[];
}
