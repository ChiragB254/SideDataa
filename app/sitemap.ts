import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/services",
    ...services.map((s) => `/services/${s.slug}`),
    "/tools",
    "/tools/ai-savings-estimator",
    "/about",
    "/careers",
    "/contact",
    "/card",
    "/privacy",
    "/terms",
    "/accessibility",
  ];
  return paths.map((p) => ({
    url: `${site.url}${p === "/" ? "" : p}`,
    changeFrequency: "monthly",
    priority: p === "/" ? 1 : 0.7,
  }));
}
