"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import type { ConstellationId } from "@/content";
import { mix } from "@/lib/color";
import type { Emphasis, Hover } from "@/lib/emphasis";
import { makeStarfield } from "@/lib/sky";
import type { ResolvedStar, Universe } from "@/lib/universe";
import { useCamera } from "./camera-engine";

const CORE_R = { major: 6.6, standard: 5.2, minor: 4 } as const;
const GLOW_R = { bright: 50, medium: 28, subtle: 15 } as const;
const GLOW_O = { bright: 0.85, medium: 0.5, subtle: 0.3 } as const;
const SIZE_K = { major: 1.15, standard: 1, minor: 0.85 } as const;

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
  const core = CORE_R[star.size];
  const glow = GLOW_R[star.brightness] * SIZE_K[star.size];
  const subtle = star.brightness === "subtle";
  const coreFill =
    star.brightness === "bright" ? mix(star.color, "#ffffff", 0.62) : mix(star.color, "#ffffff", 0.3);
  return (
    <g
      transform={`translate(${star.pos.x} ${star.pos.y})`}
      className="sky-star"
      data-flag={flag}
      data-selected={selected || undefined}
      style={{ opacity: o }}
    >
      <circle
        r={glow}
        fill={`url(#glow-${star.constellation})`}
        className="sky-star-glow"
        style={{ opacity: GLOW_O[star.brightness] }}
      />
      {/* "You are here" marker for the selected star. */}
      <circle r={core * 3.4} className="sky-star-orbit" stroke={star.color} />
      {subtle ? (
        <>
          <circle r={core + 0.6} fill="#070b17" stroke={star.color} strokeWidth={1.2} vectorEffect="non-scaling-stroke" className="sky-star-core" />
          <circle r={1.1} fill={star.color} />
        </>
      ) : (
        <circle r={core} fill={coreFill} className="sky-star-core" />
      )}
    </g>
  );
}

interface Props {
  universe: Universe;
  emphasis: Emphasis;
  selectedId: string | null;
  regionsActive: ConstellationId[];
  onRegion: (id: ConstellationId) => void;
  onRegionHover: (h: Hover) => void;
  onBackground: () => void;
}

export function SkyCanvas({ universe, emphasis, selectedId, regionsActive, onRegion, onRegionHover, onBackground }: Props) {
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
            <stop offset="0%" stopColor={mix(c.color, "#ffffff", 0.35)} stopOpacity={0.9} />
            <stop offset="18%" stopColor={c.color} stopOpacity={0.5} />
            <stop offset="50%" stopColor={c.color} stopOpacity={0.12} />
            <stop offset="100%" stopColor={c.color} stopOpacity={0} />
          </radialGradient>
        ))}
        {edges
          .filter((e) => e.cross)
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
            const stroke = e.cross
              ? `url(#grad-${e.id.replace(/[^a-z0-9-]/gi, "_")})`
              : e.colorA;
            return (
              <path
                key={e.id}
                d={e.d}
                stroke={stroke}
                strokeWidth={em.active ? 1.5 : 1}
                strokeDasharray={e.kind === "association" ? "2 5" : undefined}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="sky-edge"
                style={{ opacity: em.o }}
              />
            );
          })}
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
