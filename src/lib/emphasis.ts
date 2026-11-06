/**
 * Decides how prominent every element is for the current view + hover.
 * Centralized so hover, selection and receding behave identically for stars,
 * labels and lines.
 */
import type { ConstellationId } from "@/content";
import type { View } from "./camera";
import type { Universe } from "./universe";

export type Hover =
  | { kind: "star"; id: string }
  | { kind: "constellation"; id: ConstellationId }
  | null;

export type Flag = "active" | "linked" | "none";

export interface Emphasis {
  star: Map<string, { o: number; flag: Flag }>;
  edge: Map<string, { o: number; active: boolean }>;
  constellation: Map<ConstellationId, { o: number; flag: Flag }>;
  hub: number;
}

/**
 * @param onscreen relationship edges whose two ends are both visible at the
 *   current camera target (null = all, i.e. the overview). Others are never
 *   drawn as full lines; see `linkVisibility`.
 */
export function computeEmphasis(
  u: Universe,
  view: View,
  hover: Hover,
  onscreen: Set<string> | null,
): Emphasis {
  const selected = view.kind === "star" ? u.starById.get(view.id) : undefined;
  const focusC: ConstellationId | undefined =
    view.kind === "constellation" ? view.id : selected?.constellation;
  const hoverStar = hover?.kind === "star" ? u.starById.get(hover.id) : undefined;
  const hoverC = hover?.kind === "constellation" ? hover.id : undefined;

  const relatedOf = (id?: string) =>
    new Set(id ? (u.starById.get(id)?.related.map((r) => r.id) ?? []) : []);
  const selRelated = relatedOf(selected?.id);
  const hovRelated = relatedOf(hoverStar?.id);

  // Stars in other constellations that connect into the focused one.
  const linkedIntoFocus = new Set<string>();
  if (view.kind === "constellation") {
    for (const s of u.stars) {
      if (s.constellation !== focusC) continue;
      for (const r of s.related) linkedIntoFocus.add(r.id);
    }
  }

  const star = new Map<string, { o: number; flag: Flag }>();
  for (const s of u.stars) {
    let o = 1;
    let flag: Flag = "none";
    if (view.kind === "constellation") {
      o = s.constellation === focusC ? 1 : linkedIntoFocus.has(s.id) ? 0.72 : 0.36;
    } else if (view.kind === "star") {
      if (s.id === selected?.id) {
        flag = "active";
      } else if (selRelated.has(s.id)) {
        o = 0.95;
        flag = "linked";
      } else {
        o = s.constellation === focusC ? 0.6 : 0.28;
      }
    } else if (view.kind === "about") {
      o = 0.42;
    }

    if (hoverStar) {
      if (s.id === hoverStar.id) {
        o = 1;
        flag = "active";
      } else if (hovRelated.has(s.id)) {
        o = Math.max(o, 0.95);
        if (flag !== "active") flag = "linked";
      } else if (flag !== "active") {
        o = Math.max(0.2, o * 0.55);
      }
    } else if (hoverC) {
      o = s.constellation === hoverC ? Math.max(o, 1) : Math.max(0.2, o * 0.7);
    }
    star.set(s.id, { o, flag });
  }

  const activeStar = hoverStar?.id ?? selected?.id;
  const edge = new Map<string, { o: number; active: boolean }>();
  for (const e of u.edges) {
    const touchesActive = !!activeStar && (e.a === activeStar || e.b === activeStar);
    const touchesHover = !!hoverStar && (e.a === hoverStar.id || e.b === hoverStar.id);
    const touchesFocus = !!focusC && e.constellations.includes(focusC);
    let o: number;
    let active = false;

    if (e.kind === "shape") {
      // Structural figure: always faintly present, stronger where you are.
      if (view.kind === "overview") o = 0.26;
      else if (view.kind === "constellation") o = touchesFocus ? 0.42 : 0.12;
      else if (view.kind === "star") o = touchesFocus ? 0.3 : 0.08;
      else o = 0.1;
      if (hoverC) o = e.constellations.includes(hoverC) ? 0.45 : o * 0.6;
      if (e.related && touchesActive) {
        o = 0.85;
        active = true;
      } else if (hoverStar) {
        o = hoverStar.constellation === e.constellations[0] ? Math.max(o, 0.3) : Math.min(o, 0.12);
      }
    } else {
      // Relationships across constellations: hidden until relevant, and never
      // drawn toward a star that's off screen.
      const visible = onscreen === null || onscreen.has(e.id);
      o = 0;
      if (visible) {
        if (touchesHover) o = 0.9;
        else if (view.kind === "star" && touchesActive) o = 0.8;
        else if (view.kind === "constellation" && touchesFocus && !hover) o = 0.22;
      }
      if (e.kind === "association") o *= 0.75;
      active = o > 0.5;
    }
    edge.set(e.id, { o, active });
  }

  const assocOfActive = new Set(
    activeStar ? (u.starById.get(activeStar)?.secondary ?? []) : [],
  );
  const constellation = new Map<ConstellationId, { o: number; flag: Flag }>();
  for (const c of u.constellations) {
    let o = 1;
    let flag: Flag = "none";
    if (view.kind === "constellation") {
      if (c.id === focusC) flag = "active";
      else o = 0.5;
    } else if (view.kind === "star") {
      o = c.id === focusC ? 0.75 : 0.42;
    } else if (view.kind === "about") {
      o = 0.5;
    }
    if (assocOfActive.has(c.id)) {
      o = Math.max(o, 0.85);
      flag = "linked";
    }
    if (hoverC === c.id || hoverStar?.constellation === c.id) {
      o = 1;
      flag = "active";
    } else if (hover) {
      o = Math.max(0.3, o * (assocOfActive.has(c.id) ? 1 : 0.75));
    }
    constellation.set(c.id, { o, flag });
  }

  const hub =
    view.kind === "overview" || view.kind === "about" ? (hover ? 0.85 : 1) : view.kind === "star" ? 0.14 : 0.2;

  return { star, edge, constellation, hub };
}
