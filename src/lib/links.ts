/**
 * Decides how cross-constellation relationships are shown once the camera has
 * zoomed in. A line is only drawn when both ends are actually on screen; a
 * relationship whose other end is off screen becomes a short stub with a
 * labelled signpost you can follow, instead of a line vanishing off the edge.
 */
import type { Vec } from "@/content";
import { camFor, panelGeometry, panelSizeFor, project, viewKey, visibleRect, type View, type Viewport } from "./camera";
import type { Universe } from "./universe";

export interface SignpostItem {
  label: string;
  sub: string;
  color: string;
  target: View;
}

/**
 * One stub leaving a star toward off-screen relationships. Relationships that
 * point the same way share a stub and stack their labels, so a star with
 * several links in one direction gets a tidy list instead of a pile.
 */
export interface Signpost {
  id: string;
  /** Star the signpost belongs to. */
  source: string;
  from: Vec;
  /** World point where the stub ends and the signpost sits. */
  end: Vec;
  dir: Vec;
  items: SignpostItem[];
  /** Which side of the stub end the label sits on. */
  side: "right" | "left" | "above" | "below";
  /** Horizontal shift (px) that keeps the label inside the visible area. */
  nudge: number;
}

export interface LinkVisibility {
  /** Relationship edges with both ends visible. null → everything (overview). */
  onscreen: Set<string> | null;
  signposts: Signpost[];
}

const STUB_PX = 64;
/** One signpost list per star: separate stacks pointing different ways tend to collide. */
const CLUSTER_RAD = Math.PI + 0.01;

interface Raw {
  edgeId: string;
  source: string;
  angle: number;
  item: SignpostItem;
  /** Constellation the relationship points into. */
  into: string;
  association: boolean;
}

const angleDiff = (a: number, b: number) => Math.abs(((a - b + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);

export function linkVisibility(u: Universe, view: View, vp: Viewport): LinkVisibility {
  if (view.kind === "overview" || view.kind === "about") return { onscreen: null, signposts: [] };

  const cam = camFor(view, u, vp);
  const rect = visibleRect(view, vp, u);
  const inside = (p: Vec, margin = 0) => {
    const q = project(cam, vp, p.x, p.y);
    return (
      q.x >= rect.left + margin &&
      q.x <= rect.right - margin &&
      q.y >= rect.top + margin &&
      q.y <= rect.bottom - margin
    );
  };
  const sheet = view.kind === "star" && panelGeometry(vp, panelSizeFor(view, u)).mode === "sheet";
  // Above a phone sheet there's no room for signposts; the sheet's
  // "Connected work" section carries those relationships instead.
  const allowSignposts = !sheet;
  const focusC = view.kind === "constellation" ? view.id : u.starById.get(view.id)!.constellation;

  const onscreen = new Set<string>();
  const raws: Raw[] = [];

  for (const e of u.edges) {
    if (e.kind === "shape") continue;
    if (inside(e.from, 8) && inside(e.to, 8)) {
      onscreen.add(e.id);
      continue;
    }

    // Which end (if any) is the star we're looking at?
    let sourceId: string | null = null;
    if (view.kind === "star") {
      if (e.a === view.id) sourceId = e.a;
      else if (e.kind === "relation" && e.b === view.id) sourceId = e.b;
    } else {
      if (u.starById.get(e.a)?.constellation === focusC) sourceId = e.a;
      else if (e.kind === "relation" && u.starById.get(e.b)?.constellation === focusC) sourceId = e.b;
    }
    if (!sourceId || !allowSignposts) continue;
    const src = u.starById.get(sourceId)!;
    if (!inside(src.pos)) continue;

    const otherPos = sourceId === e.a ? e.to : e.from;
    const angle = Math.atan2(otherPos.y - src.pos.y, otherPos.x - src.pos.x);

    if (e.kind === "relation") {
      const other = u.starById.get(sourceId === e.a ? e.b : e.a)!;
      raws.push({
        edgeId: e.id,
        source: sourceId,
        angle,
        association: false,
        into: other.constellation,
        item: {
          label: other.title,
          sub: u.constellationById.get(other.constellation)!.name,
          color: other.color,
          target: { kind: "star", id: other.id },
        },
      });
    } else {
      const c = u.constellationById.get(e.b as never)!;
      raws.push({
        edgeId: e.id,
        source: sourceId,
        angle,
        association: true,
        into: c.id,
        item: {
          label: `Also part of ${c.name}`,
          sub: "",
          color: c.color,
          target: { kind: "constellation", id: c.id },
        },
      });
    }
  }

  // "Also part of Solve" adds nothing when a related Solve star is already listed.
  const filtered = raws.filter(
    (r) => !r.association || !raws.some((o) => !o.association && o.source === r.source && o.into === r.into),
  );

  // Group by direction, per source star.
  const clusters: { source: string; angles: number[]; raws: Raw[] }[] = [];
  for (const r of filtered) {
    const c = clusters.find(
      (k) => k.source === r.source && k.angles.some((a) => angleDiff(a, r.angle) < CLUSTER_RAD),
    );
    if (c) {
      c.angles.push(r.angle);
      c.raws.push(r);
    } else clusters.push({ source: r.source, angles: [r.angle], raws: [r] });
  }

  const signposts: Signpost[] = clusters.map((k) => {
    const src = u.starById.get(k.source)!;
    let dx = k.angles.reduce((sum, a) => sum + Math.cos(a), 0);
    let dy = k.angles.reduce((sum, a) => sum + Math.sin(a), 0);
    let len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    // Beside a side panel, the leader line runs straight right from the star;
    // angle signposts off it so the two never sit on top of each other.
    if (view.kind === "star" && dx > 0 && Math.abs(dy) < 0.5) {
      dy = dy >= 0 ? 0.6 : -0.6;
      len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }
    const L = STUB_PX / cam.s;
    return {
      // Keyed by view so stubs re-enter (after the camera arrives) on every move.
      id: `${viewKey(view)}:${k.raws.map((r) => r.edgeId).join("+")}@${k.source}`,
      source: k.source,
      from: src.pos,
      end: { x: src.pos.x + dx * L, y: src.pos.y + dy * L },
      dir: { x: dx, y: dy },
      items: k.raws.map((r) => r.item),
      side: "right" as const,
      nudge: 0,
    };
  });

  // Lay out each label beside its stub end and keep it inside the visible area
  // (text width is estimated; generous enough for the site's type sizes).
  for (const p of signposts) {
    const q = project(cam, vp, p.end.x, p.end.y);
    const w = 64 + Math.max(...p.items.map((i) => i.label.length + i.sub.length)) * 8.4;
    p.side =
      Math.abs(p.dir.x) >= 0.5 ? (p.dir.x > 0 ? "right" : "left") : p.dir.y < 0 ? "above" : "below";
    const lo = rect.left + 8;
    const hi = rect.right - 8;
    if (p.side === "right" && q.x + 4 + w > hi) p.side = p.dir.y < 0 ? "above" : "below";
    if (p.side === "left" && q.x - 4 - w < lo) p.side = p.dir.y < 0 ? "above" : "below";
    if (p.side === "above" || p.side === "below") {
      const left = q.x - w / 2;
      p.nudge = left < lo ? lo - left : left + w > hi ? hi - (left + w) : 0;
    }
  }

  return { onscreen, signposts };
}
