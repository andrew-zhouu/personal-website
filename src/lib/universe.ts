/**
 * Turns content (src/content) into renderable geometry. Pure functions, no
 * React. Everything about *where* things are and *how bright* they are is
 * derived here so the components only deal with presentation.
 */
import {
  connections,
  constellations,
  stars,
  type Constellation,
  type ConstellationId,
  type LabelSide,
  type Star,
  type Vec,
} from "@/content";

export type Layout = "landscape" | "portrait";
export type Brightness = "bright" | "medium" | "subtle";

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface RelatedRef {
  id: string;
  label: string;
  note?: string;
}

export interface ResolvedStar extends Star {
  pos: Vec;
  brightness: Brightness;
  color: string;
  labelSide: LabelSide;
  related: RelatedRef[];
}

export interface ResolvedConstellation extends Constellation {
  center: Vec;
  labelPos: Vec;
  /** Stars + label: used for the overview. */
  bounds: Bounds;
  /** Stars (+ room for their labels): what the camera frames on focus. */
  starBounds: Bounds;
  starIds: string[];
}

export interface Edge {
  id: string;
  /**
   * - `shape`: structural line inside a constellation (solid, always faintly
   *   visible). `related` marks pairs that are also explicit connections.
   * - `relation`: explicit connection between stars of different
   *   constellations (dashed, hidden until a relevant star is in play).
   * - `association`: a star's secondary constellation (dotted, likewise).
   */
  kind: "shape" | "relation" | "association";
  /** Star ids. For associations `b` is a constellation id. */
  a: string;
  b: string;
  d: string;
  related: boolean;
  from: Vec;
  to: Vec;
  colorA: string;
  colorB: string;
  /** Constellations touched by this edge (for focus/recede logic). */
  constellations: ConstellationId[];
}

export interface Universe {
  layout: Layout;
  stars: ResolvedStar[];
  starById: Map<string, ResolvedStar>;
  constellations: ResolvedConstellation[];
  constellationById: Map<ConstellationId, ResolvedConstellation>;
  edges: Edge[];
  bounds: Bounds;
  hub: { rx: number; ry: number };
}

/**
 * Brightness = how much tangible work a visitor can explore right now,
 * not how important the item is.
 */
export function deriveBrightness(star: Star): Brightness {
  if (star.status === "in-progress" || star.status === "forthcoming") return "subtle";
  if (star.links.some((l) => l.status === "live")) return "bright";
  return "medium";
}

export const BRIGHTNESS_COPY: Record<Brightness, { label: string; description: string }> = {
  bright: { label: "Explore now", description: "Live sites and published work" },
  medium: { label: "Story", description: "Experiences and achievements" },
  subtle: { label: "In progress", description: "Ongoing or coming soon" },
};

/** Human status line for a star, e.g. "Live", "Link coming soon". */
export function statusText(star: Star): string {
  if (star.statusLabel) return star.statusLabel;
  const live = star.links.find((l) => l.status === "live");
  if (live) {
    if (star.layout === "writing") return "Read online";
    if (star.layout === "creative") return "Watch online";
    return live.note ? `Live · ${live.note.toLowerCase()}` : "Live";
  }
  if (star.status === "in-progress") return "In progress";
  if (star.status === "forthcoming") return "Coming soon";
  if (star.links.some((l) => l.status === "unverified")) return "Link being verified";
  if (star.links.some((l) => l.status === "pending")) return "Link coming soon";
  return "Experience";
}

/** Hub footprint (world units) that cross-constellation lines bend around. */
const HUB_CLEARANCE: Record<Layout, { rx: number; ry: number }> = {
  landscape: { rx: 285, ry: 175 },
  portrait: { rx: 300, ry: 200 },
};

function pad(b: Bounds, px: number, py: number): Bounds {
  return { minX: b.minX - px, minY: b.minY - py, maxX: b.maxX + px, maxY: b.maxY + py };
}

function boundsOf(points: Vec[]): Bounds {
  return points.reduce<Bounds>(
    (b, p) => ({
      minX: Math.min(b.minX, p.x),
      minY: Math.min(b.minY, p.y),
      maxX: Math.max(b.maxX, p.x),
      maxY: Math.max(b.maxY, p.y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );
}

export function unionBounds(...bs: Bounds[]): Bounds {
  return bs.reduce((a, b) => ({
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }));
}

const fmt = (n: number) => Math.round(n * 10) / 10;

/**
 * Path for a connection line. Lines whose straight path would cut through the
 * hub bow outward around it; other cross-constellation lines get a slight,
 * consistent curve so the web reads as organic rather than ruled.
 */
function edgePath(p0: Vec, p1: Vec, hub: { rx: number; ry: number }, bend: number): string {
  const m = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;

  // Closest approach to the hub, measured in hub-normalized space.
  const n0 = { x: p0.x / hub.rx, y: p0.y / hub.ry };
  const nd = { x: dx / hub.rx, y: dy / hub.ry };
  const t = Math.max(0, Math.min(1, -(n0.x * nd.x + n0.y * nd.y) / (nd.x * nd.x + nd.y * nd.y || 1)));
  const c = { x: n0.x + nd.x * t, y: n0.y + nd.y * t };
  const dist = Math.hypot(c.x, c.y);

  let perp = { x: -dy / len, y: dx / len };
  if (perp.x * m.x + perp.y * m.y < 0) perp = { x: -perp.x, y: -perp.y };

  let shift: Vec;
  const margin = 1.18;
  if (dist < margin) {
    const dir = dist > 1e-3 ? { x: c.x / dist, y: c.y / dist } : perp;
    const k = margin - dist;
    shift = { x: dir.x * hub.rx * k, y: dir.y * hub.ry * k };
  } else {
    shift = { x: perp.x * len * bend, y: perp.y * len * bend };
  }
  if (Math.hypot(shift.x, shift.y) < 0.5) {
    return `M${fmt(p0.x)} ${fmt(p0.y)}L${fmt(p1.x)} ${fmt(p1.y)}`;
  }
  const ctrl = { x: m.x + 2 * shift.x, y: m.y + 2 * shift.y };
  return `M${fmt(p0.x)} ${fmt(p0.y)}Q${fmt(ctrl.x)} ${fmt(ctrl.y)} ${fmt(p1.x)} ${fmt(p1.y)}`;
}

/**
 * Put each label where no structural line leaves the star. Prefers below,
 * then above, then the sides; picks the clearest side if none is fully clear.
 */
function chooseLabelSide(dirs: Vec[]): LabelSide {
  const sides: [LabelSide, number][] = [
    ["below", Math.PI / 2],
    ["above", -Math.PI / 2],
    ["right", 0],
    ["left", Math.PI],
  ];
  const angles = dirs.map((d) => Math.atan2(d.y, d.x));
  const clearance = (a: number) =>
    angles.reduce((m, b) => {
      const diff = Math.abs(((a - b + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      return Math.min(m, diff);
    }, Math.PI);
  let best: LabelSide = "below";
  let bestScore = -1;
  for (const [side, a] of sides) {
    const c = clearance(a);
    if (c >= (Math.PI / 180) * 62) return side;
    if (c > bestScore) {
      bestScore = c;
      best = side;
    }
  }
  return best;
}

const cache = new Map<Layout, Universe>();

export function buildUniverse(layout: Layout): Universe {
  const hit = cache.get(layout);
  if (hit) return hit;

  const hub = HUB_CLEARANCE[layout];
  const cById = new Map(constellations.map((c) => [c.id, c]));

  const related = new Map<string, RelatedRef[]>();
  for (const c of connections) {
    related.set(c.a, [...(related.get(c.a) ?? []), { id: c.b, label: c.label, note: c.note }]);
    related.set(c.b, [...(related.get(c.b) ?? []), { id: c.a, label: c.label, note: c.note }]);
  }

  const resolvedStars: ResolvedStar[] = stars.map((s) => {
    const c = cById.get(s.constellation)!;
    const place = c.layouts[layout];
    const k = place.scale ?? 1;
    return {
      ...s,
      pos: { x: place.center.x + s.position.x * k, y: place.center.y + s.position.y * k },
      brightness: deriveBrightness(s),
      color: c.color,
      labelSide: s.labelSide ?? "below",
      related: related.get(s.id) ?? [],
    };
  });
  const starById = new Map(resolvedStars.map((s) => [s.id, s]));

  // Auto-place labels away from this star's structural lines.
  for (const s of resolvedStars) {
    if (stars.find((x) => x.id === s.id)!.labelSide) continue;
    const c = cById.get(s.constellation)!;
    const dirs = c.shape
      .filter(([a, b]) => a === s.id || b === s.id)
      .map(([a, b]) => {
        const other = starById.get(a === s.id ? b : a)!;
        return { x: other.pos.x - s.pos.x, y: other.pos.y - s.pos.y };
      });
    s.labelSide = chooseLabelSide(dirs);
  }

  const resolvedConstellations: ResolvedConstellation[] = constellations.map((c) => {
    const place = c.layouts[layout];
    const k = place.scale ?? 1;
    const members = resolvedStars.filter((s) => s.constellation === c.id);
    const labelPos = { x: place.center.x + place.label.x * k, y: place.center.y + place.label.y * k };
    // Pad for star labels (≈ 90 units either side, below the star).
    const starBox = pad(boundsOf(members.map((s) => s.pos)), 130, 40);
    starBox.maxY += 40;
    const labelBox = pad(boundsOf([labelPos]), 120, 40);
    return {
      ...c,
      center: place.center,
      labelPos,
      bounds: unionBounds(starBox, labelBox),
      starBounds: starBox,
      starIds: members.map((s) => s.id),
    };
  });
  const constellationById = new Map(resolvedConstellations.map((c) => [c.id, c]));

  const edges: Edge[] = [];
  const key = (a: string, b: string) => [a, b].sort().join("|");
  const connectionKeys = new Set(connections.map((c) => key(c.a, c.b)));
  const shapeKeys = new Set<string>();

  for (const c of constellations) {
    for (const [ia, ib] of c.shape) {
      const k = key(ia, ib);
      if (shapeKeys.has(k)) continue;
      shapeKeys.add(k);
      const a = starById.get(ia)!;
      const b = starById.get(ib)!;
      edges.push({
        id: `shape:${k}`,
        kind: "shape",
        a: a.id,
        b: b.id,
        d: `M${fmt(a.pos.x)} ${fmt(a.pos.y)}L${fmt(b.pos.x)} ${fmt(b.pos.y)}`,
        related: connectionKeys.has(k),
        from: a.pos,
        to: b.pos,
        colorA: a.color,
        colorB: b.color,
        constellations: [c.id],
      });
    }
  }

  // Connections not already drawn as structure (normally the cross-
  // constellation ones) become dashed relationship lines.
  for (const c of connections) {
    const k = key(c.a, c.b);
    if (shapeKeys.has(k)) continue;
    const a = starById.get(c.a)!;
    const b = starById.get(c.b)!;
    const cross = a.constellation !== b.constellation;
    edges.push({
      id: `rel:${k}`,
      kind: "relation",
      a: a.id,
      b: b.id,
      d: edgePath(a.pos, b.pos, hub, cross ? 0.06 : 0.03),
      related: true,
      from: a.pos,
      to: b.pos,
      colorA: a.color,
      colorB: b.color,
      constellations: cross ? [a.constellation, b.constellation] : [a.constellation],
    });
  }

  for (const s of resolvedStars) {
    for (const cid of s.secondary ?? []) {
      const target = constellationById.get(cid)!;
      // End just short of the label so the line points *at* the constellation.
      const to = { x: target.labelPos.x, y: target.labelPos.y - 22 };
      edges.push({
        id: `assoc:${s.id}|${cid}`,
        kind: "association",
        a: s.id,
        b: cid,
        d: edgePath(s.pos, to, hub, 0.06),
        related: true,
        from: s.pos,
        to,
        colorA: s.color,
        colorB: target.color,
        constellations: [s.constellation, cid],
      });
    }
  }

  const bounds = unionBounds(
    ...resolvedConstellations.map((c) => c.bounds),
    { minX: -hub.rx, minY: -hub.ry, maxX: hub.rx, maxY: hub.ry },
  );

  const u: Universe = {
    layout,
    stars: resolvedStars,
    starById,
    constellations: resolvedConstellations,
    constellationById,
    edges,
    bounds,
    hub,
  };
  cache.set(layout, u);
  return u;
}
