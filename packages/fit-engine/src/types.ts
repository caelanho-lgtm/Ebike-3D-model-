/**
 * Core domain types for the FitWerx fit engine.
 *
 * All linear measurements are expressed in millimetres (mm) unless the field
 * name carries an explicit unit suffix. Angles are in degrees. The engine is
 * unit-internally-consistent: callers may pass centimetre body measurements via
 * the helper builders in `anthropometry.ts`, which normalise to millimetres.
 */

/** Cycling discipline. Drives ergonomic priors (aggressiveness, drop, reach). */
export type Discipline =
  | 'road_race'
  | 'road_endurance'
  | 'gravel'
  | 'mtb_xc'
  | 'mtb_trail'
  | 'tt_triathlon'
  | 'commute_city';

/** Self-reported flexibility, used to scale saddle-to-bar drop and reach. */
export type Flexibility = 'low' | 'medium' | 'high';

/** Rider experience, used to bias toward comfort vs. performance positions. */
export type Experience = 'beginner' | 'intermediate' | 'advanced' | 'pro';

export type FlexibilityRiderSex = 'male' | 'female' | 'unspecified';

/**
 * Raw anthropometric measurements for a rider. Only `height` is strictly
 * required; the engine estimates any omitted segment lengths from validated
 * anthropometric regressions (see `anthropometry.ts`).
 *
 * All lengths are in **millimetres**.
 */
export interface RiderMeasurements {
  /** Standing height, mm. Required. */
  height: number;
  /** Cycling inseam (floor to crotch, book-against-wall method), mm. */
  inseam?: number;
  /** Torso length (sternal notch to hip / greater trochanter), mm. */
  torso?: number;
  /** Full arm length (acromion to closed fist / wrist), mm. */
  armLength?: number;
  /** Shoulder (biacromial) width, mm. Sets handlebar width. */
  shoulderWidth?: number;
  /** Sit-bone (ischial tuberosity) width, mm. Sets saddle width. */
  sitBoneWidth?: number;
  /** Femur (thigh) length, mm. Influences saddle setback. */
  femur?: number;
  /** Lower-leg (tibia) length, mm. */
  lowerLeg?: number;
  /** Foot length, mm. Influences effective saddle height. */
  footLength?: number;
}

/** Qualitative rider profile inputs. */
export interface RiderProfile {
  discipline: Discipline;
  flexibility: Flexibility;
  experience: Experience;
  /** Age in years; reduces target drop above ~50. Optional. */
  age?: number;
  sex?: FlexibilityRiderSex;
}

export interface RiderInput {
  measurements: RiderMeasurements;
  profile: RiderProfile;
}

/**
 * The rider's ideal cockpit/contact-point coordinates, independent of any
 * specific bike. These are the biomechanical targets the recommender solves
 * each candidate frame against.
 */
export interface FitCoordinates {
  /** Saddle height: bottom-bracket centre to top of saddle along seat tube, mm. */
  saddleHeight: number;
  /** Saddle setback: horizontal distance saddle nose sits behind BB, mm. */
  saddleSetback: number;
  /** Recommended crank length, mm (rounded to nearest available 2.5 mm step). */
  crankLength: number;
  /** Target handlebar reach: horizontal BB→bar-centre distance, mm. */
  handlebarReach: number;
  /** Target handlebar drop: saddle-top is this far ABOVE bar-centre, mm.
   *  Negative means the bars sit above the saddle (very upright). */
  handlebarDrop: number;
  /** Handlebar width (centre-to-centre), mm. */
  handlebarWidth: number;
  /** Saddle width, mm. */
  saddleWidth: number;
  /**
   * Target frame STACK: vertical BB→head-tube-top distance the rider wants,
   * before accounting for spacers/stem, mm.
   */
  targetStack: number;
  /**
   * Target frame REACH: horizontal BB→head-tube-top distance the rider wants,
   * before accounting for spacers/stem, mm.
   */
  targetReach: number;
  /** Effective seat-tube angle implied by saddle setback at saddle height, deg. */
  effectiveSeatAngle: number;
}

/** A single frame geometry size offered by a bike model. */
export interface FrameGeometry {
  /** Manufacturer size label, e.g. "54", "M", "L". */
  sizeLabel: string;
  /** Frame stack, mm. */
  stack: number;
  /** Frame reach, mm. */
  reach: number;
  /** Seat-tube angle, degrees. */
  seatTubeAngle: number;
  /** Head-tube angle, degrees. */
  headTubeAngle: number;
  /** Head-tube length, mm. */
  headTubeLength?: number;
  /** Effective (horizontal) top-tube length, mm. */
  topTube?: number;
  /** Standover height, mm. */
  standover?: number;
  /** Wheelbase, mm. */
  wheelbase?: number;
  /** Crank length fitted as stock, mm. */
  stockCrankLength?: number;
  /** Min/max recommended rider height for this size, mm (manufacturer chart). */
  riderHeightRange?: { min: number; max: number };
}

/** A bike model that can be fitted, with one or more available sizes. */
export interface BikeModel {
  id: string;
  brand: string;
  name: string;
  discipline: Discipline;
  /** Stack-reach offset built into the cockpit (e.g. integrated bar). Optional. */
  sizes: FrameGeometry[];
}

/** Adjustable component ranges the recommender is allowed to use when fitting. */
export interface ComponentConstraints {
  stemLengthRange: { min: number; max: number; step: number };
  /** Stem rise we allow to be swapped, degrees from horizontal (+/-). */
  stemAngleRange: { min: number; max: number };
  /** Headset/steerer spacer stack range under the stem, mm. */
  spacerRange: { min: number; max: number };
  /** Allowed seatpost setback options, mm. */
  setbackOptions: number[];
}

/** Per-size fit evaluation result. */
export interface SizeFitResult {
  sizeLabel: string;
  /** 0-100 fit score (higher is better). */
  score: number;
  /** Stem length the solver chose, mm. */
  recommendedStemLength: number;
  /** Stem angle chosen, degrees. */
  recommendedStemAngle: number;
  /** Spacer stack chosen, mm. */
  recommendedSpacerStack: number;
  /** Seatpost setback chosen, mm. */
  recommendedSetback: number;
  /** Residual errors after solving, mm. */
  residuals: {
    reachError: number;
    stackError: number;
    setbackError: number;
  };
  /** Whether the target was reachable within the component constraints. */
  withinAdjustmentRange: boolean;
  /** Human-readable notes/warnings. */
  notes: string[];
}

/** A ranked recommendation for a single bike model. */
export interface ModelRecommendation {
  model: BikeModel;
  bestSize: SizeFitResult;
  /** All evaluated sizes, sorted best-first. */
  allSizes: SizeFitResult[];
  /** Confidence label derived from score + reachability. */
  confidence: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface RecommendationResult {
  fit: FitCoordinates;
  recommendations: ModelRecommendation[];
  /** Echo of which measurements were estimated vs. measured. */
  estimatedFields: string[];
}
