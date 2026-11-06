import type { Connection } from "./types";

/**
 * Explicit relationships between stars. Each one is drawn on the map, lights
 * up on hover, and appears under "Related" in both stars' detail views.
 * Connections are undirected; list each pair once.
 *
 * Secondary constellation membership (e.g. Estimathon also belonging to
 * Connect) is declared on the star itself via `secondary`, not here.
 */
export const connections: Connection[] = [
  {
    a: "unjargon",
    b: "actionplan",
    note: "Working on Unjargon got me thinking about helping people act on what they read. That motivated ActionPlan.",
  },
  {
    a: "unjargon",
    b: "nyt-growing-up-with-ai",
    note: "My New York Times submission was directly connected to my work on Unjargon.AI.",
  },
  {
    a: "wshs-math-team",
    b: "wshs-website",
    note: "A piece of software I built for a mathematical community I was part of.",
  },
  {
    a: "wshs-math-team",
    b: "competitive-math",
    note: "My high school team was where much of my competition math happened.",
  },
  {
    a: "block-party",
    b: "scottylabs",
    note: "Block Party is being built with ScottyLabs.",
  },
  {
    a: "estimathon",
    b: "competitive-math",
    note: "Mathematical problem-solving, done as a team.",
  },
];
