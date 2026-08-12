"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { type ReactNode, useRef } from "react";
import * as THREE from "three";
import {
  anvilShapes,
  applyEmblemUv,
  extrude,
  makeAiMask,
  makeCoverEngraving,
  makeFieldEngraving,
  makeGlobeEngraving,
  makePageEngraving,
  makeStudioEnvironment,
  py,
  px,
  roundedFrameShape,
  roundedRectShape,
  shieldOuterShape,
  shieldRimShape,
} from "./emblem-3d-assets";

/** Master cycle, in seconds. Every track below returns to its start value. */
const LOOP = 7;

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** Eased keyframe track: stops are [phase, value], phase in 0..1. */
function track(p: number, stops: Array<[number, number]>) {
  if (p <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i += 1) {
    const [t1, v1] = stops[i];
    const [t0, v0] = stops[i - 1];
    if (p <= t1) {
      const span = t1 - t0;
      const local = span <= 0 ? 1 : (p - t0) / span;
      return v0 + (v1 - v0) * smoothstep(local);
    }
  }
  return stops[stops.length - 1][1];
}

/** 0 at the edges, 1 in the middle of the window. */
function flash(p: number, start: number, end: number) {
  if (p < start || p > end) return 0;
  const local = (p - start) / (end - start);
  return Math.sin(local * Math.PI);
}

const BOOK_SPINE_X = 135;
const BOOK_Y = 112;
const COVER_W = 34;
const COVER_H = 46;
const COVER_T = 3.4;
const HINGE_Z = 4.5;

const CHIP_X = 144;
const CHIP_Y = 275;
const GLOBE_X = 258;
const GLOBE_Y = 274;
const GLOBE_R = 26;

/** [x1, y1, x2, y2] in emblem space, plus the dot at the outer end. */
const CIRCUIT_LEGS: Array<[number, number, number, number, number, number]> = [
  [122, 265, 108, 265, 104, 265],
  [122, 276, 108, 276, 104, 276],
  [122, 287, 108, 287, 104, 287],
  [166, 265, 180, 265, 184, 265],
  [166, 276, 180, 276, 184, 276],
  [166, 287, 180, 287, 184, 287],
  [132, 256, 132, 242, 132, 238],
  [144, 256, 144, 242, 144, 238],
  [156, 256, 156, 242, 156, 238],
  [132, 294, 132, 308, 132, 312],
  [144, 294, 144, 308, 144, 312],
  [156, 294, 156, 308, 156, 312],
];

/** Legs that carry a travelling pulse, with their phase offset. */
const PULSE_LEGS = [
  { leg: CIRCUIT_LEGS[1], start: 0.42 },
  { leg: CIRCUIT_LEGS[7], start: 0.45 },
  { leg: CIRCUIT_LEGS[3], start: 0.48 },
  { leg: CIRCUIT_LEGS[10], start: 0.51 },
];
const PULSE_SPAN = 0.12;

/**
 * Geometry, materials, and engraving maps are built once per page load and kept
 * outside React so the frame loop can animate material properties directly.
 */
function createAssets() {
  const fieldAo = makeFieldEngraving("ao");
  fieldAo.channel = 0;
  const textures = {
    field: makeFieldEngraving("bump"),
    fieldAo,
    globe: makeGlobeEngraving(),
    page: makePageEngraving(),
    cover: makeCoverEngraving(),
    ai: makeAiMask(),
  };

  const geometries = {
    slab: applyEmblemUv(extrude(shieldOuterShape(), 22, 1.2, 48)),
    rim: extrude(shieldRimShape(), 11, 1.4, 48),
    anvil: extrude(anvilShapes(), 8, 0.7),
    chipFrame: extrude(roundedFrameShape(44, 38, 4, 34, 28, 2.5), 7, 0.7),
    chipDie: extrude(roundedRectShape(34, 28, 2.5), 5, 0.5),
    cover: extrude(roundedRectShape(COVER_W, COVER_H, 2.5), COVER_T, 0.6, 8),
    pages: extrude(roundedRectShape(28, 38, 1.5), 2.2, 0.5, 6),
    leaf: extrude(roundedRectShape(28, 38, 1.5), 0.7, 0.25, 6),
    hammerHead: new THREE.BoxGeometry(28, 14, 12),
    hammerFace: new THREE.BoxGeometry(6, 18, 13),
    handle: new THREE.CylinderGeometry(3.2, 3.2, 32, 20),
    globe: new THREE.SphereGeometry(GLOBE_R, 64, 48),
    globeRim: new THREE.TorusGeometry(23.2, 1.4, 12, 96),
    dot: new THREE.SphereGeometry(2.4, 20, 16),
    pulse: new THREE.SphereGeometry(2.2, 16, 12),
    sparkCore: new THREE.SphereGeometry(2.6, 20, 16),
    sparkShard: new THREE.BoxGeometry(1.1, 5.5, 1.1),
    aiPlane: new THREE.PlaneGeometry(26, 16),
  };

  const materials = {
    gold: new THREE.MeshPhysicalMaterial({
      color: "#e0b45c",
      metalness: 1,
      roughness: 0.24,
      envMapIntensity: 1.3,
    }),
    polished: new THREE.MeshPhysicalMaterial({
      color: "#eac578",
      metalness: 1,
      roughness: 0.15,
      envMapIntensity: 1.5,
    }),
    field: new THREE.MeshPhysicalMaterial({
      color: "#c69b47",
      metalness: 1,
      roughness: 0.34,
      envMapIntensity: 1.05,
      bumpMap: textures.field,
      bumpScale: 0.55,
      aoMap: textures.fieldAo,
      aoMapIntensity: 0.85,
    }),
    cover: new THREE.MeshPhysicalMaterial({
      color: "#dfb35c",
      metalness: 1,
      roughness: 0.28,
      envMapIntensity: 1.25,
      bumpMap: textures.cover,
      bumpScale: 0.45,
    }),
    paper: new THREE.MeshPhysicalMaterial({
      color: "#f2e3b8",
      metalness: 0.7,
      roughness: 0.4,
      envMapIntensity: 0.9,
      bumpMap: textures.page,
      bumpScale: 0.4,
    }),
    globe: new THREE.MeshPhysicalMaterial({
      color: "#d9ad55",
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 1.3,
      bumpMap: textures.globe,
      bumpScale: 0.6,
    }),
    die: new THREE.MeshPhysicalMaterial({
      color: "#0a0e18",
      metalness: 0.6,
      roughness: 0.42,
      envMapIntensity: 0.7,
    }),
    pulse: new THREE.MeshStandardMaterial({
      color: "#fff3d0",
      emissive: "#ffd77a",
      emissiveIntensity: 6,
      toneMapped: false,
    }),
    spark: new THREE.MeshStandardMaterial({
      color: "#fff8e4",
      emissive: "#ffdf9c",
      emissiveIntensity: 9,
      toneMapped: false,
    }),
  };

  return { textures, geometries, materials };
}

let assets: ReturnType<typeof createAssets> | null = null;

function emblemAssets() {
  assets ??= createAssets();
  return assets;
}

let environmentMap: THREE.Texture | null = null;

/** Prefiltered once per page load; gold needs reflections to read as metal. */
function studioEnvironment(gl: THREE.WebGLRenderer) {
  if (!environmentMap) {
    const source = makeStudioEnvironment();
    const pmrem = new THREE.PMREMGenerator(gl);
    environmentMap = pmrem.fromEquirectangular(source).texture;
    pmrem.dispose();
    source.dispose();
  }
  return environmentMap;
}

function StudioEnvironment() {
  const gl = useThree((state) => state.gl);
  return <primitive object={studioEnvironment(gl)} attach="environment" />;
}

function Emblem() {
  const frontCover = useRef<THREE.Group>(null);
  const leafA = useRef<THREE.Group>(null);
  const leafB = useRef<THREE.Group>(null);
  const hammer = useRef<THREE.Group>(null);
  const spark = useRef<THREE.Group>(null);
  const sparkLight = useRef<THREE.PointLight>(null);
  const globe = useRef<THREE.Group>(null);
  const pulses = useRef<Array<THREE.Mesh | null>>([]);
  const aiMaterial = useRef<THREE.MeshStandardMaterial>(null);

  const { geometries, materials, textures } = emblemAssets();

  useFrame(({ clock }) => {
    const p = (clock.getElapsedTime() % LOOP) / LOOP;

    // 1 — the book opens, holds, then closes
    const open = track(p, [
      [0, 0],
      [0.04, 0],
      [0.24, 1],
      [0.62, 1],
      [0.82, 0],
      [1, 0],
    ]);
    const openA = track(p, [
      [0, 0],
      [0.06, 0],
      [0.27, 1],
      [0.62, 1],
      [0.8, 0],
      [1, 0],
    ]);
    const openB = track(p, [
      [0, 0],
      [0.08, 0],
      [0.3, 1],
      [0.62, 1],
      [0.78, 0],
      [1, 0],
    ]);
    if (frontCover.current) frontCover.current.rotation.y = -Math.PI * 0.985 * open;
    if (leafA.current) leafA.current.rotation.y = -Math.PI * 0.97 * openA;
    if (leafB.current) leafB.current.rotation.y = -Math.PI * 0.955 * openB;

    // 2 — one controlled hammer strike, with a spark at contact
    if (hammer.current) {
      hammer.current.rotation.z = track(p, [
        [0, 0],
        [0.28, 0],
        [0.34, -0.087],
        [0.385, 0.17],
        [0.415, 0.115],
        [0.5, 0],
        [1, 0],
      ]);
    }
    const hit = flash(p, 0.376, 0.44);
    if (spark.current) {
      spark.current.visible = hit > 0.002;
      spark.current.scale.setScalar(0.35 + hit * 1.15);
    }
    if (sparkLight.current) sparkLight.current.intensity = hit * 30;

    // 3 — pulses travel the circuit, the AI die glows
    PULSE_LEGS.forEach(({ leg, start }, index) => {
      const mesh = pulses.current[index];
      if (!mesh) return;
      const u = (p - start) / PULSE_SPAN;
      if (u < 0 || u > 1) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.set(
        px(leg[0] + (leg[2] - leg[0]) * u),
        py(leg[1] + (leg[3] - leg[1]) * u),
        4.4,
      );
      mesh.scale.setScalar(0.55 + Math.sin(u * Math.PI) * 0.55);
    });
    if (aiMaterial.current) {
      aiMaterial.current.emissiveIntensity = track(p, [
        [0, 0.2],
        [0.4, 0.2],
        [0.51, 1.7],
        [0.63, 0.2],
        [1, 0.2],
      ]);
    }

    // 4 — the globe turns once per cycle, so the loop point is invisible
    if (globe.current) globe.current.rotation.y = p * Math.PI * 2;
  });

  return (
    <group scale={0.01}>
      {/* Shield: struck plate with a raised frame around a recessed field */}
      <mesh
        geometry={geometries.slab}
        material={materials.field}
        position={[0, 0, -22]}
        receiveShadow
      />
      <mesh geometry={geometries.rim} material={materials.polished} castShadow receiveShadow />

      {/* 1 — KNOWLEDGE */}
      <mesh
        geometry={geometries.cover}
        material={materials.cover}
        position={[px(BOOK_SPINE_X + COVER_W / 2), py(BOOK_Y), 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geometries.pages}
        material={materials.paper}
        position={[px(BOOK_SPINE_X + 17.5), py(BOOK_Y), 3.4]}
        castShadow
        receiveShadow
      />
      <group ref={leafB} position={[px(BOOK_SPINE_X), py(BOOK_Y), HINGE_Z]}>
        <mesh
          geometry={geometries.leaf}
          material={materials.paper}
          position={[16, 0, -0.35]}
          castShadow
          receiveShadow
        />
      </group>
      <group ref={leafA} position={[px(BOOK_SPINE_X), py(BOOK_Y), HINGE_Z]}>
        <mesh
          geometry={geometries.leaf}
          material={materials.paper}
          position={[16, 0, 0.4]}
          castShadow
          receiveShadow
        />
      </group>
      <group ref={frontCover} position={[px(BOOK_SPINE_X), py(BOOK_Y), HINGE_Z]}>
        <mesh
          geometry={geometries.cover}
          material={materials.cover}
          position={[COVER_W / 2, 0, 1.1]}
          castShadow
          receiveShadow
        />
      </group>

      {/* 2 — CRAFTSMANSHIP */}
      <mesh geometry={geometries.anvil} material={materials.gold} castShadow receiveShadow />
      <group ref={hammer} position={[px(289), py(71), 6]}>
        <mesh
          geometry={geometries.handle}
          material={materials.gold}
          position={[-11.5, -11, 0]}
          rotation={[0, 0, 2.334]}
          castShadow
        />
        <group position={[-33, -27, 0]} rotation={[0, 0, -0.829]}>
          <mesh geometry={geometries.hammerHead} material={materials.polished} castShadow />
          <mesh
            geometry={geometries.hammerFace}
            material={materials.polished}
            position={[12.5, 0, 0]}
            castShadow
          />
        </group>
      </group>
      <group ref={spark} position={[px(272), py(118), 10]} visible={false}>
        <mesh geometry={geometries.sparkCore} material={materials.spark} />
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return (
            <mesh
              key={deg}
              geometry={geometries.sparkShard}
              material={materials.spark}
              position={[Math.cos(a) * 6, Math.sin(a) * 6, 0]}
              rotation={[0, 0, a - Math.PI / 2]}
            />
          );
        })}
        <pointLight
          ref={sparkLight}
          color="#ffdda0"
          intensity={0}
          distance={120}
          decay={2}
        />
      </group>

      {/* 3 — INNOVATION */}
      {CIRCUIT_LEGS.map(([x1, y1, x2, y2, dx, dy]) => {
        const horizontal = y1 === y2;
        const length = Math.abs(horizontal ? x2 - x1 : y2 - y1);
        return (
          <group key={`leg-${x1}-${y1}-${x2}-${y2}`}>
            <mesh
              material={materials.gold}
              position={[px((x1 + x2) / 2), py((y1 + y2) / 2), 1.5]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={horizontal ? [length, 3, 3] : [3, length, 3]} />
            </mesh>
            <mesh
              geometry={geometries.dot}
              material={materials.gold}
              position={[px(dx), py(dy), 2]}
              castShadow
              receiveShadow
            />
          </group>
        );
      })}
      {PULSE_LEGS.map(({ leg }, index) => (
        <mesh
          key={`pulse-${leg[0]}-${leg[1]}`}
          ref={(mesh) => {
            pulses.current[index] = mesh;
          }}
          geometry={geometries.pulse}
          material={materials.pulse}
          visible={false}
        />
      ))}
      <mesh
        geometry={geometries.chipFrame}
        material={materials.gold}
        position={[px(CHIP_X), py(CHIP_Y), 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geometries.chipDie}
        material={materials.die}
        position={[px(CHIP_X), py(CHIP_Y), 0]}
        receiveShadow
      />
      <mesh geometry={geometries.aiPlane} position={[px(CHIP_X), py(CHIP_Y), 5.2]}>
        <meshStandardMaterial
          ref={aiMaterial}
          color="#f6dd9e"
          emissive="#ffca55"
          emissiveIntensity={0.2}
          metalness={0.9}
          roughness={0.3}
          alphaMap={textures.ai}
          transparent
          alphaTest={0.45}
        />
      </mesh>

      {/* 4 — GLOBAL LEADERSHIP */}
      <group ref={globe} position={[px(GLOBE_X), py(GLOBE_Y), -12]}>
        <mesh geometry={geometries.globe} material={materials.globe} castShadow receiveShadow />
      </group>
      <mesh
        geometry={geometries.globeRim}
        material={materials.polished}
        position={[px(GLOBE_X), py(GLOBE_Y), 0.4]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

/**
 * Three.js build of the emblem: a die-struck gold shield with engraved
 * lettering, real extruded relief, and the same 7s seamless choreography as the
 * SVG version. The camera is locked front-on and the shield never moves.
 */
export function FoundryEmblem3D({ fallback }: { fallback?: ReactNode }) {
  return (
    <Canvas
      className="fx3-canvas"
      dpr={[1, 2]}
      shadows="soft"
      camera={{ position: [0, 0, 8.4], fov: 28, near: 0.1, far: 60 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.06,
      }}
      fallback={fallback}
    >
      <StudioEnvironment />
      <ambientLight intensity={0.28} />
      {/* Key light casts the shadows that make the relief and engraving read. */}
      <directionalLight
        castShadow
        position={[-3.4, 4.4, 5.6]}
        intensity={2.5}
        color="#fff3da"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-2.6}
        shadow-camera-right={2.6}
        shadow-camera-top={2.6}
        shadow-camera-bottom={-2.6}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-bias={-0.0002}
        shadow-normalBias={0.012}
        shadow-radius={3}
      />
      <directionalLight
        position={[4.6, -2.6, 3.6]}
        intensity={1.15}
        color="#cddffc"
      />
      <directionalLight position={[0, 0, 6]} intensity={0.4} color="#ffe9c4" />
      <Emblem />
    </Canvas>
  );
}
