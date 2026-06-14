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

export interface RiderProfile extends RiderAnthropometrics {
  name?: string;
  sex: RiderSex;
}

interface UiState {
  showRider: boolean;
  wireframe: boolean;
  autoRotate: boolean;
}

interface FitStore {
  rider: RiderProfile;
  bikeId: string;
  size: FrameSize;
  compareBikeId: string;
  compareSize: FrameSize;
  params: FitParameters;
  fit: FitResult;
  ui: UiState;

  setRider: (patch: Partial<RiderProfile>) => void;
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

function defaultsFor(rider: RiderProfile, bikeId: string, size: FrameSize): FitParameters {
  const geo = getGeometry(bikeId, size) ?? INITIAL_BIKE.sizes[INITIAL_SIZE];
  return deriveDefaultFit(rider, geo);
}

function fitFor(rider: RiderProfile, params: FitParameters): FitResult {
  return calculateFit(rider, params);
}

const initialParams = defaultsFor(DEFAULT_RIDER, INITIAL_BIKE.id, INITIAL_SIZE);

export const useFitStore = create<FitStore>((set, get) => ({
  rider: DEFAULT_RIDER,
  bikeId: INITIAL_BIKE.id,
  size: INITIAL_SIZE,
  compareBikeId: BIKE_CATALOG[0].id,
  compareSize: 'M',
  params: initialParams,
  fit: fitFor(DEFAULT_RIDER, initialParams),
  ui: { showRider: true, wireframe: false, autoRotate: false },

  setRider: (patch) => {
    const rider = { ...get().rider, ...patch };
    // Re-derive cockpit defaults so the position tracks the new body, then
    // recompute the fit.
    const params = defaultsFor(rider, get().bikeId, get().size);
    set({ rider, params, fit: fitFor(rider, params) });
  },

  selectBike: (bikeId, size) => {
    const rider = get().rider;
    const params = defaultsFor(rider, bikeId, size);
    set({ bikeId, size, params, fit: fitFor(rider, params) });
  },

  setSize: (size) => {
    const { rider, bikeId } = get();
    const params = defaultsFor(rider, bikeId, size);
    set({ size, params, fit: fitFor(rider, params) });
  },

  setParam: (key, value) => {
    const params = { ...get().params, [key]: value } as FitParameters;
    set({ params, fit: fitFor(get().rider, params) });
  },

  setCompare: (compareBikeId, compareSize) => set({ compareBikeId, compareSize }),

  setUi: (patch) => set({ ui: { ...get().ui, ...patch } }),

  resetFit: () => {
    const { rider, bikeId, size } = get();
    const params = defaultsFor(rider, bikeId, size);
    set({ params, fit: fitFor(rider, params) });
  },
}));
