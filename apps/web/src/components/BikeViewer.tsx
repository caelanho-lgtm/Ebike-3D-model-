import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, Line, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { FitCoordinatesDto, FrameGeometryDto } from '@fitwerx/shared';

/** All inputs are in mm; we render in metres (×0.001). */
const S = 0.001;
const WHEEL_RADIUS = 340; // mm, ~700c road
const BB_DROP = 70; // mm BB below axle line
const AXLE_Y = BB_DROP; // axle height above BB
const deg = (d: number) => (d * Math.PI) / 180;

type Pt = [number, number, number];
const v = (xMm: number, yMm: number): Pt => [xMm * S, yMm * S, 0];

/** A frame tube rendered as an oriented cylinder between two points (mm). */
function Tube({
  a,
  b,
  radius = 14,
  color = '#1f2937',
}: {
  a: [number, number];
  b: [number, number];
  radius?: number;
  color?: string;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const start = new THREE.Vector3(a[0] * S, a[1] * S, 0);
    const end = new THREE.Vector3(b[0] * S, b[1] * S, 0);
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return { position: mid, quaternion: q, length: len };
  }, [a, b]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius * S, radius * S, length, 16]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
    </mesh>
  );
}

function Wheel({ center, color = '#111827' }: { center: [number, number]; color?: string }) {
  return (
    <mesh position={v(center[0], center[1])} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[WHEEL_RADIUS * S, 7 * S, 12, 48]} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
    </mesh>
  );
}

function Joint({ at, color = '#f59e0b', r = 22 }: { at: [number, number]; color?: string; r?: number }) {
  return (
    <mesh position={v(at[0], at[1])}>
      <sphereGeometry args={[r * S, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export interface BikeViewerProps {
  geometry: FrameGeometryDto;
  fit: FitCoordinatesDto;
  /** Component solution to visualise the cockpit, if available. */
  stemLength?: number;
  spacerStack?: number;
  primaryColor?: string;
  showRider?: boolean;
}

/**
 * Parametric side-profile bike rendered in 3D from frame geometry + the rider's
 * fit coordinates, with an overlaid rider posture. Drag to orbit.
 */
export function BikeViewer({
  geometry,
  fit,
  primaryColor = '#0EA5E9',
  showRider = true,
}: BikeViewerProps) {
  const pts = useMemo(() => {
    const hta = geometry.headTubeAngle;
    const sta = geometry.seatTubeAngle;
    const htl = geometry.headTubeLength ?? 150;

    const bb: [number, number] = [0, 0];
    // Saddle: up the seat tube. Horizontal behind BB = saddleHeight·cos(STA).
    const saddleY = fit.saddleHeight * Math.sin(deg(sta));
    const saddleX = -fit.saddleHeight * Math.cos(deg(sta));
    const saddle: [number, number] = [saddleX, saddleY];

    // Seat-tube top (where the post leaves the frame) — a bit below the saddle.
    const seatTubeTopLen = fit.saddleHeight * 0.62;
    const stTop: [number, number] = [
      -seatTubeTopLen * Math.cos(deg(sta)),
      seatTubeTopLen * Math.sin(deg(sta)),
    ];

    const headTop: [number, number] = [geometry.reach, geometry.stack];
    const headBottom: [number, number] = [
      geometry.reach + htl * Math.cos(deg(hta)),
      geometry.stack - htl * Math.sin(deg(hta)),
    ];

    // Front axle: extend steering axis to the axle line, plus fork rake.
    const dropToAxle = geometry.stack - AXLE_Y;
    const frontAxle: [number, number] = [
      geometry.reach + dropToAxle / Math.tan(deg(hta)) + 50,
      AXLE_Y,
    ];
    const rearAxle: [number, number] = [
      -Math.sqrt(Math.max(0, 435 * 435 - (AXLE_Y - 0) ** 2)),
      AXLE_Y,
    ];

    const bar: [number, number] = [fit.targetReach, fit.targetStack];

    return { bb, saddle, stTop, headTop, headBottom, frontAxle, rearAxle, bar };
  }, [geometry, fit]);

  const rider = useMemo(() => {
    const hip = pts.saddle;
    const bar = pts.bar;
    // Shoulder sits forward of the hip and elevated; arms reach to the bars.
    const shoulder: [number, number] = [
      hip[0] + (bar[0] - hip[0]) * 0.5,
      hip[1] + (bar[1] - hip[1]) * 0.18 + 230,
    ];
    const head: [number, number] = [
      shoulder[0] + 60,
      shoulder[1] + 150,
    ];
    // Knee: forward of hip, mid-height to the BB.
    const knee: [number, number] = [
      pts.bb[0] + 120,
      (hip[1] + pts.bb[1]) / 2 + 30,
    ];
    return { hip, shoulder, head, knee, bar, bb: pts.bb };
  }, [pts]);

  return (
    <Canvas
      camera={{ position: [0.4, 0.9, 2.4], fov: 42 }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0b1220']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 4, 3]} intensity={1.1} castShadow />
      <directionalLight position={[-2, 2, -1]} intensity={0.3} />

      <group position={[0, -0.1, 0]}>
        {/* Wheels */}
        <Wheel center={pts.rearAxle} />
        <Wheel center={pts.frontAxle} />

        {/* Frame */}
        <Tube a={pts.bb} b={pts.stTop} color="#374151" />
        <Tube a={pts.stTop} b={pts.headTop} color={primaryColor} radius={15} />
        <Tube a={pts.bb} b={pts.headBottom} color={primaryColor} radius={17} />
        <Tube a={pts.headTop} b={pts.headBottom} color="#9ca3af" radius={16} />
        {/* Seat stays / chain stays */}
        <Tube a={pts.stTop} b={pts.rearAxle} color="#374151" radius={10} />
        <Tube a={pts.bb} b={pts.rearAxle} color="#374151" radius={11} />
        {/* Fork */}
        <Tube a={pts.headBottom} b={pts.frontAxle} color="#9ca3af" radius={11} />
        {/* Seatpost + saddle */}
        <Tube a={pts.stTop} b={pts.saddle} color="#111827" radius={9} />
        <Tube
          a={[pts.saddle[0] - 70, pts.saddle[1]]}
          b={[pts.saddle[0] + 70, pts.saddle[1]]}
          color="#1f2937"
          radius={12}
        />
        {/* Stem + bars (head top -> bar) */}
        <Tube a={pts.headTop} b={pts.bar} color="#111827" radius={10} />
        <Joint at={pts.bar} color={primaryColor} r={20} />
        <Joint at={pts.bb} color="#f59e0b" r={16} />

        {/* Rider posture overlay */}
        {showRider && (
          <group>
            <Line points={[v(...rider.hip), v(...rider.shoulder)]} color="#22d3ee" lineWidth={3} />
            <Line points={[v(...rider.shoulder), v(...rider.bar)]} color="#22d3ee" lineWidth={3} />
            <Line points={[v(...rider.hip), v(...rider.knee)]} color="#22d3ee" lineWidth={3} />
            <Line points={[v(...rider.knee), v(...rider.bb)]} color="#22d3ee" lineWidth={3} />
            <Joint at={rider.hip} color="#22d3ee" r={26} />
            <Joint at={rider.shoulder} color="#22d3ee" r={24} />
            <Joint at={rider.knee} color="#67e8f9" r={20} />
            <mesh position={v(...rider.head)}>
              <sphereGeometry args={[95 * S, 20, 20]} />
              <meshStandardMaterial color="#22d3ee" />
            </mesh>
          </group>
        )}

        {/* Saddle height label */}
        <Text
          position={[pts.saddle[0] * S - 0.18, pts.saddle[1] * S + 0.05, 0]}
          fontSize={0.05}
          color="#e2e8f0"
          anchorX="right"
        >
          {`Saddle ${Math.round(fit.saddleHeight)}mm`}
        </Text>
      </group>

      <Grid
        position={[0, (-(WHEEL_RADIUS - AXLE_Y)) * S - 0.1, 0]}
        args={[6, 6]}
        cellSize={0.2}
        cellColor="#1e293b"
        sectionColor="#334155"
        fadeDistance={8}
        infiniteGrid
      />
      <OrbitControls enablePan target={[0.2, 0.4, 0]} maxDistance={6} minDistance={1} />
    </Canvas>
  );
}
