/**
 * Content model for the constellation portfolio.
 *
 * Everything a visitor reads lives in `src/content/*`. The visualization layer
 * (`src/lib`, `src/components`) only consumes these types, so adding a star,
 * changing copy, attaching a photo or editing a connection never requires
 * touching rendering code.
 */

export type Vec = { x: number; y: number };

export type ConstellationId = "build" | "write" | "solve" | "connect";

/**
 * What kind of thing a star is. Together with link availability this decides
 * the star's brightness (see `deriveBrightness` in `src/lib/universe.ts`):
 *
 * - `work`        – a finished project or piece of writing.
 * - `experience`  – a competition, community or event with a story to tell.
 * - `in-progress` – ongoing work without substantial public material yet.
 * - `forthcoming` – a placeholder for content that will be added later.
 */
export type StarStatus = "work" | "experience" | "in-progress" | "forthcoming";

/**
 * - `live`       – verified public URL. Rendered as a real link.
 * - `unverified` – URL exists but has not been confirmed. Shown as text only.
 * - `pending`    – no URL yet. Shown as "coming soon"; `href` must be null.
 */
export type LinkStatus = "live" | "unverified" | "pending";

export interface StarLink {
  label: string;
  href: string | null;
  status: LinkStatus;
}

export interface StarMedia {
  kind: "screenshot" | "photo";
  /** Path under /public, or null while the asset hasn't been supplied. */
  src: string | null;
  alt: string;
  caption?: string;
}

/** Visual prominence within the composition (independent of brightness). */
export type StarSize = "major" | "standard" | "minor";

export type LabelSide = "below" | "above" | "left" | "right";

export interface Star {
  /** Unique across stars, constellations and reserved routes (about). */
  id: string;
  title: string;
  /** Optional secondary line, e.g. a publication name. */
  subtitle?: string;
  constellation: ConstellationId;
  /** Other constellations this star also belongs to (not duplicated). */
  secondary?: ConstellationId[];
  status: StarStatus;
  size: StarSize;
  /** Featured stars keep their label on compact (mobile) overviews. */
  featured?: boolean;
  /** One or two sentences. Always real content. */
  summary: string;
  /** Longer description paragraphs. Empty → an honest placeholder is shown. */
  details: string[];
  /** What Andrew specifically did. Empty → placeholder. */
  contributions: string[];
  /** Outcomes and recognition. Empty → section hidden. */
  results: string[];
  links: StarLink[];
  media: StarMedia | null;
  /** Position relative to the constellation's center, in world units. */
  position: Vec;
  /** Optional override. By default the label goes wherever lines aren't. */
  labelSide?: LabelSide;
}

export interface ConstellationPlacement {
  /** Constellation center in world units (hub is at 0,0). */
  center: Vec;
  /** Uniform scale applied to star positions for this layout. */
  scale?: number;
  /** Label position relative to the center (before scale). */
  label: Vec;
}

export interface Constellation {
  id: ConstellationId;
  name: string;
  /** Short descriptor shown under the label in the overview. */
  tagline: string;
  /** One sentence shown when the constellation is focused. */
  description: string;
  /** Accent color (hex). */
  color: string;
  layouts: {
    landscape: ConstellationPlacement;
    portrait: ConstellationPlacement;
  };
  /**
   * Structural lines that give the constellation its figure: pairs of star
   * ids, both in this constellation. Branching is fine and not every star has
   * to be joined — draw only the lines that make a pleasing, readable shape.
   * Pairs that are also listed in `connections` light up as relationships.
   */
  shape: [string, string][];
}

/**
 * An explicit relationship between two stars. Shown as a line on the map and
 * listed under "Related" in both stars' detail views.
 */
export interface Connection {
  a: string;
  b: string;
  /** Why these two are connected, in plain language. */
  note: string;
}

export interface ProfileLink {
  id: "about" | "resume" | "contact" | "github" | "linkedin";
  label: string;
  /** `internal` links open a view inside the site. */
  kind: "internal" | "external";
  /** null until provided. Never rendered as a functional link while null. */
  href: string | null;
}

export interface Profile {
  name: string;
  headline: string;
  tagline: string;
  about: {
    paragraphs: string[];
    /** Shown while the full bio hasn't been written. */
    placeholder: string;
  };
  links: ProfileLink[];
}
