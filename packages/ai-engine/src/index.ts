export type RidingDiscipline = "road" | "gravel" | "mtb" | "triathlon";

export interface RiderProfile {
  inseamCm: number;
  torsoCm: number;
  armCm: number;
  heightCm: number;
  flexibilityScore: number; // 1-10
  discipline: RidingDiscipline;
}

export interface BikeSizeOption {
  frameLabel: string;
  stackMm: number;
  reachMm: number;
  topTubeMm: number;
}

export interface SizeRecommendation {
  recommendedFrame: string;
  confidence: number;
  rankedOptions: Array<{ frameLabel: string; fitScore: number }>;
  rationale: string[];
}

const disciplineStackBias: Record<RidingDiscipline, number> = {
  road: 0,
  gravel: 12,
  mtb: 28,
  triathlon: -15
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function idealStack(profile: RiderProfile): number {
  const torsoArmComposite = profile.torsoCm + profile.armCm;
  const flexibilityOffset = (6 - profile.flexibilityScore) * 4;
  return profile.inseamCm * 5.2 + torsoArmComposite * 1.35 + flexibilityOffset + disciplineStackBias[profile.discipline];
}

function idealReach(profile: RiderProfile): number {
  const torsoArmComposite = profile.torsoCm + profile.armCm;
  const flexibilityBonus = (profile.flexibilityScore - 5) * 2.2;
  return torsoArmComposite * 2.45 + flexibilityBonus;
}

function optionScore(profile: RiderProfile, option: BikeSizeOption): number {
  const stackTarget = idealStack(profile);
  const reachTarget = idealReach(profile);

  const stackDelta = Math.abs(option.stackMm - stackTarget);
  const reachDelta = Math.abs(option.reachMm - reachTarget);
  const topTubeTarget = profile.torsoCm * 3.6 + profile.armCm * 1.3;
  const topTubeDelta = Math.abs(option.topTubeMm - topTubeTarget);

  return clamp(100 - stackDelta * 0.08 - reachDelta * 0.11 - topTubeDelta * 0.03, 0, 100);
}

export function recommendBikeSize(profile: RiderProfile, options: BikeSizeOption[]): SizeRecommendation {
  if (options.length === 0) {
    throw new Error("At least one bike size option is required");
  }

  const rankedOptions = options
    .map((option) => ({
      frameLabel: option.frameLabel,
      fitScore: Number(optionScore(profile, option).toFixed(2))
    }))
    .sort((a, b) => b.fitScore - a.fitScore);

  const [best, secondBest] = rankedOptions;
  const confidence = secondBest ? clamp(best.fitScore - secondBest.fitScore + 55, 35, 99) : 99;

  return {
    recommendedFrame: best.frameLabel,
    confidence: Number(confidence.toFixed(1)),
    rankedOptions,
    rationale: [
      "Recommendation balances stack and reach against rider anthropometrics.",
      "Flexibility score adjusts aggressive vs endurance posture fit window.",
      "Discipline bias applies geometry preference for riding style."
    ]
  };
}
