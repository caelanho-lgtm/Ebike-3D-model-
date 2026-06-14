/**
 * Canonical geometry types. See CLAUDE.md principle 3 and the coordinate
 * reference: origin at the bottom bracket (BB), +x toward the front wheel,
 * +y up, metres, sagittal plane at z≈0.
 */

/** A point in the bike's sagittal plane, BB-anchored, in metres. */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/**
 * A raw manufacturer geometry chart row, in DISPLAY units (millimetres and
 * degrees). This is the ingest format; it never escapes the geometry package.
 *
 * Angles follow the cycling convention: measured from horizontal, in degrees.
 * `seatTubeAngle` is the *effective* seat angle.
 */
export interface GeometryChart {
  readonly brand: string;
  readonly model: string;
  readonly size: string;

  readonly stack: number; // mm, vertical BB → top of head tube
  readonly reach: number; // mm, horizontal BB → top of head tube
  readonly headTubeAngle: number; // deg, from horizontal
  readonly seatTubeAngle: number; // deg, effective, from horizontal
  readonly headTubeLength: number; // mm
  readonly chainstay: number; // mm, BB → rear axle (straight line)
  readonly wheelbase: number; // mm, horizontal between axles
  readonly bbDrop: number; // mm, axles above BB

  /**
   * Bottom-bracket height above the ground (mm). Together with `bbDrop` this
   * fixes the wheel radius (wheelRadius = bbHeight + bbDrop).
   */
  readonly bbHeight: number;

  // Optional, carried through when present.
  readonly topTubeEffective?: number; // mm
  readonly seatTubeLength?: number; // mm
  readonly standover?: number; // mm
  readonly forkRake?: number; // mm
  /** Actual rolling wheel diameter (mm), used only as a consistency cross-check. */
  readonly wheelDiameter?: number;
}

/** Derived BB-anchored reference points (metres), origin = BB. */
export interface BikePoints {
  readonly bottomBracket: Vec2; // (0, 0)
  readonly rearAxle: Vec2;
  readonly frontAxle: Vec2;
  readonly headTubeTop: Vec2; // (reach, stack)
  readonly headTubeBottom: Vec2;
  /** Unit vector pointing up the (effective) seat tube, BB → saddle. */
  readonly seatTubeAxis: Vec2;
}

/**
 * A bike normalized into the canonical, BB-anchored SI coordinate system.
 * Scalars are metres / radians. The renderer and fit engine only ever see this.
 */
export interface CanonicalBike {
  readonly id: string; // slug: `${brand}-${model}-${size}`
  readonly brand: string;
  readonly model: string;
  readonly size: string;

  readonly stack: number; // m
  readonly reach: number; // m
  readonly headTubeAngle: number; // rad
  readonly seatTubeAngle: number; // rad
  readonly headTubeLength: number; // m
  readonly chainstay: number; // m
  readonly wheelbase: number; // m
  readonly bbDrop: number; // m
  readonly bbHeight: number; // m
  readonly wheelRadius: number; // m, derived: bbHeight + bbDrop

  readonly topTubeEffective?: number; // m
  readonly seatTubeLength?: number; // m
  readonly standover?: number; // m
  readonly forkRake?: number; // m

  readonly points: BikePoints;
}

/** A single validation problem found in a geometry chart. */
export interface ValidationIssue {
  readonly field: string;
  readonly message: string;
}
