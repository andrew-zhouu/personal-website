import { connections } from "./connections";
import { constellations } from "./constellations";
import { profile } from "./profile";
import { stars } from "./stars";

export { connections, constellations, profile, stars };
export * from "./types";

/** Ids that can't be used by stars or constellations (they're routes). */
export const RESERVED_IDS = ["about", "index"] as const;

/**
 * Catch content mistakes early (runs once at module load). Throws with a
 * readable message instead of rendering a broken map.
 */
function validate() {
  const problems: string[] = [];
  const ids = new Set<string>(RESERVED_IDS);
  for (const c of constellations) {
    if (ids.has(c.id)) problems.push(`Duplicate id "${c.id}"`);
    ids.add(c.id);
  }
  const constellationIds = new Set(constellations.map((c) => c.id));
  const starIds = new Set<string>();
  for (const s of stars) {
    if (ids.has(s.id)) problems.push(`Duplicate id "${s.id}"`);
    ids.add(s.id);
    starIds.add(s.id);
    if (!constellationIds.has(s.constellation))
      problems.push(`Star "${s.id}" has unknown constellation "${s.constellation}"`);
    for (const l of s.links) {
      if (l.status === "pending" && l.href)
        problems.push(`Star "${s.id}": pending link "${l.label}" must have href: null`);
      if (l.status !== "pending" && !l.href)
        problems.push(`Star "${s.id}": link "${l.label}" is ${l.status} but has no href`);
    }
  }
  for (const c of connections) {
    if (!starIds.has(c.a) || !starIds.has(c.b))
      problems.push(`Connection ${c.a} ↔ ${c.b} references an unknown star`);
  }
  for (const c of constellations) {
    for (const pair of c.shape) {
      for (const id of pair) {
        const s = stars.find((x) => x.id === id);
        if (!s || s.constellation !== c.id)
          problems.push(`Constellation "${c.id}" shape references "${id}" outside it`);
      }
    }
  }
  if (problems.length) throw new Error("Content errors:\n" + problems.join("\n"));
}

validate();
