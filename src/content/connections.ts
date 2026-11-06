import type { Connection } from "./types";

/**
 * Explicit relationships between stars. Each one is drawn on the map, lights
 * up on hover, and appears under "Connected work" in both stars' detail views.
 * Connections are undirected; list each pair once. Add one only when the
 * relationship is real — the map is not meant to be a spiderweb.
 *
 * Secondary constellation membership (e.g. Estimathon also belonging to
 * Connect) is declared on the star itself via `secondary`, not here.
 */
export const connections: Connection[] = [
  {
    a: "unjargon",
    b: "actionplan",
    label: "Understanding was only the first step.",
    note: "After building Unjargon, I started asking what people should do once they understand a document.",
  },
  {
    a: "unjargon",
    b: "nyt-growing-up-with-ai",
    label: "The project that turned into an essay.",
    note: "My New York Times submission grew directly out of building Unjargon.",
  },
  {
    a: "wshs-math-team",
    b: "wshs-website",
    label: "The community behind the code.",
    note: "The website is something I built; the team is the community it was built for.",
  },
  {
    a: "wshs-website",
    b: "competitive-math",
    label: "The contests, documented.",
    note: "The site’s competitions page covers the contests the team takes part in, including AMC and AIME.",
  },
  {
    a: "wshs-math-team",
    b: "competitive-math",
    label: "Where competition math happened.",
    note: "The team was my high school community for competitive mathematics.",
  },
  {
    a: "block-party",
    b: "scottylabs",
    label: "A campus project built with other students.",
  },
  {
    a: "estimathon",
    b: "competitive-math",
    label: "Problem-solving, as a team.",
  },
];
