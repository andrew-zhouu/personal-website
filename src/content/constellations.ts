import type { Constellation } from "./types";

/**
 * Order matters: it's the order used by keyboard/caption "previous / next"
 * navigation and by the list view.
 *
 * World coordinates: the hub sits at (0, 0); +x is right, +y is down.
 * `landscape` is used for wide viewports, `portrait` for tall phones.
 */
export const constellations: Constellation[] = [
  {
    id: "build",
    name: "Build",
    tagline: "Apps, websites & software",
    description: "Apps, websites, and software I've made.",
    color: "#62c8ff",
    layouts: {
      landscape: { center: { x: -190, y: -420 }, scale: 1.08, label: { x: -330, y: -80 } },
      portrait: { center: { x: 10, y: -590 }, scale: 0.8, label: { x: -225, y: -265 } },
    },
    // A kite with a tail: the three shipped tools form the body, the
    // in-progress project trails off it.
    shape: [
      ["wshs-website", "actionplan"],
      ["actionplan", "unjargon"],
      ["wshs-website", "unjargon"],
      ["unjargon", "block-party"],
    ],
  },
  {
    id: "write",
    name: "Write",
    tagline: "Essays, nonfiction & poetry",
    description: "Essays, creative nonfiction, poetry, and published writing.",
    color: "#b8a6ff",
    layouts: {
      landscape: { center: { x: 650, y: -215 }, label: { x: 95, y: -230 } },
      portrait: { center: { x: -70, y: -330 }, scale: 0.75, label: { x: 350, y: 0 } },
    },
    shape: [
      ["nyt-growing-up-with-ai", "creative-nonfiction"],
      ["creative-nonfiction", "poetry"],
    ],
  },
  {
    id: "solve",
    name: "Solve",
    tagline: "Math & problem-solving",
    description: "Mathematics, competitive problem-solving, and analytical thinking.",
    color: "#6fe0b0",
    layouts: {
      landscape: { center: { x: -600, y: 250 }, label: { x: -150, y: -125 } },
      portrait: { center: { x: -150, y: 330 }, scale: 0.75, label: { x: 440, y: -20 } },
    },
    // Both branches are real relationships, meeting at competition math.
    shape: [
      ["competitive-math", "wshs-math-team"],
      ["competitive-math", "estimathon"],
    ],
  },
  {
    id: "connect",
    name: "Connect",
    tagline: "Communities & collaboration",
    description: "Communities, collaborations, mentoring, and experiences involving other people.",
    color: "#f3c06a",
    layouts: {
      landscape: { center: { x: 500, y: 380 }, label: { x: 200, y: 25 } },
      portrait: { center: { x: 120, y: 580 }, scale: 0.75, label: { x: -395, y: 20 } },
    },
    shape: [["scottylabs", "hackathons"]],
  },
];
