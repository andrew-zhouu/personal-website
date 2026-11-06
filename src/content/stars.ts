import type { Star } from "./types";

/**
 * The star inventory.
 *
 * Rules for editing:
 * - Only real work and experiences, in Andrew's own words. Leave a field empty
 *   rather than inventing it; empty sections simply don't render.
 * - Never put a placeholder URL in `href`. Use `href: null, status: "pending"`.
 * - Brightness is derived, not set: a `live` link makes a star bright,
 *   `in-progress` / `forthcoming` make it subtle, everything else is medium.
 * - `position` is relative to the star's constellation center.
 * - Images live in /public/images; keep width/height equal to the file's.
 *
 * Sources: Andrew's Phase 2 brief, his product résumé, the supplied
 * screenshots/photo, the Creative Writing Portfolio PDF, and the NYT Learning
 * Network finalists list.
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
    layout: "product",
    tagline: "Making complicated information understandable.",
    summary:
      "An AI-powered web app that turns dense text and documents into plain-language explanations.",
    idea: "What good is access to information if you can't actually understand it?",
    story: [
      "I was researching a Tennessee education bill for a school project when I realized I could barely understand what I was reading. A few sentences in, I was already lost in cross-references and convoluted legal language. I asked my parents whether they understood it. They couldn't make much sense of it either.",
      "At first I was just frustrated. I wanted to finish my assignment. But the problem was much bigger than my school project. I'm a native English speaker, and I was struggling to understand something published by my own government. If I couldn't interpret it, how were other people supposed to understand legislation that affected their lives? And what about people who aren't native English speakers?",
      "The information was technically public. That didn't make it accessible. I wanted to build something that makes complicated information easier to understand, without requiring people to already have legal, technical, or academic expertise.",
    ],
    features: [
      "Domain-specific explanation modes",
      "Different reading and complexity levels",
      "Document and image uploads",
      "Summaries and key takeaways",
      "Definitions for the terms that trip people up",
      "Original and simplified text side by side",
    ],
    contributions: [
      "Designed and developed the app independently, as a full-stack product on AWS.",
      "Worked on its AI integration.",
      "Launched it publicly.",
    ],
    proof: [
      { label: "Built", value: "Independently" },
      { label: "Beta", value: "1,000+ simplifications" },
      { label: "Since", value: "2024" },
    ],
    results: [
      "1,000+ simplifications during beta.",
      "Led to my runner-up submission in The New York Times Learning Network's 2025 “Growing Up With A.I.” Challenge.",
    ],
    links: [{ label: "unjargon.ai", href: "https://unjargon.ai", status: "live" }],
    images: [
      {
        src: "/images/unjargon-results.png",
        alt: "Unjargon showing a SNAP benefits notice on the left and its plain-language summary and numbered main points on the right.",
        width: 1917,
        height: 937,
        caption: "Side by side: a SNAP benefits notice and Unjargon’s plain-language version.",
      },
      {
        src: "/images/unjargon-home.png",
        alt: "Unjargon home screen with a large text box, upload button, domain and reading-level selectors, and example documents.",
        width: 1918,
        height: 938,
        caption: "Paste text or upload a file, then choose a domain and reading level.",
      },
    ],
    position: { x: 150, y: 40 },
  },
  {
    id: "actionplan",
    title: "ActionPlan",
    constellation: "build",
    status: "work",
    size: "major",
    featured: true,
    layout: "product",
    tagline: "Turning documents into concrete next steps.",
    summary:
      "A document-to-action workspace. It reads a document and organizes it into tasks, deadlines, risks, and the questions that still need answers.",
    story: [
      "Unjargon started with the problem of understanding information. After building it, I kept coming back to a related question: what happens after someone understands a document?",
      "Knowing what something says doesn’t tell you what to do about it. That question led to ActionPlan, which analyzes a document and turns it into practical next steps.",
      "It also reflects a broader interest of mine: how AI can help one person handle work that used to take much more time, expertise, or coordination.",
    ],
    highlights: [
      "The original email stays on the left; the plan builds on the right.",
      "The most urgent next step is pulled to the top: the photo-contest deadline, May 22 at 11:59 PM PT.",
      "Six action items, one deadline, and separate tabs for risks and open questions.",
    ],
    contributions: [
      "Product concept, design, and full-stack development.",
      "Reliability work: document classification, date extraction, readability scoring, and structured AI outputs.",
    ],
    proof: [
      { label: "Role", value: "Concept, design, full-stack" },
      { label: "Status", value: "Early access" },
    ],
    results: [],
    links: [
      { label: "useactionplan.com", href: "https://useactionplan.com", status: "live", note: "Early access" },
    ],
    images: [
      {
        src: "/images/actionplan.png",
        alt: "ActionPlan with a scholarship newsletter email on the left and, on the right, a summary, a highlighted next step with its deadline, and a checklist of six action items.",
        width: 1918,
        height: 942,
        caption: "A promotional scholarship email, turned into a plan.",
      },
    ],
    position: { x: -70, y: -48 },
  },
  {
    id: "wshs-website",
    title: "WSHS Math Team Website",
    constellation: "build",
    secondary: ["solve", "connect"],
    status: "work",
    size: "standard",
    layout: "product",
    tagline: "A digital home for my high school math team.",
    summary:
      "A website for the White Station High School Math Team that brings together information about the club and the competitions students can take part in.",
    story: [
      "This is a more community-oriented project than Unjargon or ActionPlan: a site for the people on the team, not a product for strangers.",
      "It’s also where two of my interests meet: building software and the competition math I grew up with.",
    ],
    contributions: ["Created and developed the website."],
    results: [],
    links: [{ label: "wshsmathteam.org", href: "https://wshsmathteam.org", status: "live" }],
    images: [
      {
        src: "/images/wshs-math-team.webp",
        alt: "The WSHS Math Team website’s Competitions page, showing Mu Alpha Theta, TMTA, and AMC 10/12 + AIME.",
        width: 1903,
        height: 938,
        caption: "The competitions page: Mu Alpha Theta, TMTA, and AMC 10/12 + AIME.",
      },
    ],
    position: { x: -230, y: 70 },
  },
  {
    id: "block-party",
    title: "Block Party",
    subtitle: "with ScottyLabs",
    constellation: "build",
    secondary: ["connect"],
    status: "in-progress",
    size: "minor",
    layout: "compact",
    tagline: "Tracking and forecasting campus meal-block usage.",
    summary:
      "An ongoing team project with ScottyLabs: a campus dining tool that tracks meal-block usage and predicts end-of-semester surplus.",
    story: [
      "Work in progress and not launched. I’m co-developing it with engineering and design teammates on ScottyLabs’ Labrador committee.",
    ],
    contributions: ["Product and engineering: ideation, feature scoping, and early development."],
    results: [],
    links: [],
    images: [],
    position: { x: 320, y: 140 },
  },

  // ─── WRITE ────────────────────────────────────────────────────────────────
  {
    id: "nyt-growing-up-with-ai",
    title: "Growing Up With A.I.",
    subtitle: "The New York Times Learning Network",
    constellation: "write",
    status: "work",
    size: "standard",
    featured: true,
    layout: "writing",
    // The linked PDF is the finalists list, not the essay itself.
    statusLabel: "Runner-up",
    tagline: "A runner-up submission about growing up with AI.",
    summary:
      "My submission to The New York Times Learning Network’s 2025 “Growing Up With A.I.” Challenge was selected as a runner-up.",
    idea: "AI should be a bridge, not a crutch.",
    story: [
      "The submission grew directly out of building Unjargon. When I first made it, I saw it as an interesting project that could help people. Watching friends and family use it, and using it myself, changed how I thought about its potential.",
      "In my artist’s statement I reflected on how AI can make complicated information easier to understand, and on the questions that come with that, like how much of our thinking we should delegate to technology.",
      "I became interested in AI not just as a way to produce answers quickly, but as something that can help people develop their own understanding.",
    ],
    contributions: [],
    results: [
      "Runner-up, The New York Times Learning Network 2025 “Growing Up With A.I.” Challenge.",
    ],
    links: [
      {
        label: "Finalists list (NYT Learning Network, PDF)",
        href: "https://static01.nyt.com/newsgraphics/documenttools/06ffd687b02c4c69/c32e4a3e-full.pdf",
        status: "live",
        note: "Recognition only, not the submission",
      },
    ],
    images: [],
    position: { x: -180, y: -95 },
  },
  {
    id: "creative-nonfiction",
    title: "Selected Creative Nonfiction",
    constellation: "write",
    status: "work",
    size: "major",
    layout: "writing",
    tagline: "Selected essays and creative nonfiction.",
    summary:
      "Writing is a real part of my work, not a side note to it. These essays are about language, family, and music.",
    story: [],
    excerpt: {
      text: "The word my grandmother used for love does not survive the ocean.",
      source: "Opening line of “Untranslatable”",
    },
    pieces: [
      {
        title: "Untranslatable",
        form: "Essay in five parts",
        description:
          "Teaching my grandmother English at the kitchen table, relearning Chinese in Shanghai, and what does and doesn’t survive translation.",
      },
      {
        title: "Cadenza",
        form: "Essay in four movements",
        description:
          "The viola: starting at ten, a long plateau, and what improvising taught me about wrong notes.",
      },
    ],
    contributions: [],
    results: [
      "National recognition through YoungArts and the U.S. Presidential Scholars in the Arts program.",
    ],
    links: [
      {
        label: "Read the portfolio",
        href: "https://drive.google.com/file/d/15U7St-ZJzt-nyMiMX3Ax3FY-l9QesP-S/view?usp=sharing",
        status: "live",
        note: "Google Drive, PDF",
      },
    ],
    images: [],
    position: { x: 0, y: 15 },
  },
  {
    id: "poetry",
    title: "Poetry",
    constellation: "write",
    status: "work",
    size: "minor",
    layout: "writing",
    tagline: "A few poems.",
    summary: "Three poems collected in the same writing portfolio as my essays.",
    story: [],
    pieces: [
      {
        title: "on an unnamed rooftop in 我的城市 that is not quite mine",
        form: "Poem",
        description: "A night on 外婆’s rooftop in Huainan, and whether a city can be yours.",
      },
      {
        title: "Orchard of Glass",
        form: "Poem",
        description: "An orchard rooted in glass, tended carefully until it breaks.",
      },
      {
        title: "pressure & prayer",
        form: "Poem",
        description: "A short poem written in slashed fragments.",
      },
    ],
    contributions: [],
    results: [],
    links: [
      {
        label: "Read the portfolio",
        href: "https://drive.google.com/file/d/15U7St-ZJzt-nyMiMX3Ax3FY-l9QesP-S/view?usp=sharing",
        status: "live",
        note: "Google Drive, PDF",
      },
    ],
    images: [],
    position: { x: 150, y: 95 },
  },

  // ─── SOLVE ────────────────────────────────────────────────────────────────
  {
    id: "competitive-math",
    title: "Competitive Mathematics",
    constellation: "solve",
    status: "experience",
    size: "standard",
    layout: "compact",
    tagline: "Competitive mathematics and problem-solving.",
    summary: "Math has been one of my longest-running interests.",
    story: [
      "Beyond the results, I enjoy working through a difficult problem: trying different approaches until I find the structure that makes it solvable.",
    ],
    contributions: [],
    results: ["USAMO qualifier, 2026.", "Three-time AIME qualifier."],
    links: [],
    images: [],
    position: { x: -70, y: -10 },
  },
  {
    id: "wshs-math-team",
    title: "WSHS Math Team",
    constellation: "solve",
    secondary: ["connect"],
    status: "experience",
    size: "standard",
    layout: "compact",
    tagline: "My high school mathematics community.",
    summary:
      "The White Station High School Math Team was part of how I grew up with competitive mathematics.",
    story: [
      "It was a place to work on hard problems with other students who liked them too. It also gave me a reason to build the team website.",
    ],
    contributions: [],
    results: [],
    links: [],
    images: [],
    position: { x: 100, y: -160 },
  },
  {
    id: "estimathon",
    title: "Jane Street Estimathon",
    constellation: "solve",
    secondary: ["connect"],
    status: "experience",
    size: "standard",
    layout: "photo",
    tagline: "Third place at a Jane Street Estimathon at Carnegie Mellon.",
    summary: "My team placed third at a Jane Street Estimathon at CMU.",
    story: [
      "It’s collaborative estimation: questions without clean answers, worked through as a team. I enjoyed the mix of mathematical intuition and reasoning through uncertain questions with other people.",
    ],
    contributions: [],
    results: [],
    links: [],
    images: [
      {
        src: "/images/estimathon.webp",
        alt: "Seven students standing in front of a projected Estimathon scoreboard, several making peace signs.",
        width: 2400,
        height: 1800,
        caption: "Jane Street Estimathon at CMU — 3rd place, 2026.",
      },
    ],
    position: { x: 170, y: 90 },
  },

  // ─── CONNECT ──────────────────────────────────────────────────────────────
  {
    id: "scottylabs",
    title: "ScottyLabs",
    constellation: "connect",
    status: "experience",
    size: "standard",
    layout: "compact",
    tagline: "Building with other students at Carnegie Mellon.",
    summary:
      "A student technology organization at Carnegie Mellon where I’ve collaborated with other students on technical projects.",
    story: [
      "I’m on the Labrador committee, where we’re building Block Party, and in the Foundry builder cohort, where I’ve been developing ActionPlan through weekly customer discovery and iteration.",
    ],
    contributions: [],
    results: [],
    links: [],
    images: [],
    position: { x: -20, y: -140 },
  },
  {
    id: "hackathons",
    title: "Hackathons & Mentoring",
    constellation: "connect",
    status: "experience",
    size: "standard",
    layout: "compact",
    tagline: "Building with people, and helping other people build.",
    summary:
      "I’ve been part of hackathon communities as a mentor, judge, and organizer.",
    story: [
      "I like environments where people try unconventional ideas, collaborate quickly, and learn from one another.",
    ],
    contributions: [
      "HackCMU (2026): helped run the event, mentored participant teams, and judged projects.",
      "CodeCrew (2023–2025): mentored K–12 students in programming and debugging, coached a winning team in 2024, and judged student projects in 2025.",
    ],
    results: [],
    links: [],
    images: [],
    position: { x: -170, y: 40 },
  },
];
