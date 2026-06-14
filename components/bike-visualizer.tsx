"use client";

import { Canvas } from "@react-three/fiber";
import type { FitRecommendation, TenantTheme } from "@/lib/domain/types";

function Tube({
  position,
  rotation,
  length,
  color
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[0.035, 0.035, length, 24]} />
      <meshStandardMaterial color={color} metalness={0.35} roughness={0.28} />
    </mesh>
  );
}

function BikeModel({
  recommendation,
  theme
}: {
  recommendation?: FitRecommendation;
  theme: TenantTheme;
}) {
  const reachScale = recommendation ? recommendation.stemLengthMm / 90 : 1;
  const stackScale = recommendation ? recommendation.saddleHeightMm / 720 : 1;

  return (
    <group rotation={[0, -0.35, 0]} position={[0, -0.65, 0]}>
      <mesh position={[-1.05, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.025, 18, 80]} />
        <meshStandardMaterial color="#dbeafe" roughness={0.35} />
      </mesh>
      <mesh position={[1.05, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.025, 18, 80]} />
        <meshStandardMaterial color="#dbeafe" roughness={0.35} />
      </mesh>
      <Tube position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} length={1.6 * reachScale} color={theme.primary} />
      <Tube position={[-0.35, 0.3, 0]} rotation={[0, 0, -0.72]} length={1.15} color={theme.primary} />
      <Tube position={[0.4, 0.32, 0]} rotation={[0, 0, 0.77]} length={1.2} color={theme.primary} />
      <Tube position={[0.0, 0.05, 0]} rotation={[0, 0, 1.18]} length={1.35} color={theme.accent} />
      <Tube position={[-0.7, 0.42 * stackScale, 0]} rotation={[0, 0, 0]} length={1.1 * stackScale} color={theme.accent} />
      <Tube position={[0.86, 0.44, 0]} rotation={[0, 0, -0.28]} length={0.96} color={theme.primary} />
      <Tube position={[1.15, 0.74, 0]} rotation={[0, 0, Math.PI / 2]} length={0.48} color="#f8fafc" />
      <mesh position={[-0.78, 1.0 * stackScale, 0]} scale={[0.45, 0.08, 0.18]}>
        <boxGeometry />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.09, 24, 24]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}

export function BikeVisualizer({
  recommendation,
  theme
}: {
  recommendation?: FitRecommendation;
  theme: TenantTheme;
}) {
  return (
    <div className="card visualizer" aria-label="Interactive 3D bicycle fit visualization">
      <Canvas camera={{ position: [0, 1.25, 4.2], fov: 42 }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 6, 4]} intensity={1.4} />
        <pointLight position={[-3, 2, 3]} intensity={0.8} color={theme.accent} />
        <BikeModel recommendation={recommendation} theme={theme} />
      </Canvas>
    </div>
  );
}
