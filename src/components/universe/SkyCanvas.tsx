"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import type { ConstellationId } from "@/content";
import { mix } from "@/lib/color";
import type { Emphasis, Hover } from "@/lib/emphasis";
import { makeStarfield } from "@/lib/sky";
import type { Signpost } from "@/lib/links";
import type { ResolvedStar, Universe } from "@/lib/universe";
import { useCamera } from "./camera-engine";

/**
 * Brightness is the main visual signal: how much a visitor can explore now.
 * Bright stars get a white-hot core, an inner bloom and a wide soft halo;
 * medium stars a tinted core and modest halo; subtle stars an outlined core.
 * Size (major/standard/minor) only nudges scale within each tier.
 */
const LOOK = {
  bright: { core: 7, halo: 76, haloO: 1, bloom: 24, bloomO: 0.75, white: 0.86 },
  medium: { core: 5.6, halo: 44, haloO: 0.9, bloom: 13, bloomO: 0.42, white: 0.55 },
  subtle: { core: 4.6, halo: 20, haloO: 0.45, bloom: 0, bloomO: 0, white: 0 },
} as const;
const SIZE_K = { major: 1.14, standard: 1, minor: 0.9 } as const;

const Starfield = memo(function Starfield() {
  const field = useMemo(() => makeStarfield(), []);
  return (
    <>
      {field.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#c9d4f2" opacity={s.o} />
      ))}
    </>
  );
});

function StarGlyph({ star, o, flag, selected }: { star: ResolvedStar; o: number; flag: string; selected: boolean }) {
  const look = LOOK[star.brightness];
  const k = SIZE_K[star.size];
  const core = look.core * k;
  return (
    <g
      transform={`translate(${star.pos.x} ${star.pos.y})`}
      className="sky-star"
      data-flag={flag}
      data-b={star.brightness}
      data-selected={selected || undefined}
      style={{ opacity: o }}
    >
      <circle
        r={look.halo * k}
        fill={`url(#glow-${star.constellation})`}
        className="sky-star-glow"
        style={{ opacity: look.haloO }}
      />
      {look.bloom > 0 && <circle r={look.bloom * k} fill="url(#bloom)" opacity={look.bloomO} />}
      {/* "You are here" marker for the selected star. */}
      <circle r={core * 3.4} className="sky-star-orbit" stroke={star.color} />
      {star.brightness === "subtle" ? (
        <>
          <circle
            r={core}
            fill="#070b17"
            stroke={star.color}
            strokeWidth={1.4}
            vectorEffect="non-scaling-stroke"
            className="sky-star-core"
          />
          <circle r={1.4} fill={star.color} />
        </>
      ) : (
        <circle r={core} fill={mix(star.color, "#ffffff", look.white)} className="sky-star-core" />
      )}
    </g>
  );
}

interface Props {
  universe: Universe;
  emphasis: Emphasis;
  signposts: Signpost[];
  selectedId: string | null;
  regionsActive: ConstellationId[];
  onRegion: (id: ConstellationId) => void;
  onRegionHover: (h: Hover) => void;
  onBackground: () => void;
}

export function SkyCanvas({ universe, emphasis, signposts, selectedId, regionsActive, onRegion, onRegionHover, onBackground }: Props) {
  const engine = useCamera();
  const worldRef = useRef<SVGGElement>(null);
  const fieldRef = useRef<SVGGElement>(null);

  useEffect(() => {
    engine.attach(worldRef.current, fieldRef.current);
    return () => engine.attach(null, null);
  }, [engine]);

  const { constellations, stars, edges } = universe;

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onBackground();
      }}
    >
      <defs>
        {constellations.map((c) => (
          <radialGradient key={c.id} id={`glow-${c.id}`}>
            <stop offset="0%" stopColor={mix(c.color, "#ffffff", 0.35)} stopOpacity={0.85} />
            <stop offset="12%" stopColor={c.color} stopOpacity={0.5} />
            <stop offset="36%" stopColor={c.color} stopOpacity={0.17} />
            <stop offset="70%" stopColor={c.color} stopOpacity={0.05} />
            <stop offset="100%" stopColor={c.color} stopOpacity={0} />
          </radialGradient>
        ))}
        <radialGradient id="bloom">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
          <stop offset="35%" stopColor="#ffffff" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>
        {edges
          .filter((e) => e.kind !== "shape")
          .map((e) => (
            <linearGradient
              key={e.id}
              id={`grad-${e.id.replace(/[^a-z0-9-]/gi, "_")}`}
              gradientUnits="userSpaceOnUse"
              x1={e.from.x}
              y1={e.from.y}
              x2={e.to.x}
              y2={e.to.y}
            >
              <stop offset="0%" stopColor={e.colorA} />
              <stop offset="100%" stopColor={e.colorB} />
            </linearGradient>
          ))}
      </defs>

      <g ref={fieldRef} className="pointer-events-none">
        <Starfield />
      </g>

      <g ref={worldRef}>
        {/* Generous click regions: tap anywhere in a constellation to focus it. */}
        {constellations.map((c) => {
          const active = regionsActive.includes(c.id);
          const b = c.bounds;
          return (
            <rect
              key={c.id}
              x={b.minX}
              y={b.minY}
              width={b.maxX - b.minX}
              height={b.maxY - b.minY}
              rx={80}
              fill="transparent"
              className={active ? "cursor-pointer" : "pointer-events-none"}
              onClick={(e) => {
                e.stopPropagation();
                onRegion(c.id);
              }}
              onPointerEnter={(e) => e.pointerType === "mouse" && onRegionHover({ kind: "constellation", id: c.id })}
              onPointerLeave={(e) => e.pointerType === "mouse" && onRegionHover(null)}
            />
          );
        })}

        <g className="pointer-events-none" fill="none">
          {edges.map((e) => {
            const em = emphasis.edge.get(e.id)!;
            const shape = e.kind === "shape";
            return (
              <path
                key={e.id}
                d={e.d}
                stroke={shape ? e.colorA : `url(#grad-${e.id.replace(/[^a-z0-9-]/gi, "_")})`}
                strokeWidth={em.active ? 1.6 : shape ? 1.1 : 1.3}
                strokeDasharray={e.kind === "relation" ? "5 6" : e.kind === "association" ? "1 6" : undefined}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="sky-edge"
                data-kind={e.kind}
                style={{ opacity: em.o }}
              />
            );
          })}
          {/* Stubs toward related stars that are off screen (see Signpost). */}
          {signposts.map((p) => (
            <path
              key={p.id}
              d={`M${p.from.x} ${p.from.y}L${p.end.x} ${p.end.y}`}
              stroke={p.items[0].color}
              strokeWidth={1.3}
              strokeDasharray="5 6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="sky-stub"
            />
          ))}
        </g>

        <g className="pointer-events-none">
          {stars.map((s) => {
            const em = emphasis.star.get(s.id)!;
            return <StarGlyph key={s.id} star={s} o={em.o} flag={em.flag} selected={s.id === selectedId} />;
          })}
        </g>
      </g>
    </svg>
  );
}
