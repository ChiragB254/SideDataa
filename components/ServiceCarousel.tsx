"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { services } from "@/content/services";
import { ServiceIllustration } from "./illustrations/ServiceIllustrations";

/*
 * Hand-written carousel. No autoplay. Horizontal scroll-snap gives touch
 * swipe; the buttons give the same movement without dragging (WCAG 2.5.7).
 * Only the active slide is reachable by keyboard and screen readers: the
 * others are `inert`. That attribute is applied after hydration so that
 * without JavaScript every slide stays usable by scrolling and Tab.
 */
const total = services.length;

function firstSentence(text: string) {
  const end = text.indexOf(". ");
  return end === -1 ? text : text.slice(0, end + 1);
}

export function ServiceCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [active, setActive] = useState(0);
  // false during server render and hydration, true afterwards.
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = (index + total) % total;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setActive(next);
    track.scrollTo({
      left: next * track.clientWidth,
      behavior: reduce ? "auto" : "smooth",
    });
  }, []);

  // Keep `active` in step with swipes and native scrolling.
  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const track = trackRef.current;
      if (!track || !track.clientWidth) return;
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      setActive((cur) => (idx >= 0 && idx < total && idx !== cur ? idx : cur));
    });
  };

  // Stay on the same slide when the width changes (rotation, resize, zoom).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let width = track.clientWidth;
    const ro = new ResizeObserver(() => {
      if (track.clientWidth !== width) {
        width = track.clientWidth;
        track.scrollTo({ left: active * width, behavior: "auto" });
      }
    });
    ro.observe(track);
    return () => ro.disconnect();
  }, [active]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <section role="region" aria-roledescription="carousel" aria-label="What we build">
      <div
        ref={trackRef}
        onScroll={onScroll}
        aria-live="polite"
        className="carousel-track art-panel bg-dots"
      >
        {services.map((s, i) => (
          <div
            key={s.slug}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${total}`}
            inert={ready && i !== active}
            className="carousel-slide grid items-center gap-6 p-5 sm:p-8 md:grid-cols-2 md:gap-10 md:p-10"
          >
            <div className="bg-paper p-4 md:p-6">
              <ServiceIllustration slug={s.slug} />
            </div>
            <div>
              <p className="font-serif text-sm text-muted tabular-nums">
                {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </p>
              <h3 className="mt-1 text-2xl leading-snug md:text-3xl">{s.title}</h3>
              <p className="mt-3 text-ink-soft">
                {s.summary} {firstSentence(s.intro[0] ?? "")}
              </p>
              <p className="mt-4">
                <Link
                  href={`/services/${s.slug}`}
                  className="link inline-flex min-h-11 items-center font-medium"
                >
                  Read about {s.title}
                </Link>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1" role="group" aria-label="Choose a slide">
          {services.map((s, i) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show slide ${i + 1} of ${total}: ${s.title}`}
              aria-current={i === active ? "true" : undefined}
              className="group inline-flex h-11 w-11 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={`block h-3.5 w-3.5 rounded-full border-2 transition-colors duration-150 ${
                  i === active
                    ? "border-accent bg-accent"
                    : "border-muted bg-transparent group-hover:bg-muted"
                }`}
              />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="icon-btn"
            onClick={() => goTo(active - 1)}
            aria-label="Previous slide"
          >
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M13.5 8H2.5M7 3.5 2.5 8 7 12.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => goTo(active + 1)}
            aria-label="Next slide"
          >
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M2.5 8h11M9 3.5 13.5 8 9 12.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
