import type { Star } from "./types";

/**
 * The star inventory.
 *
 * Rules for editing:
 * - Only real work and experiences. Leave `details` / `contributions` empty
 *   rather than inventing them — the UI shows an honest placeholder.
 * - Never put a placeholder URL in `href`. Use `href: null, status: "pending"`.
 * - Brightness is derived, not set: a `live` link makes a star bright,
 *   `in-progress` / `forthcoming` make it subtle, everything else is medium.
 * - `position` is relative to the star's constellation center.
 */
export const stars: Star[] = [
  // ─── BUILD ────────────────────────────────────────────────────────────────
  {
    id: "unjargon",
    title: "Unjargon.AI",
    constellation: "build",
    status: "work",
    size: "major",
    featured: true,
    summary: "An AI-powered tool that makes complicated documents easier to understand.",
    details: [],
    contributions: ["Built and launched independently."],
    results: ["Reached over 1,000 users."],
    links: [{ label: "unjargon.ai", href: "https://unjargon.ai", status: "live" }],
    media: { kind: "screenshot", src: null, alt: "Screenshot of Unjargon.AI" },
    position: { x: 150, y: 40 },
  },
  {
    id: "actionplan",
    title: "ActionPlan",
    constellation: "build",
    status: "work",
    size: "major",
    featured: true,
    summary:
      "An AI-powered tool that turns documents into practical action items, deadlines, and next steps.",
    details: [
      "It comes from my interest in helping people move from understanding information to acting on it.",
    ],
    contributions: [],
    results: [],
    // Flip to "live" once the site is confirmed. The star brightens automatically.
    links: [{ label: "useactionplan.com", href: "https://useactionplan.com", status: "unverified" }],
    media: { kind: "screenshot", src: null, alt: "Screenshot of ActionPlan" },
    position: { x: -70, y: -48 },
  },
  {
    id: "wshs-website",
    title: "WSHS Math Team Website",
    constellation: "build",
    status: "work",
    size: "standard",
    summary: "A website I built for my high school mathematics team.",
    details: [],
    contributions: ["Built the site for the team."],
    results: [],
    links: [{ label: "wshsmathteam.org", href: "https://wshsmathteam.org", status: "live" }],
    media: { kind: "screenshot", src: null, alt: "Screenshot of the WSHS Math Team website" },
    position: { x: -230, y: 70 },
  },
  {
    id: "block-party",
    title: "Block Party",
    subtitle: "with ScottyLabs",
    constellation: "build",
    status: "in-progress",
    size: "minor",
    summary:
      "A work-in-progress project with ScottyLabs at Carnegie Mellon, focused on forecasting university meal-block usage.",
    details: [],
    contributions: [],
    results: [],
    links: [],
    media: null,
    position: { x: 320, y: 140 },
  },

  // ─── WRITE ────────────────────────────────────────────────────────────────
  {
    id: "nyt-growing-up-with-ai",
    title: "Growing Up With A.I.",
    subtitle: "The New York Times",
    constellation: "write",
    status: "work",
    size: "standard",
    featured: true,
    summary:
      "My submission was selected as a runner-up in The New York Times' Growing Up With A.I. Challenge.",
    details: ["The submission was directly connected to my work on Unjargon.AI."],
    contributions: [],
    results: ["Runner-up, The New York Times' Growing Up With A.I. Challenge."],
    links: [
      { label: "Public recognition", href: null, status: "pending" },
      { label: "Original written response", href: null, status: "pending" },
    ],
    media: null,
    position: { x: -180, y: -95 },
  },
  {
    id: "creative-nonfiction",
    title: "Selected Creative Nonfiction",
    constellation: "write",
    status: "work",
    size: "major",
    summary: "A collection of my creative nonfiction.",
    details: [],
    contributions: [],
    results: [
      "National recognition through YoungArts and the U.S. Presidential Scholars in the Arts program.",
    ],
    links: [{ label: "Writing samples", href: null, status: "pending" }],
    media: null,
    position: { x: 0, y: 15 },
  },
  {
    id: "poetry",
    title: "Poetry",
    constellation: "write",
    status: "forthcoming",
    size: "minor",
    summary: "Selected poems and other personal writing.",
    details: [],
    contributions: [],
    results: [],
    links: [],
    media: null,
    position: { x: 150, y: 95 },
  },

  // ─── SOLVE ────────────────────────────────────────────────────────────────
  {
    id: "competitive-math",
    title: "Competitive Mathematics",
    constellation: "solve",
    status: "experience",
    size: "standard",
    summary: "My mathematical interests and problem-solving background.",
    details: [],
    contributions: [],
    results: [
      "Qualified for the USA Mathematical Olympiad (USAMO) in 2026.",
      "Three-time AIME qualifier.",
    ],
    links: [],
    media: null,
    position: { x: -70, y: -10 },
  },
  {
    id: "wshs-math-team",
    title: "WSHS Math Team",
    constellation: "solve",
    secondary: ["connect"],
    status: "experience",
    size: "standard",
    summary: "My high school mathematics community and competition experiences.",
    details: [],
    contributions: [],
    results: [],
    links: [],
    media: { kind: "photo", src: null, alt: "Photo of the WSHS Math Team" },
    position: { x: 100, y: -160 },
  },
  {
    id: "estimathon",
    title: "Jane Street Estimathon",
    constellation: "solve",
    secondary: ["connect"],
    status: "experience",
    size: "standard",
    summary: "My team placed third at a Jane Street Estimathon hosted at Carnegie Mellon in 2026.",
    details: [],
    contributions: [],
    results: ["3rd place (team), Jane Street Estimathon at Carnegie Mellon, 2026."],
    links: [],
    media: { kind: "photo", src: null, alt: "Photo from the Jane Street Estimathon" },
    position: { x: 170, y: 90 },
  },

  // ─── CONNECT ──────────────────────────────────────────────────────────────
  {
    id: "scottylabs",
    title: "ScottyLabs",
    constellation: "connect",
    status: "experience",
    size: "standard",
    summary:
      "A student technology organization at Carnegie Mellon where I've worked on collaborative projects.",
    details: [],
    contributions: [],
    results: [],
    links: [],
    media: null,
    position: { x: -20, y: -140 },
  },
  {
    id: "hackathons",
    title: "Hackathons & Mentoring",
    constellation: "connect",
    status: "experience",
    size: "standard",
    summary: "Hackathon participation, judging, mentoring, and collaboration.",
    details: [],
    contributions: [],
    results: [],
    links: [],
    media: { kind: "photo", src: null, alt: "Photos from hackathons" },
    position: { x: -170, y: 40 },
  },
];
