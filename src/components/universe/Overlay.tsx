"use client";

import type { ConstellationId, ProfileLink } from "@/content";
import { profile } from "@/content";
import type { View } from "@/lib/camera";
import type { Hover } from "@/lib/emphasis";
import type { Signpost } from "@/lib/links";
import { HUB_BOX, HUB_RING } from "@/lib/sky";
import { statusText, type ResolvedConstellation, type ResolvedStar } from "@/lib/universe";
import { useAnchor } from "./camera-engine";

export type Level = "overview" | "constellation" | "star" | "about";

/* ─── Hub ──────────────────────────────────────────────────────────────── */

export function ProfileLinks({
  onAbout,
  className = "",
  itemClassName = "",
  exclude = [],
}: {
  onAbout: () => void;
  className?: string;
  itemClassName?: string;
  exclude?: ProfileLink["id"][];
}) {
  const render = (l: ProfileLink) => {
    if (l.id === "about") {
      return (
        <button key={l.id} type="button" onClick={onAbout} className={`hub-link ${itemClassName}`}>
          {l.label}
        </button>
      );
    }
    if (l.href) {
      return (
        <a key={l.id} href={l.href} target="_blank" rel="noopener noreferrer" className={`hub-link ${itemClassName}`}>
          {l.label}
        </a>
      );
    }
    return (
      <span key={l.id} className={`hub-link is-pending ${itemClassName}`} title={`${l.label} — coming soon`}>
        {l.label}
        <span className="sr-only"> (coming soon)</span>
      </span>
    );
  };
  return <div className={className}>{profile.links.filter((l) => !exclude.includes(l.id)).map(render)}</div>;
}

export function HubNode({
  level,
  opacity,
  compact,
  minScale,
  onHome,
  onAbout,
}: {
  level: Level;
  opacity: number;
  compact: boolean;
  minScale: number;
  onHome: () => void;
  onAbout: () => void;
}) {
  const ref = useAnchor(0, 0, "world", minScale);
  const away = level === "constellation" || level === "star";
  const ringPath = HUB_RING.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join("") + "Z";

  return (
    <div ref={ref} className="anchor" style={{ opacity }} data-away={away || undefined}>
      <div
        className="hub"
        style={{ width: HUB_BOX.w, height: HUB_BOX.h, left: -HUB_BOX.w / 2, top: -HUB_BOX.h / 2 }}
      >
        <svg
          className="pointer-events-none absolute inset-0 overflow-visible"
          viewBox={`${-HUB_BOX.w / 2} ${-HUB_BOX.h / 2} ${HUB_BOX.w} ${HUB_BOX.h}`}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="hub-halo">
              <stop offset="0%" stopColor="#9fb6ff" stopOpacity={0.16} />
              <stop offset="55%" stopColor="#6f86d9" stopOpacity={0.06} />
              <stop offset="100%" stopColor="#6f86d9" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="hub-star">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#c7d3ff" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse rx={330} ry={220} fill="url(#hub-halo)" />
          <path d={ringPath} fill="none" stroke="#c9d5ff" strokeOpacity={0.3} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {HUB_RING.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y})`}>
              <circle r={p.r * 4} fill="url(#hub-star)" opacity={0.35} />
              <circle r={p.r} fill="#eef2ff" />
            </g>
          ))}
        </svg>

        {away && (
          <button
            type="button"
            className="absolute inset-[12%] rounded-[50%] focus-ring"
            onClick={onHome}
            aria-label="Return to the center"
          />
        )}

        <div className="hub-text">
          <h1 className="hub-name">{profile.name}</h1>
          <p className="hub-headline">{profile.headline}</p>
          <p className="hub-tagline">{profile.tagline}</p>
          {!compact && (
            <nav aria-label="Profile">
              <ProfileLinks onAbout={onAbout} className="hub-links" />
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Constellation label ─────────────────────────────────────────────── */

export function ConstellationLabel({
  c,
  emphasis,
  onSelect,
  onHover,
}: {
  c: ResolvedConstellation;
  emphasis: { o: number; flag: string };
  onSelect: (id: ConstellationId) => void;
  onHover: (h: Hover) => void;
}) {
  const ref = useAnchor(c.labelPos.x, c.labelPos.y, "label");
  return (
    <div ref={ref} className="anchor" style={{ opacity: emphasis.o }}>
      <button
        type="button"
        className="const-label focus-ring"
        data-flag={emphasis.flag}
        style={{ "--accent": c.color } as React.CSSProperties}
        onClick={() => onSelect(c.id)}
        onPointerEnter={(e) => e.pointerType === "mouse" && onHover({ kind: "constellation", id: c.id })}
        onPointerLeave={(e) => e.pointerType === "mouse" && onHover(null)}
        onFocus={() => onHover({ kind: "constellation", id: c.id })}
        onBlur={() => onHover(null)}
        aria-label={`${c.name}: ${c.description} Explore this constellation.`}
        data-constellation-btn={c.id}
      >
        <span className="const-name">{c.name}</span>
        <span className="const-tagline">{c.tagline}</span>
      </button>
    </div>
  );
}

/* ─── Star ─────────────────────────────────────────────────────────────── */

export function StarNode({
  star,
  constellationName,
  emphasis,
  showLabel,
  showMeta,
  interactive,
  selected,
  onSelect,
  onHover,
}: {
  star: ResolvedStar;
  constellationName: string;
  emphasis: { o: number; flag: string };
  showLabel: boolean;
  showMeta: boolean;
  interactive: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  onHover: (h: Hover) => void;
}) {
  const ref = useAnchor(star.pos.x, star.pos.y, "label");
  const status = statusText(star);
  return (
    <div
      ref={ref}
      className="anchor"
      style={{ opacity: emphasis.o, "--accent": star.color } as React.CSSProperties}
    >
      <button
        type="button"
        className="star-btn focus-ring"
        data-flag={emphasis.flag}
        data-selected={selected || undefined}
        data-interactive={interactive || undefined}
        data-star-btn={star.id}
        tabIndex={interactive ? 0 : -1}
        aria-label={`${star.title}${star.subtitle ? `, ${star.subtitle}` : ""} — ${constellationName}, ${status}`}
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(star.id)}
        onPointerEnter={(e) => e.pointerType === "mouse" && onHover({ kind: "star", id: star.id })}
        onPointerLeave={(e) => e.pointerType === "mouse" && onHover(null)}
        onFocus={() => onHover({ kind: "star", id: star.id })}
        onBlur={() => onHover(null)}
      >
        <span
          className="star-label"
          data-side={star.labelSide}
          data-visible={showLabel || undefined}
          data-b={star.brightness}
          aria-hidden="true"
        >
          <span className="star-title">{star.title}</span>
          <span className="star-meta" data-visible={showMeta || undefined} data-b={star.brightness}>
            {status}
          </span>
        </span>
      </button>
    </div>
  );
}

/* ─── Signpost: follow a relationship whose other end is off screen ───── */

export function SignpostNode({
  p,
  onNavigate,
  onHover,
}: {
  p: Signpost;
  onNavigate: (v: View) => void;
  onHover: (h: Hover) => void;
}) {
  const ref = useAnchor(p.end.x, p.end.y, "label");
  const angle = (Math.atan2(p.dir.y, p.dir.x) * 180) / Math.PI;
  return (
    <div ref={ref} className="anchor">
      <button
        type="button"
        className="signpost focus-ring"
        data-side={p.side}
        style={{ "--accent": p.color, marginLeft: p.nudge || undefined } as React.CSSProperties}
        onClick={() => onNavigate(p.target)}
        // Hovering the signpost keeps its star "hovered" so it doesn't vanish.
        onPointerEnter={(e) => e.pointerType === "mouse" && onHover({ kind: "star", id: p.source })}
        onPointerLeave={(e) => e.pointerType === "mouse" && onHover(null)}
        aria-label={p.sub ? `Go to ${p.label} in ${p.sub}` : `Go to ${p.label.replace("Also part of ", "")}`}
      >
        <span className="signpost-arrow" style={{ transform: `rotate(${angle}deg)` }} aria-hidden="true">
          →
        </span>
        <span className="signpost-text">
          <span className="signpost-label">{p.label}</span>
          {p.sub && <span className="signpost-sub">{p.sub}</span>}
        </span>
      </button>
    </div>
  );
}
