"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { profile } from "@/content";
import type { View } from "@/lib/camera";
import { statusText, type Universe } from "@/lib/universe";
import { BrightnessGlyph, Legend } from "./Chrome";

/**
 * Plain, searchable list of everything on the map, for visitors who'd rather
 * not explore. Each entry can jump straight to its star.
 */
export function IndexView({
  universe,
  reduced,
  onClose,
  onNavigate,
}: {
  universe: Universe;
  reduced: boolean;
  onClose: () => void;
  onNavigate: (v: View) => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const query = q.trim().toLowerCase();
  const groups = useMemo(
    () =>
      universe.constellations.map((c) => ({
        c,
        stars: c.starIds
          .map((id) => universe.starById.get(id)!)
          .filter((s) => {
            if (!query) return true;
            const hay = [s.title, s.subtitle, s.summary, ...s.results, c.name, ...(s.secondary ?? [])]
              .join(" ")
              .toLowerCase();
            return hay.includes(query);
          }),
      })),
    [universe, query],
  );
  const total = groups.reduce((n, g) => n + g.stars.length, 0);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="index-title"
      className="index-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: reduced ? 0.1 : 0.25 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-5 sm:px-8 sm:pt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="kicker">{profile.name}</p>
            <h2 id="index-title" className="mt-1 text-[34px] font-semibold tracking-[-0.02em] text-white">
              All work
            </h2>
          </div>
          <button type="button" className="btn-chrome focus-ring" onClick={onClose}>
            <span aria-hidden="true">✕</span> Back to map
          </button>
        </div>

        <div className="mt-6">
          <label htmlFor="index-search" className="sr-only">
            Search work
          </label>
          <input
            id="index-search"
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects, writing, competitions…"
            className="index-search focus-ring"
            autoComplete="off"
          />
          <p className="mt-2 text-[13.5px] text-ink-2" aria-live="polite">
            {query ? `${total} result${total === 1 ? "" : "s"}` : `${total} stars in 4 constellations`}
          </p>
        </div>

        <Legend className="mt-6" />

        {groups.map(({ c, stars }) =>
          stars.length === 0 ? null : (
            <section key={c.id} className="mt-10" aria-labelledby={`index-${c.id}`}>
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <h3 id={`index-${c.id}`} className="index-group-title" style={{ color: c.color }}>
                  {c.name}
                </h3>
                <button
                  type="button"
                  className="btn-quiet focus-ring"
                  onClick={() => onNavigate({ kind: "constellation", id: c.id })}
                >
                  Show on map <span aria-hidden="true">→</span>
                </button>
              </div>
              <p className="mt-2 text-[15px] text-ink-2">{c.description}</p>
              <ul className="mt-2">
                {stars.map((s) => {
                  const live = s.links.find((l) => l.status === "live" && l.href);
                  return (
                    <li key={s.id} className="index-row">
                      <button
                        type="button"
                        className="index-item focus-ring"
                        onClick={() => onNavigate({ kind: "star", id: s.id })}
                      >
                        <BrightnessGlyph b={s.brightness} color={s.color} />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-[16.5px] font-semibold text-white">{s.title}</span>
                            {s.subtitle && <span className="text-[13.5px] text-ink-2">{s.subtitle}</span>}
                          </span>
                          <span className="mt-1 block text-[15px] leading-snug text-ink-1">{s.summary}</span>
                        </span>
                        <span className="index-status">{statusText(s)}</span>
                      </button>
                      {live && (
                        <a href={live.href!} target="_blank" rel="noopener noreferrer" className="index-ext text-link">
                          {live.label} <span aria-hidden="true">↗</span>
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ),
        )}

        {total === 0 && <p className="mt-10 text-ink-2">Nothing matches “{q}”.</p>}
      </div>
    </motion.div>
  );
}
