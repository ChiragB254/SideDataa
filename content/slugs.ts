/** Small, dependency-free lists shared by forms, schemas and content. */
export const serviceOptions = [
  { slug: "ai-development", label: "AI development" },
  { slug: "web-development", label: "Website and web application development" },
  { slug: "server-management", label: "Server management" },
  { slug: "cloud-services", label: "Cloud services" },
  { slug: "it-services", label: "IT services and support" },
] as const;

export const serviceSlugs = [
  "ai-development",
  "web-development",
  "server-management",
  "cloud-services",
  "it-services",
] as const;

export const roleOptions = [
  { slug: "web-developer", label: "Web Developer" },
  { slug: "content-writer", label: "Content Writer" },
  { slug: "ui-ux-graphic-designer", label: "UI/UX and Graphic Designer" },
] as const;

export const roleSlugs = [
  "web-developer",
  "content-writer",
  "ui-ux-graphic-designer",
] as const;
