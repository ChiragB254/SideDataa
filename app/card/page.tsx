import { DigitalCard } from "@/components/card/DigitalCard";
import { getCard } from "@/content/cards";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Digital card",
  description:
    "SideData Technologies digital card: email, website and location in Toronto, Ontario, Canada, with a button to save the contact to your phone.",
  path: "/card",
  ownImage: true,
});

export default function CompanyCardPage() {
  const card = getCard("sidedata");
  if (!card)
    throw new Error('The company card "sidedata" is missing from content/cards.ts');
  return <DigitalCard card={card} />;
}
