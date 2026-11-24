import * as THREE from "three";

// Shared low-poly geometries and flat-shaded materials. Reusing them keeps
// draw-call setup cheap when there are hundreds of characters on screen.

const matCache = new Map<string, THREE.MeshStandardMaterial>();

export const mat = (color: string, opts: { emissive?: number; side?: THREE.Side } = {}) => {
  const key = `${color}|${opts.emissive ?? 0}|${opts.side ?? 0}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      roughness: 0.85,
      metalness: 0,
      side: opts.side ?? THREE.FrontSide,
      emissive: opts.emissive ? new THREE.Color(color) : new THREE.Color("#000"),
      emissiveIntensity: opts.emissive ?? 0,
    });
    matCache.set(key, m);
  }
  return m;
};

export const shadowMat = new THREE.MeshBasicMaterial({
  color: "#000000",
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
});

export const geo = {
  box: new THREE.BoxGeometry(1, 1, 1),
  body: new THREE.CapsuleGeometry(0.34, 0.45, 3, 8),
  head: new THREE.IcosahedronGeometry(0.33, 1),
  limb: new THREE.CapsuleGeometry(0.09, 0.3, 2, 6),
  leg: new THREE.CapsuleGeometry(0.11, 0.28, 2, 6),
  eye: new THREE.SphereGeometry(0.055, 8, 6),
  smile: new THREE.TorusGeometry(0.09, 0.022, 4, 10, Math.PI),
  blob: new THREE.CircleGeometry(0.45, 12),
  puff: new THREE.IcosahedronGeometry(1, 0),
  canopy: new THREE.IcosahedronGeometry(1, 0),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 8),
  wheel: new THREE.CylinderGeometry(1, 1, 1, 8),
  ball: new THREE.IcosahedronGeometry(1, 1),
  plane: new THREE.PlaneGeometry(1, 1),
  ring: new THREE.RingGeometry(0.94, 1, 40),
  disc: new THREE.CircleGeometry(1, 32),
};
