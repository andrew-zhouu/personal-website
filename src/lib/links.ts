/**
 * Decides how cross-constellation relationships are shown once the camera has
 * zoomed in. A line is only drawn when both ends are actually on screen; a
 * relationship whose other end is off screen becomes a short stub with a
 * labelled signpost you can follow, instead of a line vanishing off the edge.
 */
import type { Vec } from "@/content";
import { camFor, panelGeometry, project, viewKey, visibleRect, type View, type Viewport } from "./camera";
import type { Universe } from "./universe";

export interface Signpost {
  id: string;
  /** Star the signpost belongs to. */
  source: string;
  from: Vec;
  /** World point where the stub ends and the signpost sits. */
  end: Vec;
  dir: Vec;
  label: string;
  sub: string;
  color: string;
  target: View;
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

export function linkVisibility(u: Universe, view: View, vp: Viewport): LinkVisibility {
  if (view.kind === "overview" || view.kind === "about") return { onscreen: null, signposts: [] };

  const cam = camFor(view, u, vp);
  const rect = visibleRect(view, vp);
  const inside = (p: Vec, margin = 0) => {
    const q = project(cam, vp, p.x, p.y);
    return (
      q.x >= rect.left + margin &&
      q.x <= rect.right - margin &&
      q.y >= rect.top + margin &&
      q.y <= rect.bottom - margin
    );
  };
  const sheet = view.kind === "star" && panelGeometry(vp).mode === "sheet";
  // Above a phone sheet there's no room for signposts; the sheet's
  // "Connected work" section carries those relationships instead.
  const allowSignposts = !sheet;
  const focusC = view.kind === "constellation" ? view.id : u.starById.get(view.id)!.constellation;

  const onscreen = new Set<string>();
  const signposts: Signpost[] = [];

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
    let dx = otherPos.x - src.pos.x;
    let dy = otherPos.y - src.pos.y;
    // On phones the sheet covers the bottom; keep signposts above it.
    if (sheet && dy > 0) dy *= 0.15;
    let len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    // Beside a side panel, the leader line runs straight right from the star;
    // angle signposts off it so the two never sit on top of each other.
    if (view.kind === "star" && !sheet && dx > 0 && Math.abs(dy) < 0.5) {
      dy = dy >= 0 ? 0.6 : -0.6;
      len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }
    const L = STUB_PX / cam.s;
    const end = { x: src.pos.x + dx * L, y: src.pos.y + dy * L };

    if (e.kind === "relation") {
      const other = u.starById.get(sourceId === e.a ? e.b : e.a)!;
      signposts.push({
        // Keyed by view so stubs re-enter (after the camera arrives) on every move.
        id: `${viewKey(view)}:${e.id}@${sourceId}`,
        source: sourceId,
        from: src.pos,
        end,
        dir: { x: dx, y: dy },
        label: other.title,
        sub: u.constellationById.get(other.constellation)!.name,
        color: other.color,
        target: { kind: "star", id: other.id },
        side: "right",
        nudge: 0,
      });
    } else {
      const c = u.constellationById.get(e.b as never)!;
      signposts.push({
        id: `${viewKey(view)}:${e.id}@${sourceId}`,
        source: sourceId,
        from: src.pos,
        end,
        dir: { x: dx, y: dy },
        label: `Also part of ${c.name}`,
        sub: "",
        color: c.color,
        target: { kind: "constellation", id: c.id },
        side: "right",
        nudge: 0,
      });
    }
  }

  // Lay out each label beside its stub end and keep it inside the visible area
  // (text width is estimated; generous enough for the site's type sizes).
  for (const p of signposts) {
    const q = project(cam, vp, p.end.x, p.end.y);
    const w = 52 + (p.label.length + p.sub.length) * 7.6;
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
