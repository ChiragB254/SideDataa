import Link from "next/link";
import { Row, RowTitle } from "./Container";
import { site } from "@/lib/site";

export function CtaBand({
  title = "Tell us what you are trying to get done.",
  body = "A short message is enough. Describe the situation and what you would like to happen.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <Row id="cta" label="Contact" heading={<RowTitle id="cta">{title}</RowTitle>}>
      <p className="measure text-ink-soft">{body}</p>
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
        <Link href="/contact" className="btn">
          Contact us
        </Link>
        <a className="link" href={`mailto:${site.email}`}>
          {site.email}
        </a>
      </div>
    </Row>
  );
}
