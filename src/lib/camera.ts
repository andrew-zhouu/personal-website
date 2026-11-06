/**
 * Camera model. A camera is the world point shown at the screen center plus a
 * scale (screen px per world unit). Every view — overview, constellation,
 * star, about — is just a camera target computed here from the universe and
 * the viewport, so all motion happens in one shared coordinate system.
 */
import type { ConstellationId } from "@/content";
import type { Bounds, Layout, Universe } from "./universe";

export type Cam = { x: number; y: number; s: number };
export type Viewport = { w: number; h: number };

export type View =
  | { kind: "overview" }
  | { kind: "constellation"; id: ConstellationId }
  | { kind: "star"; id: string }
  | { kind: "about" };

/** Narrow screens: simplified overview (tap constellations, not stars). */
export const isCompact = (vp: Viewport) => vp.w < 760;
/** Detail views use a bottom sheet instead of a side panel. */
export const usesSheet = (vp: Viewport) => vp.w < 900;
export const layoutFor = (vp: Viewport): Layout => (vp.w / vp.h < 0.8 ? "portrait" : "landscape");

export function project(cam: Cam, vp: Viewport, x: number, y: number) {
  return { x: (x - cam.x) * cam.s + vp.w / 2, y: (y - cam.y) * cam.s + vp.h / 2 };
}

type Insets = { top: number; right: number; bottom: number; left: number };

/** Camera that fits `b` inside the viewport minus `insets`. */
function fit(b: Bounds, vp: Viewport, insets: Insets, maxS = Infinity): Cam {
  const rw = Math.max(80, vp.w - insets.left - insets.right);
  const rh = Math.max(80, vp.h - insets.top - insets.bottom);
  const s = Math.min(rw / (b.maxX - b.minX), rh / (b.maxY - b.minY), maxS);
  const rcx = insets.left + rw / 2;
  const rcy = insets.top + rh / 2;
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return { x: cx - (rcx - vp.w / 2) / s, y: cy - (rcy - vp.h / 2) / s, s };
}

/** Camera that puts world point (x, y) at screen point `focus` with scale s. */
function focusOn(x: number, y: number, focus: { x: number; y: number }, s: number, vp: Viewport): Cam {
  return { x: x - (focus.x - vp.w / 2) / s, y: y - (focus.y - vp.h / 2) / s, s };
}

export function overviewCam(u: Universe, vp: Viewport): Cam {
  const insets = isCompact(vp)
    ? { top: 64, right: 12, bottom: 84, left: 12 }
    : { top: 76, right: 56, bottom: 76, left: 56 };
  return fit(u.bounds, vp, insets, 1.25);
}

/** Room reserved for the constellation caption. */
export function captionGeometry(vp: Viewport) {
  if (isCompact(vp)) return { mode: "bottom" as const, height: 196 };
  return { mode: "side" as const, width: Math.min(320, vp.w * 0.28) };
}

export function constellationCam(u: Universe, id: ConstellationId, vp: Viewport): Cam {
  const c = u.constellationById.get(id)!;
  const cap = captionGeometry(vp);
  const insets =
    cap.mode === "bottom"
      ? { top: 84, right: 20, bottom: cap.height + 24, left: 20 }
      : { top: 100, right: 72, bottom: 100, left: cap.width + 96 };
  const base = overviewCam(u, vp).s;
  return fit(isCompact(vp) ? c.starBounds : c.bounds, vp, insets, Math.min(base * 2.6, 1.7));
}

/** Where the detail panel sits and where its star is framed. */
export function panelGeometry(vp: Viewport) {
  if (usesSheet(vp)) {
    const top = Math.round(Math.max(vp.h * 0.36, 230));
    const width = Math.min(vp.w, 640);
    return {
      mode: "sheet" as const,
      top,
      left: Math.round((vp.w - width) / 2),
      width,
      focus: { x: vp.w / 2, y: (60 + top) / 2 },
    };
  }
  const width = Math.round(Math.min(540, vp.w * 0.44));
  const right = 48;
  const left = vp.w - right - width;
  return {
    mode: "side" as const,
    top: 88,
    left,
    width,
    focus: { x: Math.round(left * 0.5), y: vp.h / 2 },
  };
}

export function starCam(u: Universe, id: string, vp: Viewport): Cam {
  const star = u.starById.get(id)!;
  const base = overviewCam(u, vp).s;
  const cs = constellationCam(u, star.constellation, vp).s;
  const s = Math.min(Math.max(cs * 1.3, base * 1.9), 2.2);
  return focusOn(star.pos.x, star.pos.y, panelGeometry(vp).focus, s, vp);
}

export function aboutCam(u: Universe, vp: Viewport): Cam {
  const p = panelGeometry(vp);
  const avail = p.mode === "side" ? p.left - 48 : vp.w - 24;
  const availH = p.mode === "side" ? vp.h - 160 : p.top - 70;
  const s = Math.min(avail / (u.hub.rx * 2.1), availH / (u.hub.ry * 2.1), 1.4);
  return focusOn(0, 0, p.focus, s, vp);
}

export function camFor(view: View, u: Universe, vp: Viewport): Cam {
  switch (view.kind) {
    case "overview":
      return overviewCam(u, vp);
    case "constellation":
      return constellationCam(u, view.id, vp);
    case "star":
      return starCam(u, view.id, vp);
    case "about":
      return aboutCam(u, vp);
  }
}

export function viewKey(v: View) {
  return v.kind === "overview" || v.kind === "about" ? v.kind : `${v.kind}:${v.id}`;
}
