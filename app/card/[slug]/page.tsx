import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DigitalCard } from "@/components/card/DigitalCard";
import { cardPath, cards, getCard } from "@/content/cards";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return cards.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const card = getCard((await params).slug);
  if (!card) return {};
  if (card.kind === "company") {
    // Same page as /card; the canonical link keeps /card as the one address.
    return pageMetadata({
      title: "Digital card",
      description: `${site.name} digital card: email, website and location.`,
      path: "/card",
      ownImage: true,
    });
  }
  // Person pages are shared by link or QR code, not found through search.
  return pageMetadata({
    title: `${card.name}, digital card`,
    description: `${card.name}, ${card.title} at ${site.name}. Contact details and a button to save them to your phone.`,
    path: cardPath(card),
    noindex: true,
    ownImage: true,
  });
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const card = getCard((await params).slug);
  if (!card) notFound();
  return <DigitalCard card={card} />;
}
