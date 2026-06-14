import type { ReactElement } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function BikeFrame(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[1.2, 0.09, 16, 64]} />
        <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[1.35, -0.1, 0]}>
        <torusGeometry args={[0.55, 0.08, 16, 64]} />
        <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.8, -0.1, 0]}>
        <torusGeometry args={[0.55, 0.08, 16, 64]} />
        <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

export function BikeScene(): ReactElement {
  return (
    <Canvas camera={{ position: [2.6, 1.8, 2.1], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 2]} intensity={1.2} />
      <BikeFrame />
      <OrbitControls enablePan={false} />
    </Canvas>
  );
}
