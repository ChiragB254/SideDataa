import type { roleSlugs } from "./slugs";

export type RoleSlug = (typeof roleSlugs)[number];

export type Role = {
  slug: RoleSlug;
  title: string;
  summary: string;
  youWillWorkOn: string[];
  youWillLearn: string[];
  goodFit: string[];
};

/*
 * TODO(owner): confirm each role description matches what you actually want
 * these interns to do. The page states that the internships are unpaid and run in
 * India; hours, duration and other terms are intentionally absent and are shared
 * with applicants. Descriptions avoid promising client projects, code review or
 * written feedback; add those back only if you will provide them.
 */
export const roles: Role[] = [
  {
    slug: "web-developer",
    title: "Web Developer",
    summary: "Build and maintain websites and web applications.",
    youWillWorkOn: [
      "Pages, components and forms in TypeScript, React and Next.js",
      "Accessibility fixes and performance improvements",
      "Small APIs and database queries behind the interface",
      "Automated tests and the build and deploy pipeline",
    ],
    youWillLearn: [
      "How a change goes from an idea to a reviewed, tested, deployed release",
      "Writing semantic, accessible HTML and maintainable CSS",
      "Reading and improving someone else's code",
      "Working with Git, pull requests and issue tracking",
    ],
    goodFit: [
      "You have built something with HTML, CSS and JavaScript or TypeScript, even a small project",
      "You like understanding why something works, not only getting it to work",
      "You can take written feedback and act on it",
    ],
  },
  {
    slug: "content-writer",
    title: "Content Writer",
    summary: "Write clear, accurate copy and documentation about technical work.",
    youWillWorkOn: [
      "Website copy, service descriptions and guides",
      "Technical articles written with engineers",
      "Documentation and handover notes",
      "Editing and fact-checking each other's work",
    ],
    youWillLearn: [
      "Turning technical detail into plain language without losing accuracy",
      "Interviewing engineers and checking claims against sources",
      "Structuring content for search and for people using assistive technology",
      "Working from an editorial style guide",
    ],
    goodFit: [
      "You write clearly and enjoy revising",
      "You are curious about how technology works and ask questions until it makes sense",
      "You are careful with facts and say when you are not sure",
    ],
  },
  {
    slug: "ui-ux-graphic-designer",
    title: "UI/UX and Graphic Designer",
    summary:
      "Design interfaces, diagrams and brand assets that are clear and accessible.",
    youWillWorkOn: [
      "Page layouts, components and design tokens",
      "Flows and prototypes for web applications",
      "Diagrams that explain systems and processes",
      "Graphics and brand assets for the website and documents",
    ],
    youWillLearn: [
      "Designing for contrast, focus states, text size and keyboard use from the start",
      "Handing over designs that developers can build exactly",
      "Testing a design with real people and acting on what you see",
      "Making a consistent visual system with a small set of choices",
    ],
    goodFit: [
      "You can show some design work, even personal or coursework projects",
      "You can explain the reasons behind a design decision",
      "You are comfortable with a design tool such as Figma",
    ],
  },
];

export function getRole(slug: string): Role | undefined {
  return roles.find((r) => r.slug === slug);
}
