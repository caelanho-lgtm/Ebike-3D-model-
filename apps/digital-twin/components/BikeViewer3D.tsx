'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Grid, Html, Line, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  deriveFramePoints,
  getBike,
  getGeometry,
  type BikeGeometry,
  type Point2D,
} from '@/lib/geometry/bikeGeometry';
import type { FitResult } from '@/lib/fitEngine/calculateFit';
import { useFitStore } from '@/lib/store/fitStore';
import { RiderHologram } from './RiderHologram';

const S = 0.001;
const toVec = (p: { x: number; y: number }, z = 0) =>
  new THREE.Vector3(p.x * S, p.y * S, z);

function Tube({
  a,
  b,
  radius = 14,
  color = '#cbd5e1',
  metalness = 0.85,
}: {
  a: Point2D;
  b: Point2D;
  radius?: number;
  color?: string;
  metalness?: number;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const start = toVec(a);
    const end = toVec(b);
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = Math.max(0.001, dir.length());
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return { position: mid, quaternion: q, length: len };
  }, [a, b]);
  return (
    <mesh position={position} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius * S, radius * S, length, 20]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={0.3} />
    </mesh>
  );
}

function Wheel({ center, radius }: { center: Point2D; radius: number }) {
  return (
    <group position={toVec(center)}>
      <mesh>
        <torusGeometry args={[radius * S, 8 * S, 14, 56]} />
        <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh>
        <torusGeometry args={[radius * S * 0.62, 2 * S, 10, 48]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function GLBBike({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function ProceduralBike({
  geo,
  wheelRadius,
  fit,
  primary,
}: {
  geo: BikeGeometry;
  wheelRadius: number;
  fit: FitResult;
  primary: string;
}) {
  const fp = useMemo(() => deriveFramePoints(geo), [geo]);
  const saddle: Point2D = fit.joints.hip;
  const bar: Point2D = fit.joints.hand;

  return (
    <group>
      <Wheel center={fp.rearAxle} radius={wheelRadius} />
      <Wheel center={fp.frontAxle} radius={wheelRadius} />
      <Tube a={fp.bb} b={fp.seatTubeTop} color="#94a3b8" radius={16} />
      <Tube a={fp.seatTubeTop} b={fp.headTopFrame} color={primary} radius={15} metalness={0.6} />
      <Tube a={fp.bb} b={fp.headBottom} color={primary} radius={18} metalness={0.6} />
      <Tube a={fp.headTopFrame} b={fp.headBottom} color="#e2e8f0" radius={16} />
      <Tube a={fp.seatTubeTop} b={fp.rearAxle} color="#94a3b8" radius={11} />
      <Tube a={fp.bb} b={fp.rearAxle} color="#94a3b8" radius={12} />
      <Tube a={fp.headBottom} b={fp.frontAxle} color="#e2e8f0" radius={12} />
      <Tube a={fp.seatTubeTop} b={saddle} color="#1f2937" radius={10} />
      <Tube a={{ x: saddle.x - 75, y: saddle.y }} b={{ x: saddle.x + 60, y: saddle.y }} color="#0f172a" radius={13} />
      <Tube a={fp.headTopFrame} b={bar} color="#1f2937" radius={11} />
      <mesh position={toVec(bar)}>
        <sphereGeometry args={[20 * S, 16, 16]} />
        <meshStandardMaterial color={primary} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={toVec(fp.bb)}>
        <sphereGeometry args={[18 * S, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

/** A single CAD-style dimension: line + end ticks + a floating value label. */
function Dimension({
  from,
  to,
  off,
  label,
  color = '#22d3ee',
}: {
  from: Point2D;
  to: Point2D;
  off: Point2D;
  label: string;
  color?: string;
}) {
  const a = { x: from.x + off.x, y: from.y + off.y };
  const b = { x: to.x + off.x, y: to.y + off.y };
  // Perpendicular unit for tick marks.
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = (-dy / len) * 28;
  const py = (dx / len) * 28;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

  return (
    <group>
      {/* extension lines from the object to the dimension line */}
      <Line points={[toVec(from), toVec(a)]} color="#1f3a4d" lineWidth={1} />
      <Line points={[toVec(to), toVec(b)]} color="#1f3a4d" lineWidth={1} />
      {/* main dimension line + ticks */}
      <Line points={[toVec(a), toVec(b)]} color={color} lineWidth={1.5} />
      <Line points={[toVec({ x: a.x + px, y: a.y + py }), toVec({ x: a.x - px, y: a.y - py })]} color={color} lineWidth={1.5} />
      <Line points={[toVec({ x: b.x + px, y: b.y + py }), toVec({ x: b.x - px, y: b.y - py })]} color={color} lineWidth={1.5} />
      <Html position={toVec(mid)} center distanceFactor={2.6} zIndexRange={[10, 0]}>
        <div
          style={{
            background: 'rgba(8,14,26,0.9)',
            border: '1px solid rgba(34,211,238,0.5)',
            color: '#a5f3fc',
            borderRadius: 6,
            padding: '2px 7px',
            fontSize: 12,
            fontFamily: 'ui-monospace, monospace',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

function DimensionLines({
  geo,
  wheelRadius,
  fit,
}: {
  geo: BikeGeometry;
  wheelRadius: number;
  fit: FitResult;
}) {
  const fp = useMemo(() => deriveFramePoints(geo), [geo]);
  const groundY = fp.axleY - wheelRadius;
  const xLeft = fp.rearAxle.x - wheelRadius;
  const xRight = fp.frontAxle.x + wheelRadius;
  const topY = Math.max(fit.joints.hip.y, fit.joints.hand.y, fp.headTopFrame.y);
  const cm = (mm: number) => `${Math.round(mm / 10)} cm`;

  return (
    <group>
      {/* Overall length (bottom) */}
      <Dimension
        from={{ x: xLeft, y: groundY }}
        to={{ x: xRight, y: groundY }}
        off={{ x: 0, y: -110 }}
        label={`L  ${cm(xRight - xLeft)}`}
      />
      {/* Overall height (right) */}
      <Dimension
        from={{ x: xRight, y: groundY }}
        to={{ x: xRight, y: topY }}
        off={{ x: 70, y: 0 }}
        label={`H  ${cm(topY - groundY)}`}
      />
      {/* Saddle height along the seat tube (left) */}
      <Dimension
        from={fp.bb}
        to={fit.joints.hip}
        off={{ x: -120, y: 0 }}
        label={`Saddle  ${fit.saddleHeight} mm`}
        color="#7dd3fc"
      />
    </group>
  );
}

export interface ViewerApi {
  zoom: (factor: number) => void;
  fit: () => void;
}

type OrbitLike = { target: THREE.Vector3; update: () => void };

function CameraController({ apiRef }: { apiRef: React.MutableRefObject<ViewerApi | null> }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null;

  useEffect(() => {
    if (!controls) return;
    apiRef.current = {
      zoom: (factor) => {
        const t = controls.target;
        const dir = camera.position.clone().sub(t);
        const next = THREE.MathUtils.clamp(dir.length() * factor, 1.1, 7);
        dir.setLength(next);
        camera.position.copy(t.clone().add(dir));
        controls.update();
      },
      fit: () => {
        camera.position.set(0.7, 0.7, 2.6);
        controls.target.set(0.25, 0.25, 0);
        controls.update();
      },
    };
  }, [camera, controls, apiRef]);

  return null;
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-medium backdrop-blur transition ${
        active
          ? 'bg-holo/20 text-holo ring-1 ring-holo/50'
          : 'bg-black/40 text-slate-300 ring-1 ring-edge hover:bg-black/60'
      }`}
    >
      {children}
    </button>
  );
}

export interface BikeViewer3DProps {
  primaryColor?: string;
  glbUrl?: string;
  className?: string;
}

/**
 * Store-driven 3D viewer with a Shapr3D-style interface: zoom in/out/fit
 * controls, view toggles, and CAD-style length/height/saddle dimension
 * annotations on the model.
 */
export function BikeViewer3D({ primaryColor = '#0ea5e9', glbUrl, className }: BikeViewer3DProps) {
  const bikeId = useFitStore((s) => s.bikeId);
  const size = useFitStore((s) => s.size);
  const fit = useFitStore((s) => s.fit);
  const ui = useFitStore((s) => s.ui);
  const sex = useFitStore((s) => s.rider.sex);
  const setUi = useFitStore((s) => s.setUi);
  const setRider = useFitStore((s) => s.setRider);

  const apiRef = useRef<ViewerApi | null>(null);
  const bike = getBike(bikeId);
  const geo = getGeometry(bikeId, size);

  if (!bike || !geo) {
    return <div className="flex h-full items-center justify-center text-slate-400">Bike not found</div>;
  }

  return (
    <div className={`relative touch-none ${className ?? ''}`} style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0.7, 0.7, 2.6], fov: 42 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#070b16']} />
        <fog attach="fog" args={['#070b16', 4, 11]} />
        <ambientLight intensity={0.6} />
        <hemisphereLight args={['#a5c8ff', '#0b1220', 0.6]} />
        <directionalLight position={[3, 5, 4]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#7c3aed" />

        <group position={[0, -0.35, 0]} rotation={[0, -0.15, 0]}>
          <Suspense fallback={null}>
            {glbUrl ? (
              <GLBBike url={glbUrl} />
            ) : (
              <ProceduralBike geo={geo} wheelRadius={bike.wheelRadius} fit={fit} primary={primaryColor} />
            )}
          </Suspense>
          {ui.showRider && <RiderHologram fit={fit} sex={sex} wireframe={ui.wireframe} />}
          {ui.showDimensions && <DimensionLines geo={geo} wheelRadius={bike.wheelRadius} fit={fit} />}
        </group>

        <Grid
          position={[0, -0.36, 0]}
          args={[12, 12]}
          cellSize={0.25}
          cellColor="#16223c"
          sectionColor="#243149"
          fadeDistance={11}
          infiniteGrid
        />
        <OrbitControls
          makeDefault
          enablePan
          enableDamping
          dampingFactor={0.08}
          autoRotate={ui.autoRotate}
          autoRotateSpeed={0.8}
          minDistance={1.1}
          maxDistance={7}
          target={[0.25, 0.25, 0]}
        />
        <CameraController apiRef={apiRef} />
      </Canvas>

      {/* View toggles (top-left) */}
      <div className="pointer-events-auto absolute left-3 top-3 flex flex-wrap gap-1.5">
        <ToggleChip active={ui.showDimensions} onClick={() => setUi({ showDimensions: !ui.showDimensions })}>
          Dimensions
        </ToggleChip>
        <ToggleChip active={ui.showRider} onClick={() => setUi({ showRider: !ui.showRider })}>
          Rider
        </ToggleChip>
        <ToggleChip active={ui.wireframe} onClick={() => setUi({ wireframe: !ui.wireframe })}>
          Wireframe
        </ToggleChip>
      </div>

      {/* Rider sex + spin (top-right) */}
      <div className="absolute right-3 top-3 flex gap-1.5">
        <ToggleChip active={sex === 'male'} onClick={() => setRider({ sex: 'male' })}>
          M
        </ToggleChip>
        <ToggleChip active={sex === 'female'} onClick={() => setRider({ sex: 'female' })}>
          F
        </ToggleChip>
        <ToggleChip active={ui.autoRotate} onClick={() => setUi({ autoRotate: !ui.autoRotate })}>
          ↻
        </ToggleChip>
      </div>

      {/* Zoom cluster (bottom-right), Shapr3D-style */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        <button
          aria-label="Zoom in"
          onClick={() => apiRef.current?.zoom(0.8)}
          className="grid h-9 w-9 place-items-center rounded-md bg-black/50 text-lg text-slate-200 ring-1 ring-edge backdrop-blur hover:bg-black/70"
        >
          +
        </button>
        <button
          aria-label="Zoom out"
          onClick={() => apiRef.current?.zoom(1.25)}
          className="grid h-9 w-9 place-items-center rounded-md bg-black/50 text-lg text-slate-200 ring-1 ring-edge backdrop-blur hover:bg-black/70"
        >
          −
        </button>
        <button
          aria-label="Fit to view"
          onClick={() => apiRef.current?.fit()}
          className="grid h-9 w-9 place-items-center rounded-md bg-black/50 text-sm text-slate-200 ring-1 ring-edge backdrop-blur hover:bg-black/70"
        >
          ⤢
        </button>
      </div>

      {/* Scale hint (bottom-left) */}
      <div className="absolute bottom-3 left-3 rounded-md bg-black/40 px-2 py-1 text-[11px] text-slate-400 ring-1 ring-edge backdrop-blur">
        Scroll / pinch to zoom · drag to orbit
      </div>
    </div>
  );
}
