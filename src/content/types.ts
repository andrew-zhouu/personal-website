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
 *
 * Brightness reflects what a visitor can explore now; it never reflects how
 * impressive something is.
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
  /** Short qualifier shown beside the link, e.g. "Early access". */
  note?: string;
}

/** A real image under /public. Dimensions keep layout stable while loading. */
export interface StarImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
}

/** A piece inside a writing collection (title and description from the work itself). */
export interface WritingPiece {
  title: string;
  form: string;
  description: string;
}

/**
 * How a star's destination is laid out:
 * - `product`  – flagship software: screenshot first, live link, story, proof.
 * - `writing`  – editorial: reading width, pieces, recognition.
 * - `photo`    – a photograph is the centerpiece.
 * - `compact`  – supporting experience: short and to the point.
 */
export type StarLayout = "product" | "writing" | "photo" | "compact";

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
  layout: StarLayout;
  /** Overrides the derived status line (e.g. "Runner-up"). */
  statusLabel?: string;
  /** One line that says what this is, shown large under the title. */
  tagline: string;
  /** One or two plain sentences: what it is. Always real content. */
  summary: string;
  /** The story, in paragraphs. Empty → section omitted. */
  story: string[];
  /** A line of Andrew's own that captures the idea (not a quotation from elsewhere). */
  idea?: string;
  /** What the product does (product layout). */
  features?: string[];
  /** Things worth noticing in the screenshot (product layout). */
  highlights?: string[];
  /** What Andrew specifically did. Empty → section omitted. */
  contributions: string[];
  /** Small key/value facts, e.g. { label: "Beta", value: "1,000+ simplifications" }. */
  proof?: { label: string; value: string }[];
  /** Outcomes and recognition. Empty → section omitted. */
  results: string[];
  /** Pieces in a writing collection. */
  pieces?: WritingPiece[];
  /** A short excerpt from the actual work, with its source. */
  excerpt?: { text: string; source: string };
  links: StarLink[];
  /** First image is the hero. */
  images: StarImage[];
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
  /** A short line naming the relationship, e.g. "Understanding was only the first step." */
  label: string;
  /** Optional longer explanation. */
  note?: string;
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
  };
  links: ProfileLink[];
}
