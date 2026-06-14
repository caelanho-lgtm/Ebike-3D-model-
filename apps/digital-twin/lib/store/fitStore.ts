'use client';

import { create } from 'zustand';
import {
  BIKE_CATALOG,
  getGeometry,
  type FrameSize,
} from '../geometry/bikeGeometry';
import {
  calculateFit,
  deriveDefaultFit,
  type FitParameters,
  type FitResult,
  type Flexibility,
  type RiderAnthropometrics,
} from '../fitEngine/calculateFit';

export type RiderSex = 'male' | 'female';

/** Consumer-friendly riding-style preset (replaces flexibility/experience knobs). */
export type RidingStyle = 'comfort' | 'balanced' | 'performance';

export interface RiderProfile extends RiderAnthropometrics {
  name?: string;
  sex: RiderSex;
}

interface UiState {
  showRider: boolean;
  wireframe: boolean;
  autoRotate: boolean;
  showDimensions: boolean;
}

/** How each style maps to flexibility + a bar-height offset (mm, + = higher/comfier). */
const STYLE_MAP: Record<RidingStyle, { flexibility: Flexibility; barOffset: number }> = {
  comfort: { flexibility: 'low', barOffset: 35 },
  balanced: { flexibility: 'medium', barOffset: 0 },
  performance: { flexibility: 'high', barOffset: -35 },
};

interface FitStore {
  rider: RiderProfile;
  style: RidingStyle;
  bikeId: string;
  size: FrameSize;
  compareBikeId: string;
  compareSize: FrameSize;
  params: FitParameters;
  fit: FitResult;
  ui: UiState;

  setRider: (patch: Partial<RiderProfile>) => void;
  setStyle: (style: RidingStyle) => void;
  selectBike: (bikeId: string, size: FrameSize) => void;
  setSize: (size: FrameSize) => void;
  setParam: <K extends keyof FitParameters>(key: K, value: FitParameters[K]) => void;
  setCompare: (bikeId: string, size: FrameSize) => void;
  setUi: (patch: Partial<UiState>) => void;
  resetFit: () => void;
}

const DEFAULT_RIDER: RiderProfile = {
  name: '',
  height: 1780,
  inseam: 830,
  armLength: undefined,
  torsoLength: undefined,
  flexibility: 'medium' as Flexibility,
  sex: 'male',
};

const INITIAL_BIKE = BIKE_CATALOG[1]; // Granfondo
const INITIAL_SIZE: FrameSize = 'M';
const INITIAL_STYLE: RidingStyle = 'balanced';

function defaultsFor(
  rider: RiderProfile,
  style: RidingStyle,
  bikeId: string,
  size: FrameSize,
): FitParameters {
  const geo = getGeometry(bikeId, size) ?? INITIAL_BIKE.sizes[INITIAL_SIZE];
  const base = deriveDefaultFit(rider, geo);
  // Apply the riding-style bar-height offset (comfort raises the bars).
  return { ...base, handlebarHeight: base.handlebarHeight + STYLE_MAP[style].barOffset };
}

function fitFor(rider: RiderProfile, params: FitParameters): FitResult {
  return calculateFit(rider, params);
}

const initialParams = defaultsFor(DEFAULT_RIDER, INITIAL_STYLE, INITIAL_BIKE.id, INITIAL_SIZE);

export const useFitStore = create<FitStore>((set, get) => ({
  rider: DEFAULT_RIDER,
  style: INITIAL_STYLE,
  bikeId: INITIAL_BIKE.id,
  size: INITIAL_SIZE,
  compareBikeId: BIKE_CATALOG[0].id,
  compareSize: 'M',
  params: initialParams,
  fit: fitFor(DEFAULT_RIDER, initialParams),
  ui: { showRider: true, wireframe: false, autoRotate: false, showDimensions: true },

  setRider: (patch) => {
    const rider = { ...get().rider, ...patch };
    const { style, bikeId, size } = get();
    const params = defaultsFor(rider, style, bikeId, size);
    set({ rider, params, fit: fitFor(rider, params) });
  },

  setStyle: (style) => {
    const rider = { ...get().rider, flexibility: STYLE_MAP[style].flexibility };
    const params = defaultsFor(rider, style, get().bikeId, get().size);
    set({ style, rider, params, fit: fitFor(rider, params) });
  },

  selectBike: (bikeId, size) => {
    const { rider, style } = get();
    const params = defaultsFor(rider, style, bikeId, size);
    set({ bikeId, size, params, fit: fitFor(rider, params) });
  },

  setSize: (size) => {
    const { rider, style, bikeId } = get();
    const params = defaultsFor(rider, style, bikeId, size);
    set({ size, params, fit: fitFor(rider, params) });
  },

  setParam: (key, value) => {
    const params = { ...get().params, [key]: value } as FitParameters;
    set({ params, fit: fitFor(get().rider, params) });
  },

  setCompare: (compareBikeId, compareSize) => set({ compareBikeId, compareSize }),

  setUi: (patch) => set({ ui: { ...get().ui, ...patch } }),

  resetFit: () => {
    const { rider, style, bikeId, size } = get();
    const params = defaultsFor(rider, style, bikeId, size);
    set({ params, fit: fitFor(rider, params) });
  },
}));
