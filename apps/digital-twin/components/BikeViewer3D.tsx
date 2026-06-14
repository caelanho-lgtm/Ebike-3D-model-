'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  deriveFramePoints,
  getBike,
  getGeometry,
  type BikeGeometry,
  type FrameSize,
  type Point2D,
} from '@/lib/geometry/bikeGeometry';
import type { FitResult } from '@/lib/fitEngine/calculateFit';
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

/** Optional GLB bike model (white-label brands can supply their own). */
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

      {/* Main triangle */}
      <Tube a={fp.bb} b={fp.seatTubeTop} color="#94a3b8" radius={16} />
      <Tube a={fp.seatTubeTop} b={fp.headTopFrame} color={primary} radius={15} metalness={0.6} />
      <Tube a={fp.bb} b={fp.headBottom} color={primary} radius={18} metalness={0.6} />
      <Tube a={fp.headTopFrame} b={fp.headBottom} color="#e2e8f0" radius={16} />

      {/* Rear triangle */}
      <Tube a={fp.seatTubeTop} b={fp.rearAxle} color="#94a3b8" radius={11} />
      <Tube a={fp.bb} b={fp.rearAxle} color="#94a3b8" radius={12} />
      {/* Fork */}
      <Tube a={fp.headBottom} b={fp.frontAxle} color="#e2e8f0" radius={12} />

      {/* Seatpost + saddle */}
      <Tube a={fp.seatTubeTop} b={saddle} color="#1f2937" radius={10} />
      <Tube a={{ x: saddle.x - 75, y: saddle.y }} b={{ x: saddle.x + 60, y: saddle.y }} color="#0f172a" radius={13} />

      {/* Stem + bar */}
      <Tube a={fp.headTopFrame} b={bar} color="#1f2937" radius={11} />
      <mesh position={toVec(bar)}>
        <sphereGeometry args={[20 * S, 16, 16]} />
        <meshStandardMaterial color={primary} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Crank + BB marker */}
      <mesh position={toVec(fp.bb)}>
        <sphereGeometry args={[18 * S, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

export interface BikeViewer3DProps {
  bikeId: string;
  size: FrameSize;
  fit: FitResult;
  showRider: boolean;
  wireframe: boolean;
  riderSex: 'male' | 'female';
  autoRotate?: boolean;
  primaryColor?: string;
  /** If provided, render this GLB instead of the procedural frame. */
  glbUrl?: string;
  className?: string;
}

export function BikeViewer3D({
  bikeId,
  size,
  fit,
  showRider,
  wireframe,
  riderSex,
  autoRotate = false,
  primaryColor = '#0ea5e9',
  glbUrl,
  className,
}: BikeViewer3DProps) {
  const bike = getBike(bikeId);
  const geo = getGeometry(bikeId, size);
  if (!bike || !geo) {
    return <div className="flex h-full items-center justify-center text-slate-400">Bike not found</div>;
  }

  return (
    <div className={`touch-none ${className ?? ''}`} style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0.7, 0.7, 2.6], fov: 42 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#070b16']} />
        <fog attach="fog" args={['#070b16', 4, 10]} />
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
          {showRider && <RiderHologram fit={fit} sex={riderSex} wireframe={wireframe} />}
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
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
          minDistance={1.1}
          maxDistance={7}
          target={[0.25, 0.25, 0]}
        />
      </Canvas>
    </div>
  );
}
