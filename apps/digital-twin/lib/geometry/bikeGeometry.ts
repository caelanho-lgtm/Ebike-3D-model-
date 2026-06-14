/**
 * Bicycle geometry domain model and catalog.
 *
 * All lengths are millimetres, all angles degrees. Geometry is data-driven —
 * no component hardcodes frame numbers; everything derives from these records.
 */

export type FrameSize = 'S' | 'M' | 'L' | 'XL';
export const FRAME_SIZES: FrameSize[] = ['S', 'M', 'L', 'XL'];

export type Discipline =
  | 'road_race'
  | 'road_endurance'
  | 'gravel'
  | 'mtb_xc'
  | 'tt_triathlon';

export interface BikeGeometry {
  /** Vertical BB → head-tube-top, mm. */
  stack: number;
  /** Horizontal BB → head-tube-top, mm. */
  reach: number;
  seatTubeAngle: number;
  headTubeAngle: number;
  /** Chainstay length, mm. */
  chainstay: number;
  /** Wheelbase, mm. */
  wheelbase: number;
  /** Stock crank length, mm. */
  crankLength: number;
  /** Stock stem length, mm. */
  stemLength: number;
  /** Head-tube length, mm. */
  headTubeLength: number;
  /** Effective (horizontal) top tube, mm. */
  topTube: number;
  /** Manufacturer rider-height window, cm. */
  riderHeightCm: [number, number];
}

export interface BikeModel {
  id: string;
  brand: string;
  name: string;
  discipline: Discipline;
  /** Wheel radius incl. tyre, mm (affects 3D + standover). */
  wheelRadius: number;
  sizes: Record<FrameSize, BikeGeometry>;
}

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  road_race: 'Road — Race',
  road_endurance: 'Road — Endurance',
  gravel: 'Gravel',
  mtb_xc: 'MTB — Cross-Country',
  tt_triathlon: 'Time Trial / Tri',
};

export const BIKE_CATALOG: BikeModel[] = [
  {
    id: 'aero-pro',
    brand: 'Aether',
    name: 'Aero Pro',
    discipline: 'road_race',
    wheelRadius: 340,
    sizes: {
      S: { stack: 525, reach: 386, seatTubeAngle: 74, headTubeAngle: 72.5, chainstay: 410, wheelbase: 985, crankLength: 170, stemLength: 90, headTubeLength: 120, topTube: 540, riderHeightCm: [162, 172] },
      M: { stack: 545, reach: 393, seatTubeAngle: 73.5, headTubeAngle: 73, chainstay: 410, wheelbase: 995, crankLength: 172.5, stemLength: 100, headTubeLength: 145, topTube: 555, riderHeightCm: [171, 180] },
      L: { stack: 565, reach: 400, seatTubeAngle: 73, headTubeAngle: 73.5, chainstay: 412, wheelbase: 1005, crankLength: 172.5, stemLength: 110, headTubeLength: 170, topTube: 570, riderHeightCm: [179, 188] },
      XL: { stack: 587, reach: 407, seatTubeAngle: 73, headTubeAngle: 73.5, chainstay: 415, wheelbase: 1018, crankLength: 175, stemLength: 120, headTubeLength: 200, topTube: 585, riderHeightCm: [187, 197] },
    },
  },
  {
    id: 'granfondo',
    brand: 'Aether',
    name: 'Granfondo',
    discipline: 'road_endurance',
    wheelRadius: 345,
    sizes: {
      S: { stack: 562, reach: 384, seatTubeAngle: 73.5, headTubeAngle: 72, chainstay: 415, wheelbase: 1000, crankLength: 170, stemLength: 90, headTubeLength: 155, topTube: 545, riderHeightCm: [164, 174] },
      M: { stack: 583, reach: 390, seatTubeAngle: 73, headTubeAngle: 73, chainstay: 415, wheelbase: 1008, crankLength: 172.5, stemLength: 100, headTubeLength: 180, topTube: 560, riderHeightCm: [173, 183] },
      L: { stack: 605, reach: 397, seatTubeAngle: 73, headTubeAngle: 73.5, chainstay: 418, wheelbase: 1018, crankLength: 172.5, stemLength: 100, headTubeLength: 210, topTube: 575, riderHeightCm: [182, 191] },
      XL: { stack: 630, reach: 405, seatTubeAngle: 72.5, headTubeAngle: 73.5, chainstay: 420, wheelbase: 1030, crankLength: 175, stemLength: 110, headTubeLength: 245, topTube: 592, riderHeightCm: [190, 200] },
    },
  },
  {
    id: 'terra-gravel',
    brand: 'Aether',
    name: 'Terra',
    discipline: 'gravel',
    wheelRadius: 360,
    sizes: {
      S: { stack: 560, reach: 375, seatTubeAngle: 74, headTubeAngle: 71, chainstay: 425, wheelbase: 1025, crankLength: 170, stemLength: 80, headTubeLength: 150, topTube: 540, riderHeightCm: [160, 172] },
      M: { stack: 585, reach: 388, seatTubeAngle: 73.5, headTubeAngle: 71.5, chainstay: 425, wheelbase: 1035, crankLength: 172.5, stemLength: 90, headTubeLength: 175, topTube: 558, riderHeightCm: [170, 182] },
      L: { stack: 610, reach: 400, seatTubeAngle: 73, headTubeAngle: 72, chainstay: 428, wheelbase: 1048, crankLength: 172.5, stemLength: 100, headTubeLength: 205, topTube: 575, riderHeightCm: [180, 191] },
      XL: { stack: 635, reach: 412, seatTubeAngle: 72.5, headTubeAngle: 72, chainstay: 430, wheelbase: 1060, crankLength: 175, stemLength: 100, headTubeLength: 235, topTube: 592, riderHeightCm: [189, 200] },
    },
  },
  {
    id: 'summit-xc',
    brand: 'Aether',
    name: 'Summit XC',
    discipline: 'mtb_xc',
    wheelRadius: 367,
    sizes: {
      S: { stack: 595, reach: 415, seatTubeAngle: 75, headTubeAngle: 67.5, chainstay: 435, wheelbase: 1130, crankLength: 170, stemLength: 60, headTubeLength: 95, topTube: 575, riderHeightCm: [155, 168] },
      M: { stack: 610, reach: 440, seatTubeAngle: 75, headTubeAngle: 67.5, chainstay: 435, wheelbase: 1155, crankLength: 175, stemLength: 70, headTubeLength: 110, topTube: 600, riderHeightCm: [167, 178] },
      L: { stack: 625, reach: 465, seatTubeAngle: 74.5, headTubeAngle: 67.5, chainstay: 438, wheelbase: 1180, crankLength: 175, stemLength: 70, headTubeLength: 125, topTube: 625, riderHeightCm: [177, 188] },
      XL: { stack: 640, reach: 490, seatTubeAngle: 74.5, headTubeAngle: 67.5, chainstay: 440, wheelbase: 1205, crankLength: 175, stemLength: 80, headTubeLength: 140, topTube: 650, riderHeightCm: [187, 200] },
    },
  },
  {
    id: 'velox-tt',
    brand: 'Aether',
    name: 'Velox TT',
    discipline: 'tt_triathlon',
    wheelRadius: 340,
    sizes: {
      S: { stack: 505, reach: 405, seatTubeAngle: 78, headTubeAngle: 72, chainstay: 405, wheelbase: 985, crankLength: 165, stemLength: 80, headTubeLength: 105, topTube: 525, riderHeightCm: [160, 172] },
      M: { stack: 525, reach: 420, seatTubeAngle: 77.5, headTubeAngle: 72.5, chainstay: 408, wheelbase: 998, crankLength: 170, stemLength: 90, headTubeLength: 125, topTube: 540, riderHeightCm: [171, 183] },
      L: { stack: 545, reach: 435, seatTubeAngle: 77, headTubeAngle: 73, chainstay: 410, wheelbase: 1012, crankLength: 172.5, stemLength: 100, headTubeLength: 150, topTube: 558, riderHeightCm: [182, 195] },
      XL: { stack: 565, reach: 448, seatTubeAngle: 77, headTubeAngle: 73, chainstay: 412, wheelbase: 1025, crankLength: 175, stemLength: 100, headTubeLength: 175, topTube: 572, riderHeightCm: [193, 203] },
    },
  },
];

export function getBike(id: string): BikeModel | undefined {
  return BIKE_CATALOG.find((b) => b.id === id);
}

export function getGeometry(id: string, size: FrameSize): BikeGeometry | undefined {
  return getBike(id)?.sizes[size];
}

const deg = (d: number) => (d * Math.PI) / 180;

/** A 2D point in the bike's side-profile plane (mm), origin at the bottom bracket. */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Derive the key frame coordinates (relative to the BB) used to build the 3D
 * scene. Keeping this here means the renderer contains no geometry constants.
 */
export function deriveFramePoints(
  geo: BikeGeometry,
  bbDrop = 70,
): {
  bb: Point2D;
  headTopFrame: Point2D;
  headBottom: Point2D;
  seatTubeTop: Point2D;
  rearAxle: Point2D;
  frontAxle: Point2D;
  axleY: number;
} {
  const bb: Point2D = { x: 0, y: 0 };
  const axleY = bbDrop;
  const headTopFrame: Point2D = { x: geo.reach, y: geo.stack };
  const headBottom: Point2D = {
    x: geo.reach + geo.headTubeLength * Math.cos(deg(geo.headTubeAngle)),
    y: geo.stack - geo.headTubeLength * Math.sin(deg(geo.headTubeAngle)),
  };
  const seatTubeTopLen = geo.stack * 0.92;
  const seatTubeTop: Point2D = {
    x: -seatTubeTopLen * Math.cos(deg(geo.seatTubeAngle)),
    y: seatTubeTopLen * Math.sin(deg(geo.seatTubeAngle)),
  };
  const rearAxle: Point2D = {
    x: -Math.sqrt(Math.max(0, geo.chainstay ** 2 - (axleY - bb.y) ** 2)),
    y: axleY,
  };
  const frontAxle: Point2D = { x: rearAxle.x + geo.wheelbase, y: axleY };
  return { bb, headTopFrame, headBottom, seatTubeTop, rearAxle, frontAxle, axleY };
}

export { deg as toRadians };
