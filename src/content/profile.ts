import type { Profile } from "./types";

export const profile: Profile = {
  name: "Andrew Zhou",
  headline: "CS @ Carnegie Mellon",
  tagline: "Builder, writer, problem-solver.",
  about: {
    paragraphs: [
      "I study computer science at Carnegie Mellon. My work spans software, writing, and mathematics.",
      "This map arranges that work into four constellations — Build, Write, Solve and Connect — with lines between the pieces that grew out of each other.",
    ],
    placeholder: "A longer introduction is coming soon.",
  },
  // Add real URLs here when they're ready. `href: null` renders as a disabled
  // "coming soon" item and never as a working link.
  links: [
    { id: "about", label: "About", kind: "internal", href: null },
    { id: "resume", label: "Résumé", kind: "external", href: null },
    { id: "contact", label: "Contact", kind: "external", href: null },
    { id: "github", label: "GitHub", kind: "external", href: null },
    { id: "linkedin", label: "LinkedIn", kind: "external", href: null },
  ],
};
