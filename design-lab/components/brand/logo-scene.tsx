"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/**
 * The real RARE OUD emblem (vectorized from public/brand/mark-master.png),
 * extruded into a lit 3D object. Camera is fit to the model's bounding
 * SPHERE (not its box) with explicit padding, so no rotation angle can
 * push geometry past the frustum edges — the clipping the owner flagged
 * in the static-HTML build came from a fixed camera distance that only
 * cleared the model's flattest silhouette, not its rotated extremes.
 */

function LogoMesh({ scrollProgress }: { scrollProgress?: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [geometries, setGeometries] = useState<THREE.ExtrudeGeometry[] | null>(null);

  useEffect(() => {
    const loader = new SVGLoader();
    let cancelled = false;
    loader.load("/brand/logo-mark.svg", (data) => {
      if (cancelled) return;
      const geoms: THREE.ExtrudeGeometry[] = [];
      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: 14,
        bevelEnabled: true,
        bevelThickness: 1.1,
        bevelSize: 0.9,
        bevelSegments: 4,
        curveSegments: 16,
      };
      data.paths.forEach((path) => {
        const shapes = SVGLoader.createShapes(path);
        shapes.forEach((shape) => {
          geoms.push(new THREE.ExtrudeGeometry(shape, extrudeSettings));
        });
      });

      // center + normalize scale, then fit the camera to the bounding SPHERE
      const tmp = new THREE.Group();
      geoms.forEach((g) => tmp.add(new THREE.Mesh(g)));
      const box = new THREE.Box3().setFromObject(tmp);
      const center = box.getCenter(new THREE.Vector3());
      geoms.forEach((g) => g.translate(-center.x, -center.y, -center.z));

      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const radius = sphere.radius || 1;
      const scale = 5.2 / radius; // normalize so the model's bounding sphere radius is ~5.2 units
      geoms.forEach((g) => g.scale(scale, scale, scale));

      // re-measure the SCALED bounding sphere and fit the perspective camera
      // to it with 22% padding, so full rotation on any axis never clips.
      const box2 = new THREE.Box3();
      geoms.forEach((g) => box2.union(new THREE.Box3().setFromBufferAttribute(g.attributes.position as THREE.BufferAttribute)));
      const sphere2 = box2.getBoundingSphere(new THREE.Sphere());
      const persp = camera as THREE.PerspectiveCamera;
      const fitDistance = (sphere2.radius * 1.22) / Math.sin((persp.fov * Math.PI) / 360);
      persp.position.set(0, 0, fitDistance);
      persp.near = fitDistance - sphere2.radius * 2;
      persp.far = fitDistance + sphere2.radius * 2;
      persp.updateProjectionMatrix();

      setGeometries(geoms);
      return () => {
        cancelled = true;
      };
    });
  }, [camera]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.22 + (scrollProgress?.current ?? 0) * 0.002;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.07;
  });

  if (!geometries) return null;

  return (
    <group ref={groupRef}>
      <group ref={innerRef} rotation={[Math.PI, 0, 0]}>
        {geometries.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial color="#8566a8" metalness={0.35} roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Particles() {
  const positions = useMemo(() => {
    const arr = new Float32Array(140 * 3);
    for (let i = 0; i < 140; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 22;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 22;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.03;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f4e7d8" size={0.05} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

export function LogoScene({
  className,
  scrollProgress,
}: {
  className?: string;
  scrollProgress?: React.RefObject<number>;
}) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (reduced) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/logo-mark.svg"
        alt=""
        className={className}
        style={{ filter: "invert(1)", opacity: 0.9 }}
      />
    );
  }

  return (
    <Canvas
      className={className}
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: 32, position: [0, 0, 14] }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.9} color="#3a2a4a" />
      <directionalLight position={[5, 6, 8]} intensity={2.2} color="#f4e7d8" />
      <directionalLight position={[-6, -3, -4]} intensity={1.4} color="#c9b2e3" />
      <Suspense fallback={null}>
        <LogoMesh scrollProgress={scrollProgress} />
        <Particles />
      </Suspense>
    </Canvas>
  );
}
