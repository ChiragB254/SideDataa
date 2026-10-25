import { cards, getCard } from "@/content/cards";
import { ogContentType, ogSize, renderOgImage } from "@/lib/og";
import { site } from "@/lib/site";

export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return cards.map((c) => ({ slug: c.slug }));
}

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const card = getCard((await params).slug);
  const alt = card
    ? card.kind === "person"
      ? `${card.name}, ${card.title}, ${site.name}: digital card`
      : "SideData Technologies: digital card"
    : site.name;
  return [{ id: "card", size: ogSize, contentType: ogContentType, alt }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const card = getCard((await params).slug);
  if (!card || card.kind === "company") {
    return renderOgImage({
      headline: "SideData Technologies: digital card",
      sub: "support@sidedataa.com",
    });
  }
  return renderOgImage({
    headline: card.name,
    sub: `${card.title}, ${site.name}`,
  });
}
