"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ConstellationId } from "@/content";
import {
  camFor,
  isCompact,
  layoutFor,
  overviewCam,
  viewKey,
  type View,
  type Viewport,
} from "@/lib/camera";
import { computeEmphasis, type Hover } from "@/lib/emphasis";
import { linkVisibility } from "@/lib/links";
import { buildUniverse, type Universe } from "@/lib/universe";
import { CameraContext, CameraEngine } from "./camera-engine";
import { ConstellationCaption, Legend, MobileProfileBar, OverviewHint, TopBar } from "./Chrome";
import { AboutPanel, StarPanel } from "./DetailPanel";
import { IndexView } from "./IndexView";
import { ConstellationLabel, HubNode, SignpostNode, StarNode, type Level } from "./Overlay";
import { SkyCanvas } from "./SkyCanvas";

/* ─── Routing: the view lives in the URL hash so links and Back work ──── */

function parseHash(hash: string, u: Universe): View {
  const id = decodeURIComponent(hash.replace(/^#\/?/, ""));
  if (!id) return { kind: "overview" };
  if (id === "about") return { kind: "about" };
  if (u.constellationById.has(id as ConstellationId)) return { kind: "constellation", id: id as ConstellationId };
  if (u.starById.has(id)) return { kind: "star", id };
  const renamed = u.stars.find((s) => s.aliases?.includes(id));
  if (renamed) return { kind: "star", id: renamed.id };
  return { kind: "overview" };
}

function toHash(v: View) {
  switch (v.kind) {
    case "overview":
      return "";
    case "about":
      return "#about";
    default:
      return `#${v.id}`;
  }
}

function parentOf(v: View, u: Universe): View {
  if (v.kind === "star") return { kind: "constellation", id: u.starById.get(v.id)!.constellation };
  return { kind: "overview" };
}

export default function UniverseApp() {
  const rootRef = useRef<HTMLDivElement>(null);
  const engine = useMemo(() => new CameraEngine(), []);
  const reduced = !!useReducedMotion();

  const [vp, setVp] = useState<Viewport | null>(null);
  const [view, setView] = useState<View>({ kind: "overview" });
  const [hover, setHoverNow] = useState<Hover>(null);
  // Clearing hover waits a beat, so the pointer can travel from a star to its
  // signpost (or between neighbours) without everything flickering.
  const hoverTimer = useRef<number | undefined>(undefined);
  const setHover = useCallback((h: Hover) => {
    window.clearTimeout(hoverTimer.current);
    if (h) setHoverNow(h);
    else hoverTimer.current = window.setTimeout(() => setHoverNow(null), 200);
  }, []);
  const [indexOpen, setIndexOpen] = useState(false);
  const [explored, setExplored] = useState(false);

  const layout = vp ? layoutFor(vp) : "landscape";
  const universe = useMemo(() => buildUniverse(layout), [layout]);
  const compact = vp ? isCompact(vp) : false;

  // Measure the viewport, and read the initial view from the URL in the same
  // pass so the first frame is already framed correctly (no fly-in on load).
  useLayoutEffect(() => {
    const el = rootRef.current!;
    const measure = () => setVp({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const initial = parseHash(window.location.hash, buildUniverse(layoutFor({ w: el.clientWidth, h: el.clientHeight })));
    setView(initial);
    // Normalize renamed ids (e.g. #hackathons → #hackcmu) without adding history.
    const canonical = toHash(initial);
    if (canonical && window.location.hash !== canonical) {
      window.history.replaceState(null, "", canonical);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const navigate = useCallback((v: View) => {
    setIndexOpen(false);
    setHoverNow(null);
    setExplored(true);
    setView((cur) => (viewKey(cur) === viewKey(v) ? cur : v));
    const hash = toHash(v);
    if (window.location.hash !== hash) {
      window.history.pushState(null, "", hash || window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      setHoverNow(null);
      setView(parseHash(window.location.hash, universe));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [universe]);

  // Drive the camera. Same view (resize/layout change) → jump; new view → fly.
  const last = useRef<{ key: string; vp: Viewport } | null>(null);
  useLayoutEffect(() => {
    if (!vp) return;
    engine.setViewport(vp, overviewCam(universe, vp).s);
    const target = camFor(view, universe, vp);
    const key = viewKey(view);
    if (!last.current || last.current.key === key || reduced) engine.jump(target);
    else engine.fly(target);
    last.current = { key, vp };
  }, [engine, view, universe, vp, reduced]);

  const goBack = useCallback(() => navigate(parentOf(view, universe)), [navigate, view, universe]);

  // Escape always moves one level toward the center.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (indexOpen) {
        setIndexOpen(false);
        return;
      }
      if (view.kind === "overview") return;
      const prev = view;
      goBack();
      // Return focus to whatever we just left, so keyboard users keep their place.
      window.setTimeout(() => {
        const sel =
          prev.kind === "star"
            ? `[data-star-btn="${prev.id}"]`
            : prev.kind === "constellation"
              ? `[data-constellation-btn="${prev.id}"]`
              : null;
        if (sel) document.querySelector<HTMLElement>(sel)?.focus({ preventScroll: true });
      }, 30);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, indexOpen, goBack]);

  // Restore focus to the trigger when the list view closes.
  const wasIndexOpen = useRef(false);
  useEffect(() => {
    if (wasIndexOpen.current && !indexOpen) {
      const active = document.activeElement;
      if (!active || active === document.body) {
        document.querySelector<HTMLElement>("[data-index-trigger]")?.focus({ preventScroll: true });
      }
    }
    wasIndexOpen.current = indexOpen;
  }, [indexOpen]);

  const level: Level = view.kind;
  const links = useMemo(
    () => (vp ? linkVisibility(universe, view, vp) : { onscreen: null, signposts: [] }),
    [universe, view, vp],
  );
  // Zoomed into a constellation, signposts appear only for the star you're
  // pointing at; in a star view they're always shown for that star.
  const signposts = useMemo(
    () =>
      view.kind === "constellation"
        ? links.signposts.filter((p) => hover?.kind === "star" && hover.id === p.source)
        : links.signposts,
    [links, view, hover],
  );
  const emphasis = useMemo(
    () => computeEmphasis(universe, view, hover, links.onscreen),
    [universe, view, hover, links],
  );
  const selectedId = view.kind === "star" ? view.id : null;
  const focusC: ConstellationId | null =
    view.kind === "constellation" ? view.id : view.kind === "star" ? universe.starById.get(view.id)!.constellation : null;

  const regionsActive = universe.constellations
    .map((c) => c.id)
    .filter((id) => (view.kind === "overview" ? true : view.kind === "constellation" ? id !== view.id : false));

  const selectStar = useCallback((id: string) => navigate({ kind: "star", id }), [navigate]);
  const selectConstellation = useCallback(
    (id: ConstellationId) => navigate({ kind: "constellation", id }),
    [navigate],
  );
  const goHome = useCallback(() => navigate({ kind: "overview" }), [navigate]);
  const goAbout = useCallback(() => navigate({ kind: "about" }), [navigate]);

  const selectedStar = selectedId ? universe.starById.get(selectedId)! : null;

  return (
    <CameraContext.Provider value={engine}>
      <div
        ref={rootRef}
        className="universe"
        data-level={level}
        data-compact={compact || undefined}
        data-layout={layout}
        data-ready={vp ? true : undefined}
      >
        <div className="absolute inset-0" inert={indexOpen}>
          {vp && (
            <>
              {/* First in DOM so keyboard users reach navigation first. */}
              <TopBar
                view={view}
                universe={universe}
                onNavigate={navigate}
                onBack={goBack}
                onOpenIndex={() => setIndexOpen(true)}
              />

              <SkyCanvas
                universe={universe}
                emphasis={emphasis}
                signposts={signposts}
                selectedId={selectedId}
                regionsActive={regionsActive}
                onRegion={selectConstellation}
                onRegionHover={setHover}
                onBackground={() => {
                  if (view.kind === "star" || view.kind === "about") goBack();
                }}
              />

              <div className="pointer-events-none absolute inset-0 overflow-hidden" id="map">
                <HubNode
                  level={level}
                  opacity={emphasis.hub}
                  compact={compact}
                  minScale={compact ? 0.5 : 0.68}
                  onHome={goHome}
                  onAbout={goAbout}
                />
                {universe.constellations.map((c) => (
                  <ConstellationLabel
                    key={c.id}
                    c={c}
                    emphasis={emphasis.constellation.get(c.id)!}
                    onSelect={selectConstellation}
                    onHover={setHover}
                  />
                ))}
                {signposts.map((p) => (
                  <SignpostNode key={p.id} p={p} onNavigate={navigate} onHover={setHover} />
                ))}
                {universe.stars.map((s) => {
                  const inFocus = focusC === s.constellation;
                  const em = emphasis.star.get(s.id)!;
                  // Compact overview: only featured labels, and stars aren't
                  // individually tappable (the constellation is the target).
                  // The selected star is titled by the panel and breadcrumb; its
                  // map label would only crowd its signposts.
                  // The tall layout packs constellations closer, so (like phones)
                  // it labels only featured stars until you zoom in.
                  const roomy = !compact && layout === "landscape";
                  const showLabel =
                    s.id === selectedId
                      ? false
                      : level === "overview"
                        ? roomy || !!s.featured
                        : inFocus || em.flag !== "none" || roomy;
                  return (
                    <StarNode
                      key={s.id}
                      star={s}
                      constellationName={universe.constellationById.get(s.constellation)!.name}
                      emphasis={em}
                      showLabel={showLabel}
                      showMeta={(level === "constellation" && inFocus) || em.flag === "active"}
                      interactive={!(compact && level === "overview") || !!s.featured}
                      selected={s.id === selectedId}
                      onSelect={selectStar}
                      onHover={setHover}
                    />
                  );
                })}
              </div>

              <div className="pointer-events-none absolute inset-0 z-20">
                <AnimatePresence>
                  {view.kind === "constellation" && (
                    <ConstellationCaption
                      key={`cap-${view.id}`}
                      id={view.id}
                      universe={universe}
                      vp={vp}
                      onNavigate={navigate}
                      onHover={(id) => setHover(id ? { kind: "star", id } : null)}
                    />
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {selectedStar && (
                    <StarPanel
                      key={`star-${selectedStar.id}`}
                      star={selectedStar}
                      universe={universe}
                      vp={vp}
                      reduced={reduced}
                      onNavigate={navigate}
                    />
                  )}
                  {view.kind === "about" && (
                    <AboutPanel key="about" universe={universe} vp={vp} reduced={reduced} onNavigate={navigate} />
                  )}
                </AnimatePresence>
              </div>

              {level === "overview" && (
                <div className="overview-foot">
                  {!compact && layout === "landscape" && <Legend className="legend-floating" />}
                  {!explored && <OverviewHint compact={compact} />}
                  {compact && <MobileProfileBar onAbout={goAbout} />}
                </div>
              )}
            </>
          )}
        </div>

        <AnimatePresence>
          {indexOpen && (
            <IndexView
              universe={universe}
              reduced={reduced}
              onClose={() => setIndexOpen(false)}
              onNavigate={navigate}
            />
          )}
        </AnimatePresence>
      </div>
    </CameraContext.Provider>
  );
}
