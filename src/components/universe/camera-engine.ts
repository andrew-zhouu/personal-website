"use client";

import { animate, type AnimationPlaybackControls } from "motion/react";
import { createContext, useCallback, useContext, useRef } from "react";
import type { Cam, Viewport } from "@/lib/camera";
import { interpolateZoom } from "@/lib/zoom";

/**
 * How an HTML element anchored to a world point scales with the camera:
 * - `label`: grows gently with zoom so labels get more readable as you
 *   approach, without ballooning.
 * - `world`: scales exactly like the world, but never below `min` so text
 *   stays legible on small screens.
 */
export type AnchorMode = "label" | "world";

interface Anchor {
  x: number;
  y: number;
  mode: AnchorMode;
  min: number;
}

const EASE = [0.45, 0.05, 0.2, 1] as const;

/**
 * Owns the single camera. Writes transforms straight to the DOM on every
 * frame (no React re-render), so the SVG world, the parallax starfield and
 * every anchored HTML label move from the same numbers.
 */
export class CameraEngine {
  cam: Cam = { x: 0, y: 0, s: 1 };
  vp: Viewport = { w: 1, h: 1 };
  /** Overview scale; label growth is measured relative to it. */
  base = 1;
  worldEl: SVGGElement | null = null;
  fieldEl: SVGGElement | null = null;
  private anchors = new Map<HTMLElement, Anchor>();
  private anim: AnimationPlaybackControls | null = null;
  moving = false;
  private movingListeners = new Set<(m: boolean) => void>();

  /** Connect the SVG groups the camera transforms. */
  attach(world: SVGGElement | null, field: SVGGElement | null) {
    this.worldEl = world;
    this.fieldEl = field;
    this.render();
  }

  setViewport(vp: Viewport, base: number) {
    this.vp = vp;
    this.base = base;
  }

  onMoving(fn: (m: boolean) => void) {
    this.movingListeners.add(fn);
    return () => void this.movingListeners.delete(fn);
  }

  private setMoving(m: boolean) {
    if (this.moving === m) return;
    this.moving = m;
    this.movingListeners.forEach((fn) => fn(m));
  }

  stop() {
    this.anim?.stop();
    this.anim = null;
  }

  jump(cam: Cam) {
    this.stop();
    this.cam = cam;
    this.render();
    this.setMoving(false);
  }

  /** Smoothly travel to `target`. Returns the duration in seconds. */
  fly(target: Cam, onComplete?: () => void): number {
    this.stop();
    const from = this.cam;
    const { w } = this.vp;
    const z = interpolateZoom([from.x, from.y, w / from.s], [target.x, target.y, w / target.s]);
    // ~0.65s for small moves, up to ~1.1s for long hops between constellations.
    const duration = Math.min(1.1, Math.max(0.65, 0.6 + z.length * 0.17));
    this.setMoving(true);
    this.anim = animate(0, 1, {
      duration,
      ease: EASE as unknown as [number, number, number, number],
      onUpdate: (t) => {
        const [x, y, vw] = z.at(t);
        this.cam = { x, y, s: w / vw };
        this.render();
      },
      onComplete: () => {
        this.cam = target;
        this.render();
        this.anim = null;
        this.setMoving(false);
        onComplete?.();
      },
    });
    return duration;
  }

  register(el: HTMLElement, a: Anchor) {
    this.anchors.set(el, a);
    this.place(el, a);
  }

  unregister(el: HTMLElement) {
    this.anchors.delete(el);
  }

  private place(el: HTMLElement, a: Anchor) {
    const { x, y, s } = this.cam;
    const sx = (a.x - x) * s + this.vp.w / 2;
    const sy = (a.y - y) * s + this.vp.h / 2;
    const k =
      a.mode === "world"
        ? Math.max(s, a.min)
        : Math.min(1.3, Math.max(0.94, Math.pow(s / this.base, 0.3)));
    el.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0) scale(${k.toFixed(4)})`;
  }

  render() {
    const { x, y, s } = this.cam;
    const { w, h } = this.vp;
    this.worldEl?.setAttribute(
      "transform",
      `translate(${w / 2} ${h / 2}) scale(${s}) translate(${-x} ${-y})`,
    );
    if (this.fieldEl) {
      // Background stars travel less than the map: gentle depth, not parallax tricks.
      const fs = this.base * Math.pow(s / this.base, 0.4);
      this.fieldEl.setAttribute(
        "transform",
        `translate(${w / 2} ${h / 2}) scale(${fs}) translate(${-x * 0.4} ${-y * 0.4})`,
      );
    }
    this.anchors.forEach((a, el) => this.place(el, a));
  }
}

export const CameraContext = createContext<CameraEngine | null>(null);

export function useCamera() {
  const engine = useContext(CameraContext);
  if (!engine) throw new Error("useCamera must be used inside <CameraContext>");
  return engine;
}

/** Callback ref that pins an element's top-left to a world point. */
export function useAnchor(x: number, y: number, mode: AnchorMode = "label", min = 0) {
  const engine = useCamera();
  const current = useRef<HTMLElement | null>(null);
  return useCallback(
    (el: HTMLElement | null) => {
      if (current.current) engine.unregister(current.current);
      current.current = el;
      if (el) engine.register(el, { x, y, mode, min });
    },
    [engine, x, y, mode, min],
  );
}
