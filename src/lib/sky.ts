/**
 * Purely decorative geometry: the hub's star ring and the ambient starfield.
 * Deterministic so server and client render identical markup.
 */

/** Hub box in its own px space (scaled by the camera, centered on 0,0). */
export const HUB_BOX = { w: 560, h: 340 };

/**
 * Irregular ring of small stars around the name. Hand-placed so the shape is
 * organic but intentional; the gap between the 4th and 5th points keeps it
 * reading as a loose constellation rather than a closed frame.
 */
export const HUB_RING: { x: number; y: number; r: number }[] = [
  { x: -214, y: -112, r: 2.2 },
  { x: -112, y: -146, r: 1.6 },
  { x: -18, y: -134, r: 2.6 },
  { x: 96, y: -150, r: 1.7 },
  // gap
  { x: 206, y: -108, r: 2.1 },
  { x: 262, y: -18, r: 1.6 },
  { x: 236, y: 82, r: 2.4 },
  { x: 140, y: 144, r: 1.6 },
  { x: 18, y: 154, r: 2.0 },
  { x: -104, y: 138, r: 1.5 },
  { x: -212, y: 104, r: 2.3 },
  { x: -264, y: 18, r: 1.6 },
  { x: -252, y: -58, r: 1.9 },
];
/** Index after which the ring is left open. */
export const HUB_RING_GAP_AFTER = 3;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface FieldStar {
  x: number;
  y: number;
  r: number;
  o: number;
}

export function makeStarfield(count = 340, seed = 7): FieldStar[] {
  const rand = mulberry32(seed);
  const out: FieldStar[] = [];
  for (let i = 0; i < count; i++) {
    const big = rand() > 0.93;
    out.push({
      x: Math.round((rand() * 2 - 1) * 1700),
      y: Math.round((rand() * 2 - 1) * 1250),
      r: Math.round((big ? 1.1 + rand() * 0.6 : 0.45 + rand() * 0.55) * 100) / 100,
      o: Math.round((big ? 0.35 + rand() * 0.3 : 0.12 + rand() * 0.3) * 100) / 100,
    });
  }
  return out;
}
