"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import { profile, type StarLink, type StarMedia } from "@/content";
import { panelGeometry, type View, type Viewport } from "@/lib/camera";
import { statusText, type ResolvedStar, type Universe } from "@/lib/universe";
import { ProfileLinks } from "./Overlay";

const EASE_OUT = [0.2, 0.7, 0.2, 1] as const;

interface ShellProps {
  vp: Viewport;
  accent: string;
  reduced: boolean;
  labelledBy: string;
  children: ReactNode;
}

/**
 * Positions the detail view next to its star and makes it emerge from the
 * star's side (a hairline "leader" joins them), so it reads as a place on the
 * map rather than a modal dropped on top.
 */
function PanelShell({ vp, accent, reduced, labelledBy, children }: ShellProps) {
  const g = panelGeometry(vp);
  const side = g.mode === "side";
  const delay = reduced ? 0 : 0.42;
  return (
    <>
      {side ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute h-px origin-left"
          style={{
            left: g.focus.x + 32,
            top: g.focus.y,
            width: Math.max(0, g.left - g.focus.x - 32),
            background: `linear-gradient(90deg, ${accent}dd, ${accent}33)`,
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1, transition: { delay: delay + 0.15, duration: reduced ? 0 : 0.5, ease: EASE_OUT } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        />
      ) : (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute w-px origin-top"
          style={{
            left: g.focus.x,
            top: g.focus.y + 30,
            height: Math.max(0, g.top - g.focus.y - 30),
            background: `linear-gradient(180deg, ${accent}dd, ${accent}33)`,
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1, transition: { delay: delay + 0.15, duration: reduced ? 0 : 0.45, ease: EASE_OUT } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        />
      )}
      <motion.section
        role="region"
        aria-labelledby={labelledBy}
        className="panel pointer-events-auto absolute flex flex-col"
        data-mode={g.mode}
        style={
          side
            ? { left: g.left, top: g.top, width: g.width, maxHeight: vp.h - g.top - 24, transformOrigin: "left center", "--accent": accent } as React.CSSProperties
            : { left: g.left, top: g.top, width: g.width, bottom: 0, transformOrigin: "center top", "--accent": accent } as React.CSSProperties
        }
        initial={reduced ? { opacity: 0 } : side ? { opacity: 0, x: -28, scale: 0.98 } : { opacity: 0, y: 36 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1, transition: { delay, duration: reduced ? 0.15 : 0.5, ease: EASE_OUT } }}
        exit={{ opacity: 0, transition: { duration: 0.18 } }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-scroll">{children}</div>
      </motion.section>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel-section">
      <h3 className="panel-h3">{title}</h3>
      {children}
    </section>
  );
}

function Placeholder({ children }: { children: ReactNode }) {
  return <p className="placeholder">{children}</p>;
}

function Media({ media, accent }: { media: StarMedia; accent: string }) {
  if (media.src) {
    return (
      <figure className="media">
        <Image src={media.src} alt={media.alt} width={1200} height={750} className="h-auto w-full" />
        {media.caption && <figcaption className="media-caption">{media.caption}</figcaption>}
      </figure>
    );
  }
  return (
    <figure className="media media-empty" style={{ "--accent": accent } as React.CSSProperties}>
      <span className="media-empty-label">
        {media.kind === "photo" ? "Photo coming soon" : "Screenshot coming soon"}
      </span>
    </figure>
  );
}

function LinkRow({ link }: { link: StarLink }) {
  if (link.status === "live" && link.href) {
    return (
      <li className="link-row">
        <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-link">
          {link.label} <span aria-hidden="true">↗</span>
        </a>
        <span className="link-status" data-s="live">
          Live
        </span>
      </li>
    );
  }
  return (
    <li className="link-row">
      <span className="text-ink-1">{link.label}</span>
      <span className="link-status" data-s={link.status}>
        {link.status === "unverified" ? "Not yet verified" : "Coming soon"}
      </span>
    </li>
  );
}

function CloseButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="btn-icon" onClick={onClick} aria-label={label} title={label}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.focus({ preventScroll: true }), 60);
    return () => window.clearTimeout(t);
  }, []);
  return ref;
}

export function StarPanel({
  star,
  universe,
  vp,
  reduced,
  onNavigate,
}: {
  star: ResolvedStar;
  universe: Universe;
  vp: Viewport;
  reduced: boolean;
  onNavigate: (v: View) => void;
}) {
  const c = universe.constellationById.get(star.constellation)!;
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const live = star.links.filter((l) => l.status === "live" && l.href);
  const otherLinks = star.links.filter((l) => !(l.status === "live" && l.href));
  const headingId = `panel-title-${star.id}`;
  const back = () => onNavigate({ kind: "constellation", id: c.id });

  return (
    <PanelShell vp={vp} accent={star.color} reduced={reduced} labelledBy={headingId}>
      <header>
        <div className="panel-top">
          <p className="kicker">
            <span className="dot" style={{ background: star.color }} aria-hidden="true" />
            <span style={{ color: star.color }}>{c.name}</span>
            <span className="status-chip" data-b={star.brightness}>
              {statusText(star)}
            </span>
          </p>
          <CloseButton label={`Close and return to ${c.name}`} onClick={back} />
        </div>
        <h2 id={headingId} ref={headingRef} tabIndex={-1} className="panel-title">
          {star.title}
        </h2>
        {star.subtitle && <p className="panel-subtitle">{star.subtitle}</p>}
        <p className="panel-lead">{star.summary}</p>
        {live.length > 0 && (
          <div className="panel-actions">
            {live.map((l) => (
              <a key={l.href} href={l.href!} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Visit {l.label}
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        )}
      </header>

      {star.results.length > 0 && (
        <Section title="Results">
          <ul className="results">
            {star.results.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </Section>
      )}

      {star.media && <Media media={star.media} accent={star.color} />}

      <Section title="About">
        {star.details.length ? (
          star.details.map((p, i) => (
            <p key={i} className="panel-p">
              {p}
            </p>
          ))
        ) : (
          <Placeholder>A longer write-up is coming soon.</Placeholder>
        )}
      </Section>

      <Section title="My role">
        {star.contributions.length ? (
          <ul className="panel-list">
            {star.contributions.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        ) : (
          <Placeholder>Details coming soon.</Placeholder>
        )}
      </Section>

      {otherLinks.length > 0 && (
        <Section title="Links">
          <ul>
            {otherLinks.map((l) => (
              <LinkRow key={l.label} link={l} />
            ))}
          </ul>
        </Section>
      )}

      {(star.related.length > 0 || (star.secondary?.length ?? 0) > 0) && (
        <Section title="Connected work">
          <ul className="related-list">
            {star.related.map((r) => {
              const other = universe.starById.get(r.id)!;
              const oc = universe.constellationById.get(other.constellation)!;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    className="related focus-ring"
                    style={{ "--accent": other.color } as React.CSSProperties}
                    onClick={() => onNavigate({ kind: "star", id: other.id })}
                  >
                    <span className="related-top">
                      <span className="related-title">{other.title}</span>
                      <span className="related-c">{oc.name}</span>
                      <span className="related-go">
                        View <span aria-hidden="true">→</span>
                      </span>
                    </span>
                    <span className="related-note">{r.note}</span>
                  </button>
                </li>
              );
            })}
            {star.secondary?.map((cid) => {
              const oc = universe.constellationById.get(cid)!;
              return (
                <li key={cid}>
                  <button
                    type="button"
                    className="related focus-ring"
                    style={{ "--accent": oc.color } as React.CSSProperties}
                    onClick={() => onNavigate({ kind: "constellation", id: cid })}
                  >
                    <span className="related-top">
                      <span className="related-title">Also part of {oc.name}</span>
                      <span className="related-go">
                        Explore <span aria-hidden="true">→</span>
                      </span>
                    </span>
                    <span className="related-note">{oc.description}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <footer className="panel-footer">
        <button type="button" className="btn-secondary" onClick={back}>
          <span aria-hidden="true">←</span> Back to {c.name}
        </button>
        <button type="button" className="btn-quiet focus-ring" onClick={() => onNavigate({ kind: "overview" })}>
          Return to center
        </button>
      </footer>
    </PanelShell>
  );
}

export function AboutPanel({
  universe,
  vp,
  reduced,
  onNavigate,
}: {
  universe: Universe;
  vp: Viewport;
  reduced: boolean;
  onNavigate: (v: View) => void;
}) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const home = () => onNavigate({ kind: "overview" });
  return (
    <PanelShell vp={vp} accent="#c9d5ff" reduced={reduced} labelledBy="panel-title-about">
      <header>
        <div className="panel-top">
          <p className="kicker">
            <span className="dot" style={{ background: "#dfe6ff" }} aria-hidden="true" />
            About
          </p>
          <CloseButton label="Close and return to the map" onClick={home} />
        </div>
        <h2 id="panel-title-about" ref={headingRef} tabIndex={-1} className="panel-title">
          {profile.name}
        </h2>
        <p className="panel-subtitle">{profile.headline}</p>
        <p className="panel-lead">{profile.tagline}</p>
      </header>
      <Section title="Hello">
        {profile.about.paragraphs.map((p, i) => (
          <p key={i} className="panel-p">
            {p}
          </p>
        ))}
        <Placeholder>{profile.about.placeholder}</Placeholder>
      </Section>
      <Section title="Elsewhere">
        <ProfileLinks onAbout={() => {}} exclude={["about"]} className="-ml-2.5 flex flex-wrap gap-1" />
        {profile.links.some((l) => l.kind === "external" && !l.href) && (
          <p className="mt-2 text-[13.5px] text-ink-3">Dimmed links are coming soon.</p>
        )}
      </Section>
      <Section title="Explore">
        <ul className="related-list">
          {universe.constellations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="related focus-ring"
                style={{ "--accent": c.color } as React.CSSProperties}
                onClick={() => onNavigate({ kind: "constellation", id: c.id })}
              >
                <span className="related-top">
                  <span className="related-title">{c.name}</span>
                  <span className="related-c">{c.starIds.length} stars</span>
                  <span className="related-go">
                    Explore <span aria-hidden="true">→</span>
                  </span>
                </span>
                <span className="related-note">{c.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </Section>
      <footer className="panel-footer">
        <button type="button" className="btn-secondary" onClick={home}>
          <span aria-hidden="true">←</span> Back to the map
        </button>
      </footer>
    </PanelShell>
  );
}
