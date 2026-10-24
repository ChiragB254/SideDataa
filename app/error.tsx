"use client";

import { useEffect } from "react";
import { Container } from "@/components/Container";
import { site } from "@/lib/site";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] render error", error.digest ?? "");
  }, [error]);

  return (
    <section className="py-16 md:py-24">
      <Container>
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-6 max-w-[20ch] text-5xl leading-[1.1] md:text-6xl">
          This page could not be shown.
        </h1>
        <p role="alert" className="mt-8 max-w-xl text-lg text-ink-soft">
          An unexpected error occurred. You can try again, or email{" "}
          <a className="link" href={`mailto:${site.email}`}>
            {site.email}
          </a>{" "}
          if it keeps happening.
        </p>
        <button type="button" className="btn mt-8" onClick={() => reset()}>
          Try again
        </button>
      </Container>
    </section>
  );
}
