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
    "SideData Technologies is an IT company in Toronto, Ontario. We build AI systems, websites and web applications, and we manage servers, cloud environments and everyday IT.",
} as const;

export const nav = [
  { href: "/services", label: "Services" },
  { href: "/tools", label: "Tools" },
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
] as const;
