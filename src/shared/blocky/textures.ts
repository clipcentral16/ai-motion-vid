import * as THREE from "three";
import { random } from "remotion";

// Procedural, deterministic canvas textures for the blocky style.
// Built lazily in the browser and cached, so every frame reuses them.

const cache = new Map<string, THREE.Texture>();

const make = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const k = `${key}|${repeat?.join("x") ?? ""}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  cache.set(k, tex);
  return tex;
};

/** Lush cartoon grass: base green with speckled blades. */
export const grassTexture = (repeat: [number, number] = [20, 20]) =>
  make(
    "grass",
    256,
    256,
    (ctx) => {
      ctx.fillStyle = "#4fb53a";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2600; i++) {
        const x = random(`gx${i}`) * 256;
        const y = random(`gy${i}`) * 256;
        const l = 38 + random(`gl${i}`) * 22;
        ctx.fillStyle = `hsl(${100 + random(`gh${i}`) * 25}, 62%, ${l}%)`;
        ctx.fillRect(x, y, 2, 3 + random(`gs${i}`) * 3);
      }
    },
    repeat,
  );

/** Large, soft light/dark patches laid once over a whole lawn (no visible repeat). */
export const grassMacroTexture = () =>
  make("grass-macro", 512, 512, (ctx) => {
    ctx.clearRect(0, 0, 512, 512);
    for (let i = 0; i < 70; i++) {
      const x = random(`mx${i}`) * 512;
      const y = random(`my${i}`) * 512;
      const r = 20 + random(`mr${i}`) * 70;
      const light = random(`ml${i}`) < 0.5;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, light ? "rgba(190,240,120,0.35)" : "rgba(20,70,10,0.28)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });

/** Horizontal wooden siding boards. */
export const sidingTexture = (color: string, repeat: [number, number] = [1, 1]) =>
  make(
    `siding-${color}`,
    128,
    128,
    (ctx) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 128, 128);
      for (let y = 0; y < 128; y += 16) {
        ctx.fillStyle = "rgba(0,0,0,0.13)";
        ctx.fillRect(0, y + 13, 128, 3);
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(0, y, 128, 2);
      }
    },
    repeat,
  );

/** Red brick wall. */
export const brickTexture = (repeat: [number, number] = [2, 2]) =>
  make(
    "brick",
    128,
    128,
    (ctx) => {
      ctx.fillStyle = "#e8e0d8";
      ctx.fillRect(0, 0, 128, 128);
      for (let row = 0; row < 8; row++) {
        for (let col = -1; col < 5; col++) {
          const x = col * 32 + (row % 2) * 16;
          const shade = 42 + random(`b${row}${col}`) * 12;
          ctx.fillStyle = `hsl(6, 62%, ${shade}%)`;
          ctx.fillRect(x + 2, row * 16 + 2, 28, 12);
        }
      }
    },
    repeat,
  );

/** Glass curtain wall for skyscrapers: blue panes with mullions and a sky reflection gradient. */
export const glassTexture = (hue: number, cols: number, rows: number) =>
  make(
    `glass-${hue}-${cols}-${rows}`,
    256,
    512,
    (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 256, 512);
      g.addColorStop(0, `hsl(${hue}, 75%, 78%)`);
      g.addColorStop(0.5, `hsl(${hue}, 70%, 55%)`);
      g.addColorStop(1, `hsl(${hue}, 65%, 42%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 512);
      const cw = 256 / cols;
      const rh = 512 / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (random(`gl${hue}${r}${c}`) < 0.25) {
            ctx.fillStyle = "rgba(255,255,255,0.18)";
            ctx.fillRect(c * cw + 2, r * rh + 2, cw - 4, rh - 4);
          }
        }
      }
      ctx.fillStyle = "rgba(235,245,255,0.9)";
      for (let c = 0; c <= cols; c++) ctx.fillRect(c * cw - 1.5, 0, 3, 512);
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      for (let r = 0; r <= rows; r++) ctx.fillRect(0, r * rh - 2, 256, 4);
    },
  );

/** Facade with framed windows, for townhouses and apartments. */
export const facadeTexture = (wall: string, cols: number, rows: number) =>
  make(
    `facade-${wall}-${cols}-${rows}`,
    256,
    256,
    (ctx) => {
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, 256, 256);
      const cw = 256 / cols;
      const rh = 256 / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cw + cw * 0.22;
          const y = r * rh + rh * 0.2;
          const w = cw * 0.56;
          const h = rh * 0.55;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x - 4, y - 4, w + 8, h + 10);
          const g = ctx.createLinearGradient(x, y, x + w, y + h);
          g.addColorStop(0, "#9fe3ff");
          g.addColorStop(1, "#3aa0e0");
          ctx.fillStyle = g;
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x + w / 2 - 2, y, 4, h);
          ctx.fillRect(x, y + h / 2 - 2, w, 4);
        }
      }
    },
  );

/** Asphalt road running along V with dashed centre line and edge lines. */
export const roadTexture = (repeat: [number, number] = [1, 10]) =>
  make(
    "road",
    128,
    128,
    (ctx) => {
      ctx.fillStyle = "#3d4048";
      ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 500; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.03 + random(`ra${i}`) * 0.05})`;
        ctx.fillRect(random(`rx${i}`) * 128, random(`ry${i}`) * 128, 2, 2);
      }
      ctx.fillStyle = "#f4f4f4";
      ctx.fillRect(4, 0, 4, 128);
      ctx.fillRect(120, 0, 4, 128);
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(61, 10, 6, 54);
    },
    repeat,
  );

/** Pale paving slabs for sidewalks. */
export const pavingTexture = (repeat: [number, number] = [2, 10]) =>
  make(
    "paving",
    128,
    128,
    (ctx) => {
      ctx.fillStyle = "#e9e6e1";
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let i = 0; i <= 128; i += 32) {
        ctx.fillRect(i, 0, 2, 128);
        ctx.fillRect(0, i, 128, 2);
      }
    },
    repeat,
  );

// ---------- Faces ----------

export type Expression = "happy" | "grin" | "smug" | "sad" | "worried" | "angry" | "shocked" | "neutral" | "scared";

/**
 * Painted face decal (eyes, brows, mouth) on a transparent canvas, in the
 * classic block-character style. `blink` closes the eyes.
 */
export const faceTexture = (expr: Expression, blink: boolean) =>
  make(`face-${expr}-${blink}`, 256, 256, (ctx) => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1b1b1f";
    ctx.fillStyle = "#1b1b1f";

    // Eyes
    const eyeY = expr === "shocked" || expr === "scared" ? 104 : 110;
    const eyeH = expr === "shocked" || expr === "scared" ? 30 : expr === "smug" ? 12 : 24;
    for (const x of [86, 170]) {
      if (blink) {
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(x - 13, eyeY + 2);
        ctx.quadraticCurveTo(x, eyeY + 8, x + 13, eyeY + 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(x, eyeY, 12, eyeH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(x + 4, eyeY - eyeH * 0.4, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1b1b1f";
      }
    }

    // Brows
    ctx.lineWidth = 9;
    const brow = (x: number, side: number, tilt: number, y: number) => {
      ctx.beginPath();
      ctx.moveTo(x - 18, y + tilt * side);
      ctx.lineTo(x + 18, y - tilt * side);
      ctx.stroke();
    };
    const browY = eyeY - eyeH - 18;
    const tilt = { angry: -9, sad: 8, worried: 10, scared: 12, shocked: 0, smug: -3, happy: 0, grin: 0, neutral: 0 }[expr];
    brow(86, 1, tilt, browY);
    brow(170, -1, tilt, browY);

    // Mouth
    ctx.lineWidth = 8;
    ctx.beginPath();
    switch (expr) {
      case "happy":
        ctx.arc(128, 160, 30, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        break;
      case "grin":
        ctx.moveTo(88, 158);
        ctx.quadraticCurveTo(128, 214, 168, 158);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(100, 160, 56, 10);
        break;
      case "smug":
        ctx.moveTo(100, 176);
        ctx.quadraticCurveTo(140, 184, 166, 164);
        ctx.stroke();
        break;
      case "sad":
        ctx.arc(128, 200, 28, 1.2 * Math.PI, 1.8 * Math.PI);
        ctx.stroke();
        break;
      case "worried":
        ctx.moveTo(100, 182);
        ctx.bezierCurveTo(112, 170, 124, 190, 136, 178);
        ctx.bezierCurveTo(146, 170, 152, 182, 158, 178);
        ctx.stroke();
        break;
      case "angry":
        ctx.moveTo(104, 186);
        ctx.quadraticCurveTo(128, 168, 152, 186);
        ctx.stroke();
        break;
      case "shocked":
      case "scared":
        ctx.ellipse(128, 180, 16, expr === "scared" ? 24 : 20, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        ctx.moveTo(108, 178);
        ctx.lineTo(148, 178);
        ctx.stroke();
    }
  });

// ---------- Clothing details (transparent decals over plain coloured blocks) ----------

const shade = (hex: string, amt: number) => {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amt)));
  return `#${c.getHexString()}`;
};

export type Top = "tee" | "hoodie" | "jacket";

/** Front of the torso: collar, folds, hoodie pocket + strings, or an open jacket over a shirt. */
export const torsoFrontTexture = (top: Top, color: string, inner?: string) =>
  make(`torso-${top}-${color}-${inner}`, 256, 220, (ctx) => {
    ctx.clearRect(0, 0, 256, 220);
    const dark = shade(color, -0.12);
    // soft fold shading at the sides and bottom
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, "rgba(0,0,0,0.10)");
    g.addColorStop(0.2, "rgba(0,0,0,0)");
    g.addColorStop(0.8, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.10)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 220);
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 3;
    for (const [x1, y1, x2, y2] of [
      [70, 150, 100, 190],
      [190, 140, 165, 185],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo((x1 + x2) / 2 + 8, (y1 + y2) / 2, x2, y2);
      ctx.stroke();
    }
    if (top === "tee") {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(128, 0, 46, 26, 0, 0, Math.PI);
      ctx.fill();
    }
    if (top === "hoodie") {
      // hood bunched around the neck
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(128, 4, 70, 30, 0, 0, Math.PI);
      ctx.fill();
      // strings
      ctx.strokeStyle = "#f4f4f4";
      ctx.lineWidth = 6;
      for (const x of [108, 148]) {
        ctx.beginPath();
        ctx.moveTo(x, 24);
        ctx.lineTo(x + (x < 128 ? -4 : 4), 92);
        ctx.stroke();
        ctx.fillStyle = "#cfcfcf";
        ctx.fillRect(x - 5 + (x < 128 ? -4 : 4), 90, 10, 12);
      }
      // kangaroo pocket
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(62, 200);
      ctx.lineTo(82, 128);
      ctx.lineTo(174, 128);
      ctx.lineTo(194, 200);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = shade(color, -0.22);
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    if (top === "jacket") {
      // inner shirt showing between the open jacket
      ctx.fillStyle = inner ?? "#ffffff";
      ctx.beginPath();
      ctx.moveTo(96, 0);
      ctx.lineTo(160, 0);
      ctx.lineTo(150, 220);
      ctx.lineTo(106, 220);
      ctx.closePath();
      ctx.fill();
      // lapels / collar
      ctx.fillStyle = shade(color, -0.1);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(128 + s * 32, 0);
        ctx.lineTo(128 + s * 70, 0);
        ctx.lineTo(128 + s * 30, 70);
        ctx.closePath();
        ctx.fill();
      }
      // zipper edges and chest pockets
      ctx.fillStyle = shade(color, -0.25);
      ctx.fillRect(92, 60, 5, 160);
      ctx.fillRect(159, 60, 5, 160);
      ctx.strokeStyle = shade(color, -0.2);
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 70, 46, 34);
      ctx.strokeRect(180, 70, 46, 34);
    }
  });

/** Back of the torso: hood for hoodies. */
export const torsoBackTexture = (top: Top, color: string) =>
  make(`torsoback-${top}-${color}`, 256, 220, (ctx) => {
    ctx.clearRect(0, 0, 256, 220);
    if (top === "hoodie") {
      ctx.fillStyle = shade(color, -0.1);
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(196, 0);
      ctx.quadraticCurveTo(200, 70, 128, 86);
      ctx.quadraticCurveTo(56, 70, 60, 0);
      ctx.fill();
    }
  });

/** Trousers: front of each leg with a seam and pocket edge; belt on the hips. */
export const legFrontTexture = (color: string, jeans: boolean) =>
  make(`leg-${color}-${jeans}`, 128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128);
    const g = ctx.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, "rgba(0,0,0,0.12)");
    g.addColorStop(0.5, "rgba(255,255,255,0.05)");
    g.addColorStop(1, "rgba(0,0,0,0.12)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = jeans ? "rgba(255,215,140,0.55)" : "rgba(0,0,0,0.18)";
    ctx.lineWidth = jeans ? 2 : 3;
    ctx.setLineDash(jeans ? [6, 4] : []);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.quadraticCurveTo(40, 30, 30, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(104, 128);
    ctx.stroke();
  });

export const beltTexture = (color: string) =>
  make(`belt-${color}`, 256, 64, (ctx) => {
    ctx.fillStyle = shade(color, -0.3);
    ctx.fillRect(0, 10, 256, 26);
    ctx.fillStyle = "#c9a227";
    ctx.fillRect(112, 8, 32, 30);
    ctx.fillStyle = shade(color, -0.3);
    ctx.fillRect(120, 15, 16, 16);
  });
