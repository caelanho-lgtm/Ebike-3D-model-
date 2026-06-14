import { computeFit, frameSetback } from './fit.js';
import { DEFAULT_COMPONENT_CONSTRAINTS } from './constants.js';
import { clamp, snapToNearest, snapToStep, solveCockpitPoint } from './geometry.js';
import type {
  BikeModel,
  ComponentConstraints,
  FitCoordinates,
  ModelRecommendation,
  RecommendationResult,
  RiderInput,
  SizeFitResult,
} from './types.js';

/**
 * Weighting of each residual when scoring a fit. Reach and stack errors are the
 * dominant contributors; setback is secondary because it is easily adjusted via
 * saddle rails.
 */
const SCORE_WEIGHTS = {
  reach: 1.0,
  stack: 0.85,
  setback: 0.4,
  disciplineMismatch: 18, // flat penalty if disciplines differ
} as const;

/** Convert a weighted RMS error (mm) into a 0–100 score with a soft curve. */
function errorToScore(weightedError: number): number {
  // ~0mm → 100, ~25mm → ~71, ~50mm → ~50. Exponential decay.
  const score = 100 * Math.exp(-weightedError / 60);
  return clamp(Math.round(score), 0, 100);
}

function confidenceFromScore(
  score: number,
  reachable: boolean,
): ModelRecommendation['confidence'] {
  if (!reachable) return score >= 70 ? 'fair' : 'poor';
  if (score >= 88) return 'excellent';
  if (score >= 74) return 'good';
  if (score >= 58) return 'fair';
  return 'poor';
}

/**
 * Solve the best stem length / angle / spacer stack for a single frame size so
 * that the resulting cockpit point matches the rider's target stack & reach as
 * closely as possible, then score the residual.
 */
export function evaluateSize(
  fit: FitCoordinates,
  size: BikeModel['sizes'][number],
  modelDiscipline: BikeModel['discipline'],
  riderDiscipline: RiderInput['profile']['discipline'],
  constraints: ComponentConstraints,
): SizeFitResult {
  const notes: string[] = [];

  // --- Setback / saddle fore-aft via post offset ---
  const frameImpliedSetback = frameSetback(fit.saddleHeight, size.seatTubeAngle);
  // We can shift the saddle on its rails (~±25mm) plus pick a setback post.
  let bestSetbackError = Infinity;
  let chosenSetback = constraints.setbackOptions[0] ?? 0;
  for (const post of constraints.setbackOptions) {
    // Effective setback the rider gets = frame setback + post setback + rail range.
    const achievable = frameImpliedSetback + post;
    const railAdjust = clamp(fit.saddleSetback - achievable, -25, 25);
    const resulting = achievable + railAdjust;
    const err = Math.abs(resulting - fit.saddleSetback);
    if (err < bestSetbackError) {
      bestSetbackError = err;
      chosenSetback = post;
    }
  }

  // --- Solve stem + spacers for stack/reach ---
  let best: {
    stemLength: number;
    stemAngle: number;
    spacerStack: number;
    reachError: number;
    stackError: number;
    combined: number;
  } | null = null;

  const { stemLengthRange, stemAngleRange, spacerRange } = constraints;
  const angleCandidates = [stemAngleRange.min, 0, stemAngleRange.max];

  for (
    let stem = stemLengthRange.min;
    stem <= stemLengthRange.max;
    stem += stemLengthRange.step
  ) {
    for (const angle of angleCandidates) {
      for (let spacer = spacerRange.min; spacer <= spacerRange.max; spacer += 5) {
        const cockpit = solveCockpitPoint({
          frameStack: size.stack,
          frameReach: size.reach,
          headTubeAngle: size.headTubeAngle,
          spacerStack: spacer,
          stemLength: stem,
          stemAngle: angle,
        });
        const reachError = cockpit.reach - fit.targetReach;
        const stackError = cockpit.stack - fit.targetStack;
        const combined = Math.hypot(
          reachError * SCORE_WEIGHTS.reach,
          stackError * SCORE_WEIGHTS.stack,
        );
        if (!best || combined < best.combined) {
          best = {
            stemLength: stem,
            stemAngle: angle,
            spacerStack: spacer,
            reachError,
            stackError,
            combined,
          };
        }
      }
    }
  }

  // best is always set because the loops run at least once.
  const solved = best!;

  const weightedError = Math.hypot(
    solved.combined,
    bestSetbackError * SCORE_WEIGHTS.setback,
  );
  let score = errorToScore(weightedError);

  // Discipline mismatch penalty.
  if (modelDiscipline !== riderDiscipline) {
    score = clamp(score - SCORE_WEIGHTS.disciplineMismatch, 0, 100);
    notes.push(
      `Model is tuned for a different discipline (${modelDiscipline} vs ${riderDiscipline}).`,
    );
  }

  // Reachability: residuals must be small enough that components can absorb them.
  const reachable =
    Math.abs(solved.reachError) <= 12 &&
    Math.abs(solved.stackError) <= 18 &&
    bestSetbackError <= 12;

  if (!reachable) {
    if (Math.abs(solved.reachError) > 12) {
      notes.push(
        solved.reachError > 0
          ? 'Frame reach runs long; a shorter stem alone cannot fully correct it.'
          : 'Frame reach runs short; consider the next size up.',
      );
    }
    if (Math.abs(solved.stackError) > 18) {
      notes.push(
        solved.stackError > 0
          ? 'Frame stack is taller than ideal; bars sit higher than target.'
          : 'Frame stack is low; max spacers still leave bars below target.',
      );
    }
  }

  // Manufacturer height-chart sanity note.
  if (size.riderHeightRange) {
    notes.push(
      `Manufacturer height range for this size: ${Math.round(
        size.riderHeightRange.min / 10,
      )}–${Math.round(size.riderHeightRange.max / 10)} cm.`,
    );
  }

  return {
    sizeLabel: size.sizeLabel,
    score,
    recommendedStemLength: snapToStep(
      solved.stemLength,
      stemLengthRange.min,
      stemLengthRange.max,
      stemLengthRange.step,
    ),
    recommendedStemAngle: solved.stemAngle,
    recommendedSpacerStack: solved.spacerStack,
    recommendedSetback: chosenSetback,
    residuals: {
      reachError: Math.round(solved.reachError),
      stackError: Math.round(solved.stackError),
      setbackError: Math.round(bestSetbackError),
    },
    withinAdjustmentRange: reachable,
    notes,
  };
}

/** Rank all sizes of a single model, best first. */
export function recommendModel(
  fit: FitCoordinates,
  model: BikeModel,
  riderDiscipline: RiderInput['profile']['discipline'],
  constraints: ComponentConstraints,
): ModelRecommendation {
  const allSizes = model.sizes
    .map((size) =>
      evaluateSize(fit, size, model.discipline, riderDiscipline, constraints),
    )
    .sort((a, b) => b.score - a.score);

  const bestSize = allSizes[0];
  return {
    model,
    bestSize,
    allSizes,
    confidence: confidenceFromScore(bestSize.score, bestSize.withinAdjustmentRange),
  };
}

/**
 * Full recommendation pipeline: compute the rider's ideal fit, then score and
 * rank every supplied bike model. Models are returned sorted by their best
 * size's score (best first).
 */
export function recommendBikes(
  input: RiderInput,
  catalog: BikeModel[],
  options?: { constraints?: ComponentConstraints; limit?: number },
): RecommendationResult {
  const { fit, estimatedFields } = computeFit(input);
  const constraints = options?.constraints ?? DEFAULT_COMPONENT_CONSTRAINTS;

  const recommendations = catalog
    .map((model) =>
      recommendModel(fit, model, input.profile.discipline, constraints),
    )
    .sort((a, b) => b.bestSize.score - a.bestSize.score);

  return {
    fit,
    recommendations: options?.limit
      ? recommendations.slice(0, options.limit)
      : recommendations,
    estimatedFields,
  };
}

export { snapToNearest };
