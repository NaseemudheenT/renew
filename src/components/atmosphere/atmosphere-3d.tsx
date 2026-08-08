"use client";

/**
 * Atmosphere3D — the living "lite-3D" world (React Three Fiber).
 * Real depth: a drifting field of soft motes, large soft light orbs, fog for
 * atmospheric falloff, and gentle camera parallax to the pointer. Calm and slow
 * — the Pandora feeling (light + depth + space), never fantasy or gaming.
 * Colors are graded to the theme: dark = night, light = day.
 *
 * Loaded only on the client via next/dynamic (ssr:false) by LiveAtmosphere,
 * which also handles the reduced-motion / no-WebGL fallback.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "@/components/providers/theme-provider";

/** Seeded, deterministic PRNG (mulberry32) — stable across re-renders, and
 *  pure (no Math.random in render). */
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

type Palette = { motes: string; orbA: string; orbB: string; fog: string; moteOpacity: number };

const PALETTES: Record<"dark" | "light", Palette> = {
  dark: { motes: "#ecd199", orbA: "#d4af6a", orbB: "#3a4a74", fog: "#0b0e14", moteOpacity: 0.9 },
  light: { motes: "#b8923f", orbA: "#c69a3f", orbB: "#8a9bc0", fog: "#efe9dc", moteOpacity: 0.55 },
};

/** Soft radial dot texture for points and sprites (no hard edges). */
function useRadialTexture(inner = 0.0) {
  return useMemo(() => {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, size * inner, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }, [inner]);
}

function Motes({ color, opacity, count = 1600 }: { color: string; opacity: number; count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const tex = useRadialTexture(0);

  const positions = useMemo(() => {
    const rng = makeRng(0x9e3779b9 ^ count);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rng() - 0.5) * 20;
      arr[i * 3 + 1] = (rng() - 0.5) * 13;
      arr[i * 3 + 2] = (rng() - 0.5) * 12 - 2;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.012;
    ref.current.position.y = Math.sin(t * 0.06) * 0.35; // slow breathing drift
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={tex}
        color={color}
        size={0.075}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Orbs({ colorA, colorB }: { colorA: string; colorB: string }) {
  const tex = useRadialTexture(0);
  const group = useRef<THREE.Group>(null);

  const orbs = useMemo(
    () => [
      { p: [-5, 2.4, -4] as const, s: 8, c: colorA, o: 0.16 },
      { p: [5.2, -1.4, -5] as const, s: 9, c: colorB, o: 0.18 },
      { p: [2.4, 3.2, -3] as const, s: 6, c: colorA, o: 0.12 },
      { p: [-3.4, -3, -6] as const, s: 10, c: colorA, o: 0.1 },
      { p: [0.5, -0.5, -2] as const, s: 5, c: colorA, o: 0.08 },
    ],
    [colorA, colorB],
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      child.position.y += Math.sin(t * 0.08 + i * 1.3) * 0.0016;
      child.position.x += Math.cos(t * 0.05 + i) * 0.0012;
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
    camera.position.x += (pointer.x * 0.7 - camera.position.x) * 0.025;
    camera.position.y += (pointer.y * 0.45 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, -2);
  });
  return null;
}

export default function Atmosphere3D() {
  const { resolved } = useTheme();
  const pal = PALETTES[resolved];

  return (
    <Canvas
      className="atmosphere-fade"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 7], fov: 62 }}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: -10 }}
    >
      <fog attach="fog" args={[pal.fog, 7, 22]} />
      <Motes color={pal.motes} opacity={pal.moteOpacity} />
      <Orbs colorA={pal.orbA} colorB={pal.orbB} />
      <CameraRig />
    </Canvas>
  );
}
