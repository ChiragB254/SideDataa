export const site = {
  name: "SideData Technologies",
  shortName: "SideData",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://sidedataa.com",
  email: "support@sidedataa.com",
  locality: "Toronto",
  region: "Ontario",
  country: "Canada",
  locationLabel: "Toronto, Ontario, Canada",
  description:
    "SideData Technologies is an IT company in Toronto, Ontario. We build AI systems and web applications, and manage servers, cloud and everyday IT.",
  /** Raster logo (512x512 render of public/logo-mark.svg); Google wants a logo of at least 112x112 px. */
  logoPath: "/logo.png",
} as const;

export type NavItem = { href: string; label: string };

const baseNav: readonly NavItem[] = [
  { href: "/services", label: "Services" },
  { href: "/tools", label: "Tools" },
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

/**
 * Primary navigation. "Blog" appears only once at least one post is published
 * (decided at build time by the caller), so the site never links to an empty blog.
 */
export function getNav(hasPublishedPosts: boolean): readonly NavItem[] {
  if (!hasPublishedPosts) return baseNav;
  const items = [...baseNav];
  items.splice(2, 0, { href: "/blog", label: "Blog" });
  return items;
}
