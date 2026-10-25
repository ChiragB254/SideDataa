import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Container } from "@/components/Container";
import { CardActions } from "./CardActions";
import { QrCode } from "./QrCode";
import { cardTagline, cardUrl, vcardPath, type Card } from "@/content/cards";
import { site } from "@/lib/site";

const tile =
  "flex min-h-14 flex-col justify-center border-t border-rule px-1 py-3 text-ink motion-safe:transition-colors motion-safe:duration-150 hover:bg-wash";

function Tile({
  label,
  href,
  children,
}: {
  label: string;
  href?: string;
  children: ReactNode;
}) {
  const inner = (
    <>
      <span className="text-sm text-muted">{label}</span>
      <span className="font-medium [overflow-wrap:anywhere]">{children}</span>
    </>
  );
  return (
    <li>
      {href ? (
        <a href={href} className={`${tile} underline-offset-4 hover:underline`}>
          {inner}
        </a>
      ) : (
        <div className={`${tile} hover:bg-transparent`}>{inner}</div>
      )}
    </li>
  );
}

/**
 * One digital business card. Single column, usable from 320px. The logo is the shared
 * placeholder in components/Logo.tsx; swap it there.
 */
export function DigitalCard({ card }: { card: Card }) {
  const url = cardUrl(card);
  const isPerson = card.kind === "person";
  return (
    <section className="py-10 md:py-16">
      <Container>
        <article
          aria-labelledby="card-name"
          className="mx-auto w-full max-w-md border border-rule bg-white p-6 sm:p-8"
        >
          <Logo />
          <p className="eyebrow mt-8">Digital card</p>
          <h1 id="card-name" className="mt-3 text-4xl leading-[1.1]">
            {card.name}
          </h1>
          {isPerson ? (
            <p className="mt-2 text-lg text-ink-soft">
              {card.title}, {site.name}
            </p>
          ) : null}
          <p className="mt-3 text-ink-soft">{cardTagline}</p>

          <ul className="mt-8 border-b border-rule">
            <Tile label="Email" href={`mailto:${card.email}`}>
              {card.email}
            </Tile>
            {card.phone ? (
              <Tile label="Phone" href={`tel:${card.phoneDial}`}>
                {card.phone}
              </Tile>
            ) : null}
            <Tile label="Website" href={site.url}>
              sidedataa.com
            </Tile>
            {card.linkedin ? (
              <Tile label="LinkedIn" href={card.linkedin}>
                {card.linkedin.replace(/^https:\/\/(www\.)?/, "")}
              </Tile>
            ) : null}
            <Tile label="Location">{site.locationLabel}</Tile>
          </ul>

          <p className="mt-8">
            <a
              href={vcardPath(card)}
              download={`${card.slug}.vcf`}
              className="btn w-full motion-safe:transition-colors motion-safe:duration-150"
            >
              Save contact
            </a>
          </p>
          <div className="mt-3">
            <CardActions
              url={url}
              title={isPerson ? `${card.name}, ${site.name}` : site.name}
            />
          </div>

          <div className="mt-6 flex items-center gap-5 border-t border-rule pt-6">
            <QrCode slug={card.slug} className="h-28 w-28 shrink-0 border border-rule" />
            <div className="min-w-0">
              <p className="text-sm text-muted">Scan to open this card</p>
              <p className="mt-1 font-medium [overflow-wrap:anywhere] text-ink">
                {url.split("/").map((part, i, all) => (
                  <span key={i}>
                    {part}
                    {i < all.length - 1 ? "/" : ""}
                    <wbr />
                  </span>
                ))}
              </p>
            </div>
          </div>
        </article>
      </Container>
    </section>
  );
}
