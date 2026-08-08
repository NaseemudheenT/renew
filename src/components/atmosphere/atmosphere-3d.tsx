"use client";

/**
 * Atmosphere3D — the living "lite-3D" world (React Three Fiber).
 * NOT a starfield or space scene. This is calm, premium *air*: soft motes of
 * light that slowly float upward with depth, large soft volumetric light, and
 * fog for atmospheric falloff — the Pandora feeling (light, depth, space in a
 * room), graded to the theme (dark = evening, light = daylight).
 *
 * Loaded only on the client via next/dynamic (ssr:false) by LiveAtmosphere,
 * which also handles the reduced-motion / no-WebGL fallback.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "@/components/providers/theme-provider";

/** Seeded, deterministic PRNG (mulberry32) — stable across re-renders, pure. */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Palette = { motesNear: string; motesFar: string; orbA: string; orbB: string; fog: string };

const PALETTES: Record<"dark" | "light", Palette> = {
  dark: { motesNear: "#f0d8a2", motesFar: "#caa768", orbA: "#d4af6a", orbB: "#37476f", fog: "#0b0e14" },
  light: { motesNear: "#c69a3f", motesFar: "#b7924a", orbA: "#c69a3f", orbB: "#8a9bc0", fog: "#efe9dc" },
};

/** Soft radial dot texture for points and sprites (no hard edges). */
function useSoftTexture() {
  return useMemo(() => {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    // Gentle glow, not a sharp dot — reads as a soft mote of light, not a star.
    g.addColorStop(0, "rgba(255,255,255,0.82)");
    g.addColorStop(0.22, "rgba(255,255,255,0.28)");
    g.addColorStop(0.6, "rgba(255,255,255,0.06)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

interface MotesProps {
  color: string;
  count: number;
  size: number;
  opacity: number;
  seed: number;
  spread: [number, number, number];
  rise: number;
}

/** A layer of soft motes that slowly float upward and sway, wrapping around. */
function Motes({ color, count, size, opacity, seed, spread, rise }: MotesProps) {
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const tex = useSoftTexture();
  const [sx, sy, sz] = spread;

  const data = useMemo(() => {
    const rng = makeRng(seed);
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rng() - 0.5) * sx;
      pos[i * 3 + 1] = (rng() - 0.5) * sy;
      pos[i * 3 + 2] = (rng() - 0.5) * sz - 2;
      speed[i] = rise * (0.5 + rng());
      phase[i] = rng() * Math.PI * 2;
    }
    return { pos, speed, phase };
  }, [count, seed, sx, sy, sz, rise]);

  useFrame((state, delta) => {
    const g = geomRef.current;
    if (!g) return;
    const arr = g.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    const halfY = sy / 2;
    const d = Math.min(delta, 0.05); // guard against tab-switch jumps
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += d * data.speed[i]; // float up
      arr[i * 3] += Math.sin(t * 0.12 + data.phase[i]) * 0.0007; // gentle sway
      if (arr[i * 3 + 1] > halfY) arr[i * 3 + 1] = -halfY; // wrap
    }
    g.attributes.position.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={tex}
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Large, very soft volumetric light — the cinematic glow / depth. */
function Orbs({ colorA, colorB }: { colorA: string; colorB: string }) {
  const tex = useSoftTexture();
  const group = useRef<THREE.Group>(null);

  const orbs = useMemo(
    () => [
      { p: [-5.2, 2.2, -4] as const, s: 10, c: colorA, o: 0.22 },
      { p: [5.4, -1.2, -5] as const, s: 11, c: colorB, o: 0.24 },
      { p: [2.2, 3.2, -3] as const, s: 7, c: colorA, o: 0.18 },
      { p: [-3.2, -3, -6] as const, s: 12, c: colorA, o: 0.14 },
      { p: [0.4, -0.6, -2.5] as const, s: 6, c: colorA, o: 0.12 },
    ],
    [colorA, colorB],
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      child.position.y += Math.sin(t * 0.07 + i * 1.3) * 0.0012;
      child.position.x += Math.cos(t * 0.045 + i) * 0.0009;
    });
  });

  return (
    <group ref={group}>
      {orbs.map((o, i) => (
        <sprite key={i} position={o.p} scale={[o.s, o.s, 1]}>
          <spriteMaterial
            map={tex}
            color={o.c}
            transparent
            opacity={o.o}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  );
}

/** Very subtle camera parallax to the pointer — "the background reacts to the mouse". */
function CameraRig() {
  useFrame((state) => {
    const { camera, pointer } = state;
    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.02;
    camera.position.y += (pointer.y * 0.4 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, -2);
  });
  return null;
}

/**
 * Force the drawing buffer to match the container via getBoundingClientRect.
 * R3F's ResizeObserver can under-measure in some embedded/preview contexts;
 * this keeps the render crisp and correctly sized everywhere.
 */
function ForceResize() {
  const gl = useThree((s) => s.gl);
  const setSize = useThree((s) => s.setSize);
  useEffect(() => {
    const measure = () => {
      const el = gl.domElement.parentElement;
      const r = el?.getBoundingClientRect();
      const w = r?.width || document.documentElement.clientWidth || window.innerWidth;
      const h = r?.height || document.documentElement.clientHeight || window.innerHeight;
      if (w && h) setSize(w, h);
    };
    measure();
    const id = window.setTimeout(measure, 250);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", measure);
    };
  }, [gl, setSize]);
  return null;
}

export default function Atmosphere3D() {
  const { resolved } = useTheme();
  const pal = PALETTES[resolved];
  const nearOpacity = resolved === "dark" ? 0.85 : 0.5;
  const farOpacity = resolved === "dark" ? 0.6 : 0.34;

  return (
    <Canvas
      className="atmosphere-fade"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 7], fov: 60 }}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: -10 }}
    >
      <fog attach="fog" args={[pal.fog, 9, 28]} />
      {/* Far, fine haze — fewer, so it reads as atmosphere not a star map */}
      <Motes color={pal.motesFar} count={320} size={0.09} opacity={farOpacity} seed={101} spread={[24, 16, 11]} rise={0.11} />
      {/* Mid drift — soft floating motes */}
      <Motes color={pal.motesNear} count={220} size={0.16} opacity={nearOpacity} seed={202} spread={[19, 13, 8]} rise={0.17} />
      {/* Near, large soft and slow */}
      <Motes color={pal.motesNear} count={80} size={0.36} opacity={nearOpacity * 0.65} seed={303} spread={[16, 11, 5]} rise={0.22} />
      <Orbs colorA={pal.orbA} colorB={pal.orbB} />
      <CameraRig />
      <ForceResize />
    </Canvas>
  );
}
