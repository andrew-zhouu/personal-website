"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { profile, type StarImage, type StarLink, type StarVideo } from "@/content";
import { panelGeometry, type PanelSize, type View, type Viewport } from "@/lib/camera";
import { statusText, type ResolvedStar, type Universe } from "@/lib/universe";
import { ProfileLinks } from "./Overlay";

const EASE_OUT = [0.2, 0.7, 0.2, 1] as const;

/* ─── Shell ────────────────────────────────────────────────────────────── */

interface ShellProps {
  vp: Viewport;
  size: PanelSize;
  accent: string;
  reduced: boolean;
  labelledBy: string;
  variant: string;
  children: ReactNode;
}

/**
 * Positions the destination beside its star and makes it emerge from the
 * star's side (a hairline "leader" joins them), so it reads as a place on the
 * map rather than a modal dropped on top. Width depends on what's inside.
 */
function PanelShell({ vp, size, accent, reduced, labelledBy, variant, children }: ShellProps) {
  const g = panelGeometry(vp, size);
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
        data-size={size}
        data-variant={variant}
        style={
          side
            ? ({ left: g.left, top: g.top, width: g.width, maxHeight: vp.h - g.top - 24, transformOrigin: "left center", "--accent": accent } as React.CSSProperties)
            : ({ left: g.left, top: g.top, width: g.width, bottom: 0, transformOrigin: "center top", "--accent": accent } as React.CSSProperties)
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

/* ─── Building blocks ──────────────────────────────────────────────────── */

function Section({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`panel-section ${className}`}>
      <h3 className="panel-h3">{title}</h3>
      {children}
    </section>
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

/** Full-size view of a screenshot or photo. Escape closes it (and only it). */
function ImageViewer({ image, onClose }: { image: StarImage; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  return createPortal(
    <motion.div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <figure className="viewer-figure" onClick={(e) => e.stopPropagation()}>
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className="viewer-img"
          sizes="100vw"
        />
        {image.caption && <figcaption className="viewer-caption">{image.caption}</figcaption>}
      </figure>
      <button ref={closeRef} type="button" className="btn-chrome viewer-close" onClick={onClose}>
        Close <span aria-hidden="true">✕</span>
      </button>
    </motion.div>,
    document.body,
  );
}

/** A framed image that opens full size on click. */
function Shot({
  image,
  variant = "screen",
  sizes,
  priority,
}: {
  image: StarImage;
  variant?: "screen" | "photo" | "thumb" | "strip";
  sizes: string;
  priority?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <figure className="shot" data-variant={variant}>
      <button
        type="button"
        className="shot-frame"
        onClick={() => setOpen(true)}
        aria-label={`View larger: ${image.alt}`}
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes={sizes}
          priority={priority}
          className="shot-img"
        />
        <span className="shot-zoom" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M8.5 1.5h4v4M12.5 1.5L8 6M5.5 12.5h-4v-4M1.5 12.5L6 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {image.caption && <figcaption className="shot-caption">{image.caption}</figcaption>}
      <AnimatePresence>{open && <ImageViewer image={image} onClose={() => setOpen(false)} />}</AnimatePresence>
    </figure>
  );
}

function LinkButtons({ links, primaryLabel }: { links: StarLink[]; primaryLabel?: (l: StarLink) => string }) {
  const live = links.filter((l) => l.status === "live" && l.href);
  if (!live.length) return null;
  return (
    <div className="panel-actions">
      {live.map((l, i) => (
        <a
          key={l.href}
          href={l.href!}
          target="_blank"
          rel="noopener noreferrer"
          className={i === 0 ? "btn-primary" : "btn-secondary"}
        >
          {primaryLabel ? primaryLabel(l) : `Visit ${l.label}`}
          <span aria-hidden="true">↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ))}
      {live[0].note && <span className="action-note">{live[0].note}</span>}
    </div>
  );
}

function Header({
  star,
  universe,
  onClose,
  headingRef,
  headingId,
}: {
  star: ResolvedStar;
  universe: Universe;
  onClose: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  headingId: string;
}) {
  const c = universe.constellationById.get(star.constellation)!;
  return (
    <>
      <div className="panel-top">
        <p className="kicker">
          <span className="dot" style={{ background: star.color }} aria-hidden="true" />
          <span style={{ color: star.color }}>{c.name}</span>
          {star.secondary?.map((sid) => {
            const sc = universe.constellationById.get(sid)!;
            return (
              <span key={sid} className="kicker-also" style={{ color: sc.color }}>
                + {sc.name}
              </span>
            );
          })}
          <span className="status-chip" data-b={star.brightness}>
            {statusText(star)}
          </span>
        </p>
        <CloseButton label={`Close and return to ${c.name}`} onClick={onClose} />
      </div>
      <h2 id={headingId} ref={headingRef} tabIndex={-1} className="panel-title">
        {star.detailTitle ?? star.title}
      </h2>
      {star.subtitle && <p className="panel-subtitle">{star.subtitle}</p>}
      <p className="panel-tagline">{star.tagline}</p>
    </>
  );
}

function Story({ paragraphs }: { paragraphs: string[] }) {
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className="panel-p">
          {p}
        </p>
      ))}
    </>
  );
}

function Results({ items }: { items: string[] }) {
  return (
    <ul className="results">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

function Proof({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="proof">
      {items.map((p) => (
        <div key={p.label} className="proof-item">
          <dt>{p.label}</dt>
          <dd>{p.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function OtherLinks({ links }: { links: StarLink[] }) {
  const rest = links.filter((l) => !(l.status === "live" && l.href));
  if (!rest.length) return null;
  return (
    <Section title="Links">
      <ul>
        {rest.map((l) => (
          <li key={l.label} className="link-row">
            <span className="text-ink-1">{l.label}</span>
            <span className="link-status">{l.status === "unverified" ? "Not yet verified" : "Coming soon"}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Connected({
  star,
  universe,
  onNavigate,
}: {
  star: ResolvedStar;
  universe: Universe;
  onNavigate: (v: View) => void;
}) {
  if (!star.related.length && !star.secondary?.length) return null;
  return (
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
                <span className="related-label">{r.label}</span>
                <span className="related-top">
                  <span className="related-title">{other.title}</span>
                  <span className="related-c">{oc.name}</span>
                  <span className="related-go">
                    View <span aria-hidden="true">→</span>
                  </span>
                </span>
                {r.note && <span className="related-note">{r.note}</span>}
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
                className="related is-quiet focus-ring"
                style={{ "--accent": oc.color } as React.CSSProperties}
                onClick={() => onNavigate({ kind: "constellation", id: cid })}
              >
                <span className="related-top">
                  <span className="related-title">Also part of {oc.name}</span>
                  <span className="related-go">
                    Explore <span aria-hidden="true">→</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function Footer({ back, backLabel, onHome }: { back: () => void; backLabel: string; onHome: () => void }) {
  return (
    <footer className="panel-footer">
      <button type="button" className="btn-secondary" onClick={back}>
        <span aria-hidden="true">←</span> Back to {backLabel}
      </button>
      <button type="button" className="btn-quiet focus-ring" onClick={onHome}>
        Return to center
      </button>
    </footer>
  );
}

/* ─── Variants ─────────────────────────────────────────────────────────── */

interface VariantProps {
  star: ResolvedStar;
  universe: Universe;
  onNavigate: (v: View) => void;
}

/** Flagship software: product first, then the why, then proof. */
function ProductBody({ star, universe, onNavigate }: VariantProps) {
  const [hero, ...more] = star.images;
  return (
    <>
      <LinkButtons links={star.links} />
      {hero && <Shot image={hero} sizes="(max-width: 900px) 100vw, 820px" priority />}
      <p className="panel-lead">{star.summary}</p>
      {star.proof && <Proof items={star.proof} />}
      {star.idea && (
        <blockquote className="idea">
          <p>{star.idea}</p>
        </blockquote>
      )}
      {star.story.length > 0 && (
        <Section title={star.id === "unjargon" ? "Where it started" : "The story"}>
          <Story paragraphs={star.story} />
        </Section>
      )}
      {star.features && (
        <Section title="What it does">
          <ul className="feature-grid">
            {star.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Section>
      )}
      {star.highlights && (
        <Section title="In the screenshot">
          <ul className="panel-list">
            {star.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </Section>
      )}
      {more.length > 0 && (
        <div className="shot-row">
          {more.map((img) => (
            <Shot key={img.src} image={img} variant="thumb" sizes="(max-width: 900px) 100vw, 400px" />
          ))}
        </div>
      )}
      {star.contributions.length > 0 && (
        <Section title="My role">
          <ul className="panel-list">
            {star.contributions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Section>
      )}
      {star.results.length > 0 && (
        <Section title="Results">
          <Results items={star.results} />
        </Section>
      )}
      <OtherLinks links={star.links} />
      <Connected star={star} universe={universe} onNavigate={onNavigate} />
    </>
  );
}

/** Writing: reading column, recognition up top, pieces as a small contents page. */
function WritingBody({ star, universe, onNavigate }: VariantProps) {
  return (
    <>
      <LinkButtons links={star.links} primaryLabel={(l) => l.label} />
      {star.results.length > 0 && <Results items={star.results} />}
      {star.excerpt && (
        <figure className="excerpt">
          <blockquote>
            <p>{star.excerpt.text}</p>
          </blockquote>
          <figcaption>{star.excerpt.source}</figcaption>
        </figure>
      )}
      <div className="reading">
        <p className="panel-lead">{star.summary}</p>
        {star.idea && (
          <blockquote className="idea">
            <p>{star.idea}</p>
          </blockquote>
        )}
        {star.story.length > 0 && <Story paragraphs={star.story} />}
      </div>
      {star.pieces && (
        <Section title="In the collection">
          <ol className="pieces">
            {star.pieces.map((p) => (
              <li key={p.title} className="piece">
                <span className="piece-form">{p.form}</span>
                <span className="piece-title">{p.title}</span>
                <span className="piece-desc">{p.description}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}
      <OtherLinks links={star.links} />
      <Connected star={star} universe={universe} onNavigate={onNavigate} />
    </>
  );
}

/**
 * A short event clip. Muted, looping, inline, with native controls. It starts
 * only once the destination has settled and the clip is actually in view, and
 * never under reduced motion; until then only metadata + poster load.
 */
function Clip({ video }: { video: StarVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = !!useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    let io: IntersectionObserver | null = null;
    // Wait for the camera and panel to finish arriving before any playback.
    const t = window.setTimeout(() => {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) el.play().catch(() => {});
          else el.pause();
        },
        { threshold: 0.5 },
      );
      io.observe(el);
    }, 1000);
    return () => {
      window.clearTimeout(t);
      io?.disconnect();
    };
  }, [reduced]);
  return (
    <figure className="clip">
      <video
        ref={ref}
        className="clip-video"
        src={video.src}
        poster={video.poster}
        width={video.width}
        height={video.height}
        muted
        loop
        playsInline
        controls
        preload={reduced ? "none" : "metadata"}
        aria-label={video.alt}
      />
      {video.caption && <figcaption className="shot-caption">{video.caption}</figcaption>}
    </figure>
  );
}

/** A photograph (or a clip and a photo) as the centerpiece; words stay brief. */
function PhotoBody({ star, universe, onNavigate }: VariantProps) {
  const [photo] = star.images;
  return (
    <>
      {star.video ? (
        // Event layout: clip and photo side by side at a shared height.
        <div className="media-pair">
          <Clip video={star.video} />
          {photo && <Shot image={photo} variant="strip" sizes="(max-width: 900px) 100vw, 360px" />}
        </div>
      ) : (
        photo && (
          <div className="photo-bleed">
            <Shot image={photo} variant="photo" sizes="(max-width: 900px) 100vw, 820px" priority />
          </div>
        )
      )}
      <div className="reading">
        <p className="panel-lead">{star.summary}</p>
        <Story paragraphs={star.story} />
      </div>
      {star.results.length > 0 && (
        <Section title="Results">
          <Results items={star.results} />
        </Section>
      )}
      <Connected star={star} universe={universe} onNavigate={onNavigate} />
    </>
  );
}

/** Supporting experiences: short and complete. */
function CompactBody({ star, universe, onNavigate }: VariantProps) {
  return (
    <>
      <p className="panel-lead">{star.summary}</p>
      <Story paragraphs={star.story} />
      {star.contributions.length > 0 && (
        <Section title={star.status === "in-progress" ? "My role" : "What I did"}>
          <ul className="panel-list">
            {star.contributions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Section>
      )}
      {star.results.length > 0 && (
        <Section title="Highlights">
          <Results items={star.results} />
        </Section>
      )}
      <LinkButtons links={star.links} />
      <Connected star={star} universe={universe} onNavigate={onNavigate} />
    </>
  );
}

/** A creative pursuit: a few real numbers, personal words, a quiet footnote. */
function CreativeBody({ star, universe, onNavigate }: VariantProps) {
  return (
    <>
      {star.metrics && (
        <dl className="metrics">
          {star.metrics.map((m) => (
            <div key={m.label} className="metric">
              <dt className="metric-label">{m.label}</dt>
              <dd className="metric-value">{m.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="reading">
        <p className="panel-lead">{star.summary}</p>
        <Story paragraphs={star.story} />
      </div>
      <LinkButtons links={star.links} primaryLabel={(l) => l.label} />
      {star.footnote && (
        <p className="footnote">
          <span className="footnote-mark" aria-hidden="true" />
          {star.footnote}
        </p>
      )}
      <Connected star={star} universe={universe} onNavigate={onNavigate} />
    </>
  );
}

const SIZE: Record<ResolvedStar["layout"], PanelSize> = {
  product: "wide",
  photo: "wide",
  writing: "standard",
  compact: "compact",
  creative: "standard",
};

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
  const headingId = `panel-title-${star.id}`;
  const back = () => onNavigate({ kind: "constellation", id: c.id });
  const props = { star, universe, onNavigate };

  return (
    <PanelShell
      vp={vp}
      size={SIZE[star.layout]}
      accent={star.color}
      reduced={reduced}
      labelledBy={headingId}
      variant={star.layout}
    >
      <header>
        <Header star={star} universe={universe} onClose={back} headingRef={headingRef} headingId={headingId} />
      </header>
      {star.layout === "product" && <ProductBody {...props} />}
      {star.layout === "writing" && <WritingBody {...props} />}
      {star.layout === "photo" && <PhotoBody {...props} />}
      {star.layout === "compact" && <CompactBody {...props} />}
      {star.layout === "creative" && <CreativeBody {...props} />}
      <Footer back={back} backLabel={c.name} onHome={() => onNavigate({ kind: "overview" })} />
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
  const pending = profile.links.filter((l) => l.kind === "external" && !l.href);
  return (
    <PanelShell vp={vp} size="standard" accent="#c9d5ff" reduced={reduced} labelledBy="panel-title-about" variant="about">
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
      </header>
      <div className="reading mt-5">
        {profile.about.paragraphs.map((p, i) => (
          <p key={i} className={i === 0 ? "panel-lead" : "panel-p"}>
            {p}
          </p>
        ))}
      </div>
      <Section title="Elsewhere">
        <ProfileLinks onAbout={() => {}} exclude={["about"]} className="about-links" itemClassName="about-link" />
        {pending.length > 0 && (
          <p className="mt-2 text-[13.5px] text-ink-3">
            {pending.map((l) => l.label).join(", ")} coming soon.
          </p>
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
