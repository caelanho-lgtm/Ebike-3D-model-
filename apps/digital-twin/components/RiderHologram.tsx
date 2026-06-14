'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { FitResult, Point } from '@/lib/fitEngine/calculateFit';
import type { RiderSex } from '@/lib/store/fitStore';

const S = 0.001; // mm → metres

/** A capsule "bone" between two 3D points. */
function Bone({
  a,
  b,
  radius,
  color,
  wireframe,
}: {
  a: THREE.Vector3;
  b: THREE.Vector3;
  radius: number;
  color: string;
  wireframe: boolean;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = Math.max(0.001, dir.length());
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return { position: mid, quaternion: q, length: len };
  }, [a, b]);

  const capLen = Math.max(0.001, length - radius * 2);
  return (
    <mesh position={position} quaternion={quaternion}>
      <capsuleGeometry args={[radius, capLen, 6, 16]} />
      {wireframe ? (
        <meshBasicMaterial color={color} wireframe transparent opacity={0.6} />
      ) : (
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.34}
          roughness={0.3}
          metalness={0.1}
          depthWrite={false}
        />
      )}
    </mesh>
  );
}

function Blob({
  at,
  radius,
  color,
  wireframe,
}: {
  at: THREE.Vector3;
  radius: number;
  color: string;
  wireframe: boolean;
}) {
  return (
    <mesh position={at}>
      <sphereGeometry args={[radius, 20, 20]} />
      {wireframe ? (
        <meshBasicMaterial color={color} wireframe transparent opacity={0.6} />
      ) : (
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          transparent
          opacity={0.36}
          roughness={0.25}
          depthWrite={false}
        />
      )}
    </mesh>
  );
}

interface Proportions {
  torsoR: number;
  pelvisR: number;
  headR: number;
  upperArmR: number;
  foreArmR: number;
  thighR: number;
  shankR: number;
  shoulderZ: number;
  hipZ: number;
  armZ: number;
}

const MALE: Proportions = {
  torsoR: 0.12, pelvisR: 0.105, headR: 0.092, upperArmR: 0.046, foreArmR: 0.04,
  thighR: 0.062, shankR: 0.046, shoulderZ: 0.105, hipZ: 0.085, armZ: 0.12,
};
const FEMALE: Proportions = {
  torsoR: 0.105, pelvisR: 0.115, headR: 0.086, upperArmR: 0.04, foreArmR: 0.035,
  thighR: 0.058, shankR: 0.04, shoulderZ: 0.092, hipZ: 0.1, armZ: 0.108,
};

export interface RiderHologramProps {
  fit: FitResult;
  sex: RiderSex;
  wireframe: boolean;
  color?: string;
}

/**
 * A volumetric, anatomically-proportioned holographic rider posed from the fit
 * engine's solved joints. Two legs (bottom/top of the pedal stroke) and two
 * arms are offset in z so the figure reads as a 3D human rather than a stick.
 */
export function RiderHologram({ fit, sex, wireframe, color = '#22d3ee' }: RiderHologramProps) {
  const p = sex === 'female' ? FEMALE : MALE;
  const j = fit.joints;

  const vec = (pt: Point, z: number) => new THREE.Vector3(pt.x * S, pt.y * S, z);
  const ankleTop: Point = { x: 0, y: -j.ankleBottom.y };

  const hip = vec(j.hip, 0);
  const shoulder = vec(j.shoulder, 0);
  const head = vec(j.head, 0);

  // Near/far legs at the two crank positions.
  const hipNear = vec(j.hip, p.hipZ);
  const hipFar = vec(j.hip, -p.hipZ);
  const kneeNear = vec(j.kneeBottom, p.hipZ);
  const ankleNear = vec(j.ankleBottom, p.hipZ);
  const kneeFar = vec(j.kneeTop, -p.hipZ);
  const ankleFar = vec(ankleTop, -p.hipZ);

  // Near/far arms.
  const shoulderNear = vec(j.shoulder, p.shoulderZ);
  const shoulderFar = vec(j.shoulder, -p.shoulderZ);
  const handNear = vec(j.hand, p.armZ * 0.6);
  const handFar = vec(j.hand, -p.armZ * 0.6);
  // Elbow ≈ midpoint dropped slightly for a natural bend.
  const elbow = (sh: THREE.Vector3, hd: THREE.Vector3, z: number) =>
    new THREE.Vector3((sh.x + hd.x) / 2 + 0.02, (sh.y + hd.y) / 2 - 0.03, z);

  return (
    <group>
      {/* Torso + pelvis + head */}
      <Bone a={hip} b={shoulder} radius={p.torsoR} color={color} wireframe={wireframe} />
      <Blob at={hip} radius={p.pelvisR} color={color} wireframe={wireframe} />
      <Blob at={shoulder} radius={p.torsoR * 0.85} color={color} wireframe={wireframe} />
      <Bone a={shoulder} b={head} radius={p.upperArmR} color={color} wireframe={wireframe} />
      <Blob at={head} radius={p.headR} color={color} wireframe={wireframe} />

      {/* Far leg (top of stroke) */}
      <Bone a={hipFar} b={kneeFar} radius={p.thighR} color={color} wireframe={wireframe} />
      <Bone a={kneeFar} b={ankleFar} radius={p.shankR} color={color} wireframe={wireframe} />
      {/* Near leg (bottom of stroke) */}
      <Bone a={hipNear} b={kneeNear} radius={p.thighR} color={color} wireframe={wireframe} />
      <Bone a={kneeNear} b={ankleNear} radius={p.shankR} color={color} wireframe={wireframe} />
      <Blob at={kneeNear} radius={p.shankR * 1.1} color={color} wireframe={wireframe} />

      {/* Far arm */}
      <Bone a={shoulderFar} b={elbow(shoulderFar, handFar, -p.armZ * 0.6)} radius={p.upperArmR} color={color} wireframe={wireframe} />
      <Bone a={elbow(shoulderFar, handFar, -p.armZ * 0.6)} b={handFar} radius={p.foreArmR} color={color} wireframe={wireframe} />
      {/* Near arm */}
      <Bone a={shoulderNear} b={elbow(shoulderNear, handNear, p.armZ * 0.6)} radius={p.upperArmR} color={color} wireframe={wireframe} />
      <Bone a={elbow(shoulderNear, handNear, p.armZ * 0.6)} b={handNear} radius={p.foreArmR} color={color} wireframe={wireframe} />
    </group>
  );
}
