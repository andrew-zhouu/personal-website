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

export function computeEmphasis(u: Universe, view: View, hover: Hover, compact: boolean): Emphasis {
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
    const touchesFocus = !!focusC && e.constellations.includes(focusC);
    let o: number;
    if (e.kind === "relation") {
      if (view.kind === "overview") o = compact && e.cross ? 0.08 : 0.3;
      else if (view.kind === "constellation") o = touchesFocus ? 0.5 : 0.08;
      else if (view.kind === "star") o = touchesActive ? 0.9 : 0.1;
      else o = 0.12;
    } else if (e.kind === "shape") {
      if (view.kind === "overview") o = 0.16;
      else if (view.kind === "constellation") o = touchesFocus ? 0.3 : 0.06;
      else if (view.kind === "star") o = touchesFocus ? 0.2 : 0.05;
      else o = 0.08;
    } else {
      o = 0;
      if (view.kind === "constellation" && e.constellations[0] === focusC) o = 0.18;
    }

    if (hoverStar) {
      if (touchesActive) o = e.kind === "shape" ? 0.3 : e.kind === "association" ? 0.55 : 0.95;
      else o = Math.min(o, e.kind === "shape" ? 0.08 : 0.1);
    } else if (hoverC) {
      if (e.constellations.includes(hoverC)) o = Math.max(o, e.kind === "shape" ? 0.32 : e.kind === "relation" ? 0.55 : 0);
      else o *= 0.6;
    } else if (touchesActive && e.kind === "association") {
      o = 0.5;
    }
    edge.set(e.id, { o, active: touchesActive && e.kind !== "shape" });
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
