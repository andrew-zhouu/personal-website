"use client";

import { AnimatePresence, motion } from "motion/react";
import { profile, type ConstellationId } from "@/content";
import { captionGeometry, type View, type Viewport } from "@/lib/camera";
import { BRIGHTNESS_COPY, statusText, type Brightness, type Universe } from "@/lib/universe";
import { ProfileLinks } from "./Overlay";

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, delay: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/* ─── Top bar: location + list view ───────────────────────────────────── */

export function TopBar({
  view,
  universe,
  onNavigate,
  onBack,
  onOpenIndex,
}: {
  view: View;
  universe: Universe;
  onNavigate: (v: View) => void;
  onBack: () => void;
  onOpenIndex: () => void;
}) {
  const crumbs: { label: string; view: View; color?: string }[] = [];
  if (view.kind === "constellation") {
    const c = universe.constellationById.get(view.id)!;
    crumbs.push({ label: c.name, view, color: c.color });
  } else if (view.kind === "star") {
    const s = universe.starById.get(view.id)!;
    const c = universe.constellationById.get(s.constellation)!;
    crumbs.push({ label: c.name, view: { kind: "constellation", id: c.id }, color: c.color });
    crumbs.push({ label: s.title, view });
  } else if (view.kind === "about") {
    crumbs.push({ label: "About", view });
  }

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 sm:p-5">
      <nav aria-label="Location" className="pointer-events-auto min-w-0">
        <AnimatePresence initial={false}>
          {view.kind !== "overview" && (
            <motion.ol key="crumbs" {...fade} className="crumbs">
              <li>
                <button type="button" className="btn-icon" onClick={onBack} aria-label="Go back one level">
                  <span aria-hidden="true">←</span>
                </button>
              </li>
              <li>
                <button type="button" className="crumb focus-ring" onClick={() => onNavigate({ kind: "overview" })}>
                  <span className="crumb-home" aria-hidden="true" />
                  <span className="max-sm:sr-only">{profile.name}</span>
                  <span className="sm:sr-only">Center</span>
                </button>
              </li>
              {crumbs.map((c, i) => {
                const last = i === crumbs.length - 1;
                return (
                  <li
                    key={c.label}
                    // On phones the sheet already titles the star; keep the trail short.
                    className={`flex min-w-0 items-center ${last && crumbs.length > 1 ? "max-sm:hidden" : ""}`}
                  >
                    <span className="crumb-sep" aria-hidden="true">/</span>
                    {last ? (
                      <span className="crumb is-current truncate" aria-current="location" style={c.color ? { color: c.color } : undefined}>
                        {c.label}
                      </span>
                    ) : (
                      <button type="button" className="crumb focus-ring" style={c.color ? { color: c.color } : undefined} onClick={() => onNavigate(c.view)}>
                        {c.label}
                      </button>
                    )}
                  </li>
                );
              })}
            </motion.ol>
          )}
        </AnimatePresence>
      </nav>
      <button type="button" onClick={onOpenIndex} className="btn-chrome pointer-events-auto focus-ring" data-index-trigger>
        <svg width="15" height="15" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M1 3h12M1 7h12M1 11h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        View all<span className="max-sm:hidden"> work</span>
      </button>
    </header>
  );
}

/* ─── Legend ───────────────────────────────────────────────────────────── */

export function BrightnessGlyph({ b, color = "#dfe6ff" }: { b: Brightness; color?: string }) {
  return (
    <svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true" className="shrink-0">
      {b === "bright" && <circle r={8} fill={color} opacity={0.22} />}
      {b === "bright" && <circle r={4.6} fill={color} opacity={0.35} />}
      {b === "medium" && <circle r={5.5} fill={color} opacity={0.18} />}
      {b === "subtle" ? (
        <>
          <circle r={3.2} fill="none" stroke={color} strokeWidth={1.1} opacity={0.8} />
          <circle r={1} fill={color} />
        </>
      ) : (
        <circle r={b === "bright" ? 3 : 2.6} fill={color} />
      )}
    </svg>
  );
}

export function Legend({ className = "" }: { className?: string }) {
  return (
    <div className={`legend ${className}`}>
      <p className="legend-title">Star brightness</p>
      <ul className="space-y-1.5">
        {(["bright", "medium", "subtle"] as const).map((b) => (
          <li key={b} className="flex items-center gap-2.5">
            <BrightnessGlyph b={b} />
            <span className="text-ink-1">{BRIGHTNESS_COPY[b].label}</span>
            <span className="text-ink-3">{BRIGHTNESS_COPY[b].description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Overview hint ────────────────────────────────────────────────────── */

export function OverviewHint({ compact }: { compact: boolean }) {
  return (
    <p className="hint">
      {compact ? "Tap a constellation to explore" : "Select a constellation or star to explore"}
    </p>
  );
}

/* ─── Mobile profile bar (hub links don't fit inside the ring on phones) ─ */

export function MobileProfileBar({ onAbout }: { onAbout: () => void }) {
  return (
    <nav aria-label="Profile" className="mobile-profile">
      <ProfileLinks onAbout={onAbout} className="mobile-profile-row" itemClassName="mobile-profile-link" />
    </nav>
  );
}

/* ─── Constellation caption ───────────────────────────────────────────── */

export function ConstellationCaption({
  id,
  universe,
  vp,
  onNavigate,
  onHover,
}: {
  id: ConstellationId;
  universe: Universe;
  vp: Viewport;
  onNavigate: (v: View) => void;
  onHover: (id: string | null) => void;
}) {
  const list = universe.constellations;
  const i = list.findIndex((c) => c.id === id);
  const c = list[i];
  const prev = list[(i - 1 + list.length) % list.length];
  const next = list[(i + 1) % list.length];
  const geo = captionGeometry(vp);
  const members = c.starIds.map((sid) => universe.starById.get(sid)!);
  const live = members.filter((s) => s.brightness === "bright").length;

  return (
    <motion.aside
      key={id}
      aria-label={`${c.name} constellation`}
      className="caption pointer-events-auto"
      data-mode={geo.mode}
      style={{ "--accent": c.color, ...(geo.mode === "side" ? { width: geo.width } : {}) } as React.CSSProperties}
      initial={{ opacity: 0, y: geo.mode === "side" ? 0 : 16, x: geo.mode === "side" ? -12 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0, transition: { duration: 0.5, delay: 0.35, ease: [0.2, 0.7, 0.2, 1] } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <p className="kicker">
        Constellation {i + 1} of {list.length} · {members.length} stars{live ? `, ${live} live` : ""}
      </p>
      <h2 className="caption-title" style={{ color: c.color }}>
        {c.name}
      </h2>
      <p className="caption-desc">{c.description}</p>

      {geo.mode === "side" && (
        <ul className="caption-list">
          {members.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="caption-item focus-ring"
                onClick={() => onNavigate({ kind: "star", id: s.id })}
                onPointerEnter={(e) => e.pointerType === "mouse" && onHover(s.id)}
                onPointerLeave={(e) => e.pointerType === "mouse" && onHover(null)}
                onFocus={() => onHover(s.id)}
                onBlur={() => onHover(null)}
              >
                <BrightnessGlyph b={s.brightness} color={s.color} />
                <span className="caption-item-title">{s.title}</span>
                <span className="caption-item-status">{statusText(s)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="caption-nav">
        <button type="button" className="btn-secondary" onClick={() => onNavigate({ kind: "overview" })}>
          <span aria-hidden="true">←</span> Overview
        </button>
        <span className="flex-1" />
        <button
          type="button"
          className="btn-quiet focus-ring"
          onClick={() => onNavigate({ kind: "constellation", id: prev.id })}
          aria-label={`Previous constellation: ${prev.name}`}
        >
          <span aria-hidden="true">‹</span> <span style={{ color: prev.color }}>{prev.name}</span>
        </button>
        <button
          type="button"
          className="btn-quiet focus-ring"
          onClick={() => onNavigate({ kind: "constellation", id: next.id })}
          aria-label={`Next constellation: ${next.name}`}
        >
          <span style={{ color: next.color }}>{next.name}</span> <span aria-hidden="true">›</span>
        </button>
      </div>
    </motion.aside>
  );
}
