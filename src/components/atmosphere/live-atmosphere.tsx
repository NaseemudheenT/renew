"use client";

/**
 * LiveAtmosphere — chooses the best atmosphere for the device:
 *  - Capable devices: the lite-3D WebGL world (Atmosphere3D), lazily loaded.
 *  - Reduced-motion / weak / no-WebGL: the calm Canvas 2D fallback.
 * Renders nothing on the server (the themed body color shows through), then
 * fades the chosen layer in — matching the "the screen fades in" intro.
 *
 * Capability detection uses useSyncExternalStore so the server renders the
 * "pending" (empty) state and the client upgrades after hydration — no
 * hydration mismatch and no setState-in-effect.
 *
 * This is the component the whole app imports as `Atmosphere`.
 */
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { Atmosphere2D } from "./atmosphere";

const Atmosphere3D = dynamic(() => import("./atmosphere-3d"), { ssr: false });

type Mode = "pending" | "3d" | "2d";

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

let cachedMode: Exclude<Mode, "pending"> | null = null;
function clientMode(): Exclude<Mode, "pending"> {
  if (cachedMode) return cachedMode;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Phones (small screens) get the lighter 2D layer for battery; tablets and
  // desktops with WebGL get the lite-3D world. Use clientWidth (innerWidth can
  // report 0 in some embedded/preview contexts) with a sane desktop fallback.
  // hardwareConcurrency is a poor proxy for GPU capability (VMs under-report
  // it), so we don't gate on it — the scene is intentionally lightweight.
  const width = document.documentElement.clientWidth || window.innerWidth || 1024;
  const smallScreen = width < 480;
  cachedMode = !reduced && !smallScreen && hasWebGL() ? "3d" : "2d";
  return cachedMode;
}

const subscribe = () => () => {};

export function Atmosphere() {
  const mode = useSyncExternalStore<Mode>(subscribe, clientMode, () => "pending");

  // Each layer positions itself fixed + full-screen and fades itself in
  // (see .atmosphere-fade). Nothing on the server → the themed body shows.
  if (mode === "pending") return null;
  return mode === "3d" ? <Atmosphere3D /> : <Atmosphere2D />;
}
