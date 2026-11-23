import { random } from "remotion";
import { SHIRT_COLORS, SKIN_COLORS } from "../constants";

export type Walker = {
  x: number;
  z0: number;
  dir: 1 | -1;
  speed: number;
  color: string;
  skin: string;
  pants: string;
  phase: number;
};

const PANTS = ["#34375a", "#1f4e79", "#5c3c92", "#3d405b", "#2a9d8f"];

const pick = <T,>(arr: readonly T[], r: number) => arr[Math.floor(r * arr.length) % arr.length];

/** Deterministic crowd of pedestrians on the two sidewalks (|x| 3.5..5.5) and a few on the road. */
export const makeWalkers = (seed: string, count: number, zMin: number, zMax: number): Walker[] =>
  Array.from({ length: count }).map((_, i) => {
    const r = (k: string) => random(`${seed}-${k}-${i}`);
    const onRoad = r("road") < 0.18;
    const side = r("side") < 0.5 ? -1 : 1;
    const x = onRoad ? -2.4 + r("x") * 4.8 : side * (3.6 + r("x") * 1.8);
    return {
      x,
      z0: zMin + r("z") * (zMax - zMin),
      dir: (r("dir") < 0.5 ? -1 : 1) as 1 | -1,
      speed: 0.9 + r("speed") * 0.7,
      color: pick(SHIRT_COLORS, r("color")),
      skin: pick(SKIN_COLORS, r("skin")),
      pants: pick(PANTS, r("pants")),
      phase: r("phase") * Math.PI * 2,
    };
  });

export const wrap = (v: number, min: number, max: number) => {
  const span = max - min;
  return ((((v - min) % span) + span) % span) + min;
};
