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
    ? { top: 64, right: 12, bottom: 118, left: 12 }
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
      ? { top: 84, right: 76, bottom: cap.height + 24, left: 76 }
      : { top: 100, right: 72, bottom: 100, left: cap.width + 96 };
  const base = overviewCam(u, vp).s;
  return fit(isCompact(vp) ? c.starBounds : c.bounds, vp, insets, Math.min(base * 2.6, 1.7));
}

/**
 * How much room a destination gets. Flagship work and photographs get a wide
 * stage; writing gets a comfortable reading column; supporting experiences
 * stay compact so a small thing never takes the space of a big one.
 */
export type PanelSize = "compact" | "standard" | "wide";

export function panelSizeFor(view: View, u: Universe): PanelSize {
  if (view.kind === "star") {
    const layout = u.starById.get(view.id)?.layout;
    if (layout === "product" || layout === "photo") return "wide";
    if (layout === "compact") return "compact";
  }
  return "standard";
}

const PANEL_WIDTH: Record<PanelSize, { frac: number; min: number; max: number }> = {
  compact: { frac: 0.36, min: 400, max: 480 },
  standard: { frac: 0.46, min: 480, max: 640 },
  wide: { frac: 0.58, min: 560, max: 820 },
};

/** Where the detail panel sits and where its star is framed. */
export function panelGeometry(vp: Viewport, size: PanelSize = "standard") {
  if (usesSheet(vp)) {
    const top = Math.round(Math.max(vp.h * 0.36, 230));
    const width = Math.min(vp.w, size === "wide" ? 760 : 640);
    return {
      mode: "sheet" as const,
      size,
      top,
      left: Math.round((vp.w - width) / 2),
      width,
      focus: { x: vp.w / 2, y: (60 + top) / 2 },
    };
  }
  const spec = PANEL_WIDTH[size];
  const width = Math.round(Math.min(spec.max, Math.max(spec.min, vp.w * spec.frac)));
  const right = size === "wide" ? 32 : 48;
  const left = vp.w - right - width;
  return {
    mode: "side" as const,
    size,
    top: 84,
    left,
    width,
    // The star sits centered in the open sky left of the panel.
    focus: { x: Math.round(left * 0.5), y: vp.h / 2 },
  };
}

export function starCam(u: Universe, id: string, vp: Viewport): Cam {
  const star = u.starById.get(id)!;
  const base = overviewCam(u, vp).s;
  const cs = constellationCam(u, star.constellation, vp).s;
  const s = Math.min(Math.max(cs * 1.3, base * 1.9), 2.2);
  return focusOn(star.pos.x, star.pos.y, panelGeometry(vp, panelSizeFor({ kind: "star", id }, u)).focus, s, vp);
}

export function aboutCam(u: Universe, vp: Viewport): Cam {
  const p = panelGeometry(vp, "standard");
  const avail = p.mode === "side" ? p.left - 48 : vp.w - 24;
  const availH = p.mode === "side" ? vp.h - 160 : p.top - 70;
  const s = Math.min(avail / (u.hub.rx * 2.1), availH / (u.hub.ry * 2.1), 1.4);
  return focusOn(0, 0, p.focus, s, vp);
}

/** Screen area not covered by chrome, captions or the detail panel. */
export function visibleRect(view: View, vp: Viewport, u: Universe) {
  const r = { left: 12, top: 68, right: vp.w - 12, bottom: vp.h - 12 };
  if (view.kind === "constellation") {
    const cap = captionGeometry(vp);
    if (cap.mode === "side") r.left = cap.width + 72;
    else r.bottom = vp.h - cap.height - 8;
  } else if (view.kind === "star" || view.kind === "about") {
    const p = panelGeometry(vp, panelSizeFor(view, u));
    if (p.mode === "side") r.right = p.left - 16;
    else r.bottom = p.top - 8;
  }
  return r;
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
