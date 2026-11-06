import type { Profile } from "./types";

export const profile: Profile = {
  name: "Andrew Zhou",
  headline: "CS @ Carnegie Mellon",
  tagline: "Builder, writer, problem-solver.",
  about: {
    paragraphs: [
      "I build things, write things, and spend a lot of time thinking about problems I probably could have just ignored.",
      "I’m studying computer science at Carnegie Mellon, but my interests have always wandered between software, mathematics, and writing. I especially like finding an interesting question and following it far enough that it turns into something real.",
    ],
  },
  // `href: null` renders as a disabled "coming soon" item, never a working link.
  links: [
    { id: "about", label: "About", kind: "internal", href: null },
    // Public product résumé (version without phone number).
    { id: "resume", label: "Résumé", kind: "external", href: "/andrew-zhou-resume.pdf" },
    { id: "contact", label: "Contact", kind: "external", href: "mailto:andrewzhou135@gmail.com" },
    { id: "github", label: "GitHub", kind: "external", href: "https://github.com/andrew-zhouu" },
    { id: "linkedin", label: "LinkedIn", kind: "external", href: "https://www.linkedin.com/in/andrewzhouu" },
  ],
};
