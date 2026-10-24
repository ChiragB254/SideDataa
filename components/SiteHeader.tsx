"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { nav } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Escape closes and returns focus to the button; focus leaving the header closes it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      const header = buttonRef.current?.closest("header");
      if (header && e.target instanceof Node && !header.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [open]);

  const isCurrent = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="relative border-b border-rule bg-paper">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <Link href="/" className="-ml-1 inline-flex min-h-11 items-center px-1">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  className="inline-flex min-h-11 items-center px-3 text-[0.9375rem] underline-offset-[0.35em] hover:underline aria-[current=page]:underline aria-[current=page]:decoration-accent aria-[current=page]:decoration-2"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          ref={buttonRef}
          type="button"
          className="-mr-2 inline-flex min-h-11 min-w-11 items-center gap-2 px-2 text-[0.9375rem] font-medium md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span>{open ? "Close" : "Menu"}</span>
          <svg
            viewBox="0 0 20 20"
            className="h-5 w-5"
            aria-hidden="true"
            focusable="false"
          >
            {open ? (
              <path
                d="M4 4l12 12M16 4 4 16"
                stroke="currentColor"
                strokeWidth="1.75"
                fill="none"
              />
            ) : (
              <path
                d="M3 6h14M3 10h14M3 14h14"
                stroke="currentColor"
                strokeWidth="1.75"
                fill="none"
              />
            )}
          </svg>
        </button>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="absolute inset-x-0 top-full z-20 border-b border-rule bg-paper md:hidden"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-6xl px-5 pb-4 sm:px-8">
          <ul>
            {nav.map((item) => (
              <li key={item.href} className="border-t border-rule first:border-t-0">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  className="flex min-h-12 items-center font-serif text-xl aria-[current=page]:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
