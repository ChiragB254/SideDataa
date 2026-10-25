import { cards, getCard } from "@/content/cards";
import { buildVCard } from "@/lib/vcard";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return cards.map((c) => ({ slug: c.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const card = getCard((await params).slug);
  if (!card) return new Response("Not found", { status: 404 });
  return new Response(buildVCard(card), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${card.slug}.vcf"`,
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
