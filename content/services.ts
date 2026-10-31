import type { serviceSlugs } from "./slugs";

export type ServiceSlug = (typeof serviceSlugs)[number];

export type Service = {
  slug: ServiceSlug;
  title: string;
  /** Shorter page title for <title> and share cards when `title` is too long for search results. */
  metaTitle?: string;
  /** One line used in lists and metadata. */
  summary: string;
  /** Opening paragraph(s) of the service page. */
  intro: string[];
  whatWeDo: { title: string; body: string }[];
  engagements: string[];
  process: { title: string; body: string }[];
  tech: string[];
};

/*
 * Copy describes the kind of work we do and how we work. It deliberately
 * contains no client names, counts, results or certifications.
 * TODO(owner): review every "typical engagement" and every tech list, and remove anything you do
 * not want to offer yet.
 */
export const services: Service[] = [
  {
    slug: "ai-development",
    title: "AI development",
    summary:
      "Language-model applications, retrieval over your own documents, and automation of repetitive work.",
    intro: [
      "We build software that uses language models and other machine learning where it earns its place, and we say so plainly when it does not. Most of our AI work is ordinary software engineering around a model: clean data in, checked answers out, and a way to see when something goes wrong.",
      "That includes retrieval-augmented generation (RAG), where a model answers from your own documents and cites what it used, assistants that sit inside an existing tool, and automation that takes over a repetitive, rule-heavy task.",
    ],
    whatWeDo: [
      {
        title: "Retrieval-augmented generation (RAG)",
        body: "Question answering over policies, manuals, tickets or knowledge bases. We handle ingestion, chunking, embeddings, search, and answers that point back to their sources.",
      },
      {
        title: "LLM applications",
        body: "Assistants, summarisation, classification and drafting features built into your product or internal tools, with prompts, guardrails and logging that can be inspected.",
      },
      {
        title: "Workflow automation",
        body: "Reading incoming email or documents, extracting fields, routing work, and updating the systems you already use, with a person approving the steps that matter.",
      },
      {
        title: "Evaluation and monitoring",
        body: "Test sets for the questions your users actually ask, so changes to a prompt or model can be compared before they ship.",
      },
    ],
    engagements: [
      "A search-and-answer tool over an internal document library",
      "A drafting or summarising feature added to an existing web application",
      "Automating intake: forms, emails or PDFs into structured records",
      "A review of an existing prototype: what works, what is risky, what to change",
    ],
    process: [
      {
        title: "Define the task",
        body: "We write down what a good answer looks like and collect real examples before choosing any model.",
      },
      {
        title: "Prototype against real data",
        body: "A small working version, evaluated on your examples, so you can judge quality early.",
      },
      {
        title: "Build for production",
        body: "Authentication, access control, logging, cost limits and error handling around the model.",
      },
      {
        title: "Hand over",
        body: "Documentation, the evaluation set and a walkthrough so your team can keep improving it.",
      },
    ],
    tech: [
      "Python",
      "TypeScript",
      "PostgreSQL with pgvector",
      "FastAPI",
      "Hosted and self-hosted models",
      "Docker",
    ],
  },
  {
    slug: "web-development",
    title: "Website and web application development",
    metaTitle: "Website and web app development",
    summary:
      "Marketing sites, customer portals and internal tools that are fast, accessible and maintainable.",
    intro: [
      "We build websites and web applications from design through to deployment. The aim is a product that loads quickly, works with a keyboard and a screen reader, and that someone else can pick up and maintain in two years.",
      "We write TypeScript, keep the content separate from the code where it makes sense, and document how to run and deploy what we hand over.",
    ],
    whatWeDo: [
      {
        title: "Websites",
        body: "Company and product sites with clear structure, search-friendly markup and content you can edit without a developer.",
      },
      {
        title: "Web applications",
        body: "Portals, dashboards and internal tools with authentication, roles, forms and a database behind them.",
      },
      {
        title: "APIs and integrations",
        body: "Connecting your site or app to payment, email, CRM and other systems you already depend on.",
      },
      {
        title: "Accessibility and performance work",
        body: "Audits and fixes against WCAG 2.2 AA and Core Web Vitals for existing sites.",
      },
    ],
    engagements: [
      "A new company website, built and deployed",
      "A customer or staff portal replacing spreadsheets and email",
      "Rebuilding an ageing site on a modern stack",
      "An accessibility and performance review with a written list of fixes",
    ],
    process: [
      {
        title: "Content and structure first",
        body: "We agree the pages, the words and the flows before visual design starts.",
      },
      {
        title: "Design and build together",
        body: "Working pages are shown early, so feedback lands on the real thing.",
      },
      {
        title: "Test",
        body: "Automated checks, keyboard and screen-reader passes, and testing on real phones.",
      },
      {
        title: "Launch and hand over",
        body: "Deployment, monitoring basics, and documentation for whoever maintains it next.",
      },
    ],
    tech: [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "PostgreSQL",
      "Tailwind CSS",
      "Vercel",
    ],
  },
  {
    slug: "server-management",
    title: "Server management",
    summary:
      "Setting up, patching, monitoring and backing up Linux and Windows servers so they stay up.",
    intro: [
      "We look after servers so that your team does not have to think about them. That means a documented setup, regular patching, monitoring and alerting, and backups that are tested by restoring them.",
      "We work on Linux first and can support Windows Server where it is already in use.",
    ],
    whatWeDo: [
      {
        title: "Build and configuration",
        body: "New servers set up from scripts or configuration management, so the next one is identical and the setup is written down.",
      },
      {
        title: "Patching and updates",
        body: "A regular, announced schedule for operating system and application updates, with a rollback plan.",
      },
      {
        title: "Monitoring and alerting",
        body: "Disk, memory, services, certificates and uptime checks, with alerting configured to suit your setup.",
      },
      {
        title: "Backup and recovery",
        body: "Automated backups, off-site copies, and restore tests to check the backups work.",
      },
      {
        title: "Hardening",
        body: "Key-based access, least-privilege accounts, firewall rules and disabling what is not needed.",
      },
    ],
    engagements: [
      "Taking over a server that nobody on your team wants to touch",
      "Ongoing patching and monitoring for a small fleet",
      "Moving an application from an old server to a new one",
      "A health check with a written report of risks, ordered by priority",
    ],
    process: [
      {
        title: "Inventory",
        body: "What is running, where, who depends on it, and what happens if it stops.",
      },
      {
        title: "Stabilise",
        body: "Fix the urgent risks first: backups, access, unsupported software.",
      },
      {
        title: "Automate",
        body: "Turn manual steps into scripts so work is repeatable and reviewable.",
      },
      {
        title: "Run and report",
        body: "Regular maintenance with a plain summary of what changed and what needs a decision.",
      },
    ],
    tech: [
      "Linux (Debian, Ubuntu, RHEL family)",
      "Windows Server",
      "nginx",
      "Docker",
      "Ansible",
      "Prometheus and Grafana",
      "systemd",
    ],
  },
  {
    slug: "cloud-services",
    title: "Cloud services",
    summary:
      "Designing, migrating and running workloads on AWS, Google Cloud and Microsoft Azure.",
    intro: [
      "We help you choose where things should run, move them there carefully, and keep the monthly bill understandable. We work with AWS, Google Cloud and Microsoft Azure, and we will tell you when a simpler option is enough.",
      "Infrastructure is defined in code, so changes are reviewed, repeatable and easy to undo.",
    ],
    whatWeDo: [
      {
        title: "Architecture and planning",
        body: "A written design covering networking, access, data, backups and cost before anything is built.",
      },
      {
        title: "Migration",
        body: "Moving applications and data from on-premises servers or another provider, with a cut-over plan and a way back.",
      },
      {
        title: "Infrastructure as code",
        body: "Environments described in Terraform, kept in version control and applied through review.",
      },
      {
        title: "Cost and security review",
        body: "Finding unused resources, over-sized services, open ports and over-broad permissions.",
      },
      {
        title: "Deployment pipelines",
        body: "Automated builds, tests and releases so shipping a change is routine.",
      },
    ],
    engagements: [
      "Moving a line-of-business application to the cloud",
      "Setting up development, staging and production environments properly",
      "A review of an existing cloud account for cost and security",
      "Building a CI/CD pipeline for an existing application",
    ],
    process: [
      {
        title: "Assess",
        body: "Understand the workload, its dependencies, data location requirements and budget.",
      },
      {
        title: "Design",
        body: "Agree the target architecture and the migration steps in writing.",
      },
      {
        title: "Build and migrate",
        body: "Create the environment in code, move in stages, and test each stage.",
      },
      {
        title: "Operate",
        body: "Monitoring, patching, backups and a regular look at the bill.",
      },
    ],
    tech: [
      "AWS",
      "Google Cloud",
      "Microsoft Azure",
      "Terraform",
      "Docker",
      "GitHub Actions",
      "PostgreSQL",
    ],
  },
  {
    slug: "it-services",
    title: "IT services and support",
    summary:
      "Day-to-day IT help, networking, security hygiene and migrations for small and mid-sized organisations.",
    intro: [
      "Not every problem needs custom software. We provide general IT support and project work: getting accounts, devices, networks and email into good order and keeping them that way.",
      "Our focus on security is practical. Multi-factor authentication, sensible permissions, patching and backups prevent most of the avoidable trouble.",
    ],
    whatWeDo: [
      {
        title: "Managed IT and support",
        body: "Help with everyday questions, requests and problems, with the agreed arrangements written down.",
      },
      {
        title: "Networking",
        body: "Office networks, Wi-Fi, VPN and firewall setup and troubleshooting.",
      },
      {
        title: "Security hygiene",
        body: "Multi-factor authentication, password manager rollout, device encryption, least-privilege access and staff guidance.",
      },
      {
        title: "Migrations",
        body: "Email and file storage moves, for example to Microsoft 365 or Google Workspace, and moves between servers or providers.",
      },
      {
        title: "Backup and continuity",
        body: "Knowing what is backed up, where, and how fast you could recover if something failed.",
      },
    ],
    engagements: [
      "An IT health check for a small office, with a prioritised list of fixes",
      "Moving email and files to a new platform with minimal disruption",
      "Setting up a secure remote-work arrangement",
      "Ongoing support for a team without an in-house IT person",
    ],
    process: [
      {
        title: "Review",
        body: "A walk through accounts, devices, network and backups to see what exists today.",
      },
      {
        title: "Prioritise",
        body: "A short written list of what to fix, ordered by risk and effort.",
      },
      {
        title: "Fix and migrate",
        body: "Changes made in planned windows, with notice to the people affected.",
      },
      {
        title: "Support",
        body: "Ongoing help, and a record of what was changed and why.",
      },
    ],
    tech: [
      "Microsoft 365",
      "Google Workspace",
      "Single sign-on (Entra ID, Google)",
      "WireGuard and OpenVPN",
      "Firewalls and routers",
      "Linux and Windows",
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
