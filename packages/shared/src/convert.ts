import type { RiderInput } from '@fitwerx/fit-engine';
import type { RiderInputDto } from './measurements.js';

const INCH_TO_CM = 2.54;

/**
 * Convert a client-supplied rider DTO into the millimetre-based input expected
 * by the fit engine. Handles metric (cm) and imperial (inches) unit systems.
 */
export function toEngineRider(dto: RiderInputDto): RiderInput {
  const factorToMm = dto.units === 'imperial' ? INCH_TO_CM * 10 : 10;
  const m = dto.measurements;
  const scale = (v: number | undefined): number | undefined =>
    v === undefined ? undefined : Math.round(v * factorToMm);

  return {
    measurements: {
      height: Math.round(m.height * factorToMm),
      inseam: scale(m.inseam),
      torso: scale(m.torso),
      armLength: scale(m.armLength),
      shoulderWidth: scale(m.shoulderWidth),
      sitBoneWidth: scale(m.sitBoneWidth),
      femur: scale(m.femur),
      lowerLeg: scale(m.lowerLeg),
      footLength: scale(m.footLength),
    },
    profile: {
      discipline: dto.profile.discipline,
      flexibility: dto.profile.flexibility,
      experience: dto.profile.experience,
      age: dto.profile.age,
      sex: dto.profile.sex,
    },
  };
}
