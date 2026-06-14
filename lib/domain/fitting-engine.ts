import type {
  BikeModel,
  FitConfidence,
  FitRecommendation,
  FitScoreBreakdown,
  FrameSize,
  RiderProfile
} from "./types";

const intentAggression: Record<RiderProfile["intent"], number> = {
  comfort: 0.85,
  endurance: 0.95,
  performance: 1.05,
  race: 1.12,
  cargo: 0.82,
  commute: 0.9
};

const categoryStackBias: Record<RiderProfile["category"], number> = {
  road: 0,
  gravel: 12,
  mountain: 45,
  hybrid: 58,
  cargo: 70,
  ebike: 64
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function scoreDistance(actual: number, target: number, tolerance: number): number {
  const delta = Math.abs(actual - target);
  return clamp(100 - (delta / tolerance) * 100, 0, 100);
}

function preferredReachMm(profile: RiderProfile): number {
  const { armMm, torsoMm, flexibilityScore } = profile.measurements;
  const baseReach = torsoMm * 0.31 + armMm * 0.24;
  const flexibilityAdjustment = (flexibilityScore - 5) * 4.5;
  return baseReach * intentAggression[profile.intent] + flexibilityAdjustment;
}

function preferredStackMm(profile: RiderProfile): number {
  const { heightMm, torsoMm, flexibilityScore } = profile.measurements;
  const comfortAdjustment = (10 - flexibilityScore) * 5;
  return heightMm * 0.18 + torsoMm * 0.34 + categoryStackBias[profile.category] + comfortAdjustment;
}

function preferredStandoverMm(profile: RiderProfile): number {
  return profile.measurements.inseamMm - 45;
}

function saddleHeightMm(profile: RiderProfile): number {
  return Math.round(profile.measurements.inseamMm * 0.883);
}

function handlebarDropMm(profile: RiderProfile): number {
  const intentDrop = {
    comfort: 5,
    endurance: 25,
    performance: 45,
    race: 65,
    cargo: 0,
    commute: 8
  } satisfies Record<RiderProfile["intent"], number>;

  return Math.round(
    clamp(intentDrop[profile.intent] + (profile.measurements.flexibilityScore - 5) * 4, 0, 90)
  );
}

function stemLengthMm(frame: FrameSize, profile: RiderProfile): number {
  const reachTarget = preferredReachMm(profile);
  const adjustment = clamp((reachTarget - frame.reachMm) * 0.6, -20, 25);
  return Math.round(clamp(90 + adjustment, 60, 130) / 10) * 10;
}

function crankLengthMm(profile: RiderProfile): number {
  const raw = profile.measurements.inseamMm * 0.216;
  if (raw < 165) return 165;
  if (raw < 170) return 170;
  if (raw < 172.5) return 172.5;
  return 175;
}

function confidence(score: number, breakdown: FitScoreBreakdown): FitConfidence {
  if (score >= 88 && breakdown.standover >= 80) return "high";
  if (score >= 72 && breakdown.standover >= 65) return "medium";
  return "low";
}

function buildNotes(
  profile: RiderProfile,
  frame: FrameSize,
  breakdown: FitScoreBreakdown
): string[] {
  const notes = [
    `${frame.label} balances reach, stack, and standover for a ${profile.intent} ${profile.category} fit.`,
    `Set initial saddle height to ${saddleHeightMm(profile)} mm and validate dynamically after a short ride.`
  ];

  if (breakdown.reach < 75) {
    notes.push("Reach is outside the ideal band; validate stem length or bar choice before checkout.");
  }

  if (breakdown.stack < 75) {
    notes.push("Stack is near the edge of the preferred range; spacer configuration should be reviewed.");
  }

  if (profile.injuryNotes) {
    notes.push("Rider-reported injury context should be reviewed by an in-store fitter.");
  }

  return notes;
}

function scoreFrame(profile: RiderProfile, bike: BikeModel, frame: FrameSize): FitRecommendation {
  const reach = scoreDistance(frame.reachMm, preferredReachMm(profile), 60);
  const stack = scoreDistance(frame.stackMm, preferredStackMm(profile), 85);
  const standover = scoreDistance(frame.standoverMm, preferredStandoverMm(profile), 70);
  const intent =
    bike.category === profile.category
      ? 100
      : bike.category === "ebike" && profile.category === "commute"
        ? 88
        : 62;

  const breakdown = {
    reach: Math.round(reach),
    stack: Math.round(stack),
    standover: Math.round(standover),
    intent: Math.round(intent)
  };

  const score = Math.round(reach * 0.34 + stack * 0.3 + standover * 0.24 + intent * 0.12);

  return {
    bikeModelId: bike.id,
    bikeModelName: bike.name,
    frameLabel: frame.label,
    score,
    confidence: confidence(score, breakdown),
    saddleHeightMm: saddleHeightMm(profile),
    handlebarDropMm: handlebarDropMm(profile),
    stemLengthMm: stemLengthMm(frame, profile),
    crankLengthMm: crankLengthMm(profile),
    notes: buildNotes(profile, frame, breakdown),
    scoreBreakdown: breakdown
  };
}

export function generateFitRecommendations(
  profile: RiderProfile,
  bikes: BikeModel[],
  limit = 3
): FitRecommendation[] {
  return bikes
    .flatMap((bike) => bike.frameSizes.map((frame) => scoreFrame(profile, bike, frame)))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
