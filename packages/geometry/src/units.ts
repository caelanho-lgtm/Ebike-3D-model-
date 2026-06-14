/**
 * Unit conversions for the display ↔ SI boundary.
 *
 * Geometry charts are published in millimetres and degrees; the canonical model
 * and everything downstream work in SI (metres, radians). Per CLAUDE.md,
 * conversion happens ONLY at boundaries like this one — never deeper in.
 */

export const mmToMetres = (mm: number): number => mm / 1000;
export const metresToMm = (m: number): number => m * 1000;
export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;
