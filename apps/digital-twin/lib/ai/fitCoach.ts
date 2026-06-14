/**
 * AI Fit Coach (MVP mock).
 *
 * Deterministic, rule-based generator that turns a fit result into natural-
 * language coaching. The interface is intentionally shaped like an LLM response
 * so it can be swapped for a real model later without touching the UI.
 */

import type { FitResult } from '../fitEngine/calculateFit';
import type { BikeModel, FrameSize } from '../geometry/bikeGeometry';

export interface FitInsight {
  title: string;
  detail: string;
  tone: 'positive' | 'neutral' | 'caution';
}

export interface FitRecommendation {
  action: string;
  rationale: string;
}

export interface FitCoachResponse {
  summary: string;
  insights: FitInsight[];
  recommendations: FitRecommendation[];
}

export interface FitCoachContext {
  fit: FitResult;
  bike?: BikeModel;
  size?: FrameSize;
}

function scoreSummary(score: number): string {
  if (score >= 88) return 'This is an excellent, well-balanced fit.';
  if (score >= 74) return 'This is a solid fit with only minor refinements available.';
  if (score >= 58) return 'This fit is workable but has a few areas worth adjusting.';
  return 'This position needs meaningful adjustment before long rides.';
}

export function generateFitCoaching(ctx: FitCoachContext): FitCoachResponse {
  const { fit, bike, size } = ctx;
  const insights: FitInsight[] = [];
  const recommendations: FitRecommendation[] = [];

  // Knee extension.
  if (fit.kneeAngle >= 138 && fit.kneeAngle <= 150) {
    insights.push({
      title: 'Knee extension is in the ideal window',
      detail: `Your knee angle of ${fit.kneeAngle}° at the bottom of the pedal stroke sits in the 138–150° range associated with efficient power transfer and low joint stress.`,
      tone: 'positive',
    });
  } else if (fit.kneeAngle < 138) {
    insights.push({
      title: 'Saddle may be a touch low',
      detail: `A knee angle of ${fit.kneeAngle}° is more bent than ideal, which can reduce pedalling efficiency and load the knees.`,
      tone: 'caution',
    });
    recommendations.push({
      action: 'Raise the saddle by 5–10 mm',
      rationale: 'Opens the knee angle toward the efficient 145° target.',
    });
  } else {
    insights.push({
      title: 'Saddle may be a touch high',
      detail: `A knee angle of ${fit.kneeAngle}° is quite open; very high saddles can cause hip rocking and posterior knee strain.`,
      tone: 'caution',
    });
    recommendations.push({
      action: 'Lower the saddle by 5–10 mm',
      rationale: 'Brings knee extension back toward 145° and stabilises the pelvis.',
    });
  }

  // Back / aggressiveness.
  if (fit.backAngle < 42) {
    insights.push({
      title: 'Aggressive, aerodynamic torso',
      detail: `Your back angle of ${fit.backAngle}° is low and aero. This is fast but demands good flexibility and core strength to sustain.`,
      tone: 'neutral',
    });
    recommendations.push({
      action: 'Consider raising the bars 10–15 mm if you feel lower-back fatigue',
      rationale: 'Reduces strain over long durations without a big aero cost.',
    });
  } else if (fit.backAngle > 52) {
    insights.push({
      title: 'Upright, comfort-oriented torso',
      detail: `A back angle of ${fit.backAngle}° is relaxed and comfortable, ideal for endurance and casual riding.`,
      tone: 'positive',
    });
  } else {
    insights.push({
      title: 'Balanced torso angle',
      detail: `A back angle of ${fit.backAngle}° balances comfort and performance well.`,
      tone: 'positive',
    });
  }

  // Reach / shoulder.
  const stretched = fit.warnings.some((w) => w.field === 'reach' && w.severity === 'critical');
  if (stretched) {
    insights.push({
      title: 'Cockpit runs long',
      detail: `The reach of ${fit.reach} mm leaves the rider stretched, which can cause shoulder and neck fatigue and numb hands on long rides.`,
      tone: 'caution',
    });
    recommendations.push({
      action: 'Fit a shorter stem (−10 to −20 mm) or size down',
      rationale: 'Shortens the reach to a sustainable shoulder angle.',
    });
  }

  // Hip angle.
  if (fit.hipAngle < 42) {
    insights.push({
      title: 'Closed hip angle',
      detail: `A hip angle of ${fit.hipAngle}° at the top of the stroke is tight and can limit power and breathing.`,
      tone: 'caution',
    });
    recommendations.push({
      action: 'Move the saddle back 5 mm and/or raise the bars',
      rationale: 'Opens the hip to free up the top of the pedal stroke.',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      action: 'Lock in this position and ride it',
      rationale: 'All key joint angles are within healthy ranges — no change needed.',
    });
  }

  const bikeLabel = bike ? `${bike.brand} ${bike.name}${size ? ` (size ${size})` : ''}` : 'this setup';
  const summary = `${scoreSummary(fit.fitScore)} On ${bikeLabel}, your fit score is ${fit.fitScore}/100 with a ${fit.kneeAngle}° knee, ${fit.hipAngle}° hip and ${fit.backAngle}° back angle.`;

  return { summary, insights, recommendations };
}
