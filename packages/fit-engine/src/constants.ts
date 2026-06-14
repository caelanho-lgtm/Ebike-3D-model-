import type {
  ComponentConstraints,
  Discipline,
  Experience,
  Flexibility,
} from './types.js';

/**
 * Anthropometric segment ratios as a fraction of standing height.
 *
 * Values are population means drawn from published anthropometric data
 * (Drillis & Contini 1966; NASA-STD-3000 segment tables) and the cycling-fit
 * literature. They are used ONLY to estimate measurements the user did not
 * provide. Measured values always take precedence.
 */
export const SEGMENT_RATIOS = {
  /** Cycling inseam / height. */
  inseam: 0.47,
  /** Torso (sternal notch to hip) / height. */
  torso: 0.3,
  /** Full arm length / height. */
  armLength: 0.44,
  /** Biacromial shoulder width / height. */
  shoulderWidth: 0.23,
  /** Femur length / height. */
  femur: 0.245,
  /** Tibia (lower-leg) length / height. */
  lowerLeg: 0.246,
  /** Foot length / height. */
  footLength: 0.152,
} as const;

/** Default sit-bone width, mm (population-typical), when not measured. */
export const DEFAULT_SIT_BONE_WIDTH_MM = 120;

/**
 * Saddle-height coefficient (top-of-saddle along seat tube / cycling inseam).
 *
 * The classic LeMond factor is 0.883 measured BB→top-of-saddle. We use it as a
 * base and apply small crank-length and discipline corrections elsewhere.
 */
export const LEMOND_SADDLE_FACTOR = 0.883;

/**
 * Crank length model. Crank length tracks leg length; a widely used heuristic
 * is ~21.6% of inseam, clamped to commercially available lengths.
 * crank(mm) ≈ inseam(mm) * 0.216.
 */
export const CRANK_INSEAM_FACTOR = 0.216;
export const AVAILABLE_CRANK_LENGTHS_MM = [160, 165, 167.5, 170, 172.5, 175, 177.5, 180];

/**
 * Discipline ergonomic profiles.
 *
 * - reachFactor:  multiplier on the torso+arm reach baseline (aggressive < 1 means
 *                 shorter/more upright is NOT how it works — higher = longer reach).
 * - dropFactor:   fraction of saddle height used as the baseline saddle→bar drop.
 *                 Higher = more aggressive (bars lower relative to saddle).
 * - seatAngle:    nominal effective seat-tube angle target, deg.
 * - setbackBias:  mm added/removed from KOPS-neutral setback (TT pulls forward).
 * - barWidthBias: mm added to shoulder-width-derived bar width.
 */
export interface DisciplineProfile {
  reachFactor: number;
  dropFactor: number;
  seatAngle: number;
  setbackBias: number;
  barWidthBias: number;
  label: string;
}

export const DISCIPLINE_PROFILES: Record<Discipline, DisciplineProfile> = {
  road_race: {
    reachFactor: 1.0,
    dropFactor: 0.12,
    seatAngle: 73.5,
    setbackBias: 0,
    barWidthBias: 0,
    label: 'Road — Race',
  },
  road_endurance: {
    reachFactor: 0.96,
    dropFactor: 0.07,
    seatAngle: 73.0,
    setbackBias: 5,
    barWidthBias: 0,
    label: 'Road — Endurance',
  },
  gravel: {
    reachFactor: 0.95,
    dropFactor: 0.05,
    seatAngle: 73.0,
    setbackBias: 5,
    barWidthBias: 20,
    label: 'Gravel',
  },
  mtb_xc: {
    reachFactor: 0.94,
    dropFactor: 0.02,
    seatAngle: 74.5,
    setbackBias: -5,
    barWidthBias: 120,
    label: 'MTB — Cross-Country',
  },
  mtb_trail: {
    reachFactor: 0.9,
    dropFactor: -0.02,
    seatAngle: 75.5,
    setbackBias: -10,
    barWidthBias: 160,
    label: 'MTB — Trail',
  },
  tt_triathlon: {
    reachFactor: 1.04,
    dropFactor: 0.16,
    seatAngle: 77.5,
    setbackBias: -35,
    barWidthBias: -40,
    label: 'Time Trial / Triathlon',
  },
  commute_city: {
    reachFactor: 0.88,
    dropFactor: -0.06,
    seatAngle: 72.5,
    setbackBias: 5,
    barWidthBias: 40,
    label: 'Commute / City',
  },
};

/** Flexibility scales the achievable drop. Low flexibility raises the bars. */
export const FLEXIBILITY_DROP_SCALE: Record<Flexibility, number> = {
  low: 0.6,
  medium: 1.0,
  high: 1.25,
};

/** Experience nudges position toward comfort (beginner) or performance (pro). */
export const EXPERIENCE_DROP_SCALE: Record<Experience, number> = {
  beginner: 0.7,
  intermediate: 0.9,
  advanced: 1.0,
  pro: 1.1,
};

/** Default adjustable component envelope used when the caller omits one. */
export const DEFAULT_COMPONENT_CONSTRAINTS: ComponentConstraints = {
  stemLengthRange: { min: 60, max: 130, step: 10 },
  stemAngleRange: { min: -17, max: 17 },
  spacerRange: { min: 0, max: 40 },
  setbackOptions: [0, 15, 25],
};
