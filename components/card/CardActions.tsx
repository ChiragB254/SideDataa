"use client";

import { useRef, useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const canShareNow = () => typeof navigator !== "undefined" && "share" in navigator;

const buttonClass =
  "btn btn-quiet min-h-11 w-full motion-safe:transition-colors motion-safe:duration-150";

/**
 * Copy link (always) and Share (only where the Web Share API exists).
 * Share is progressive enhancement: it is not rendered on the server or without support.
 */
export function CardActions({ url, title }: { url: string; title: string }) {
  const canShare = useSyncExternalStore(subscribe, canShareNow, () => false);
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const say = (text: string) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 5000);
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      say("Link copied.");
    } catch {
      say("Could not copy automatically. Select the link shown below and copy it.");
    }
  }

  async function share() {
    try {
      await navigator.share({ title, url });
    } catch (error) {
      // Closing the share sheet is not an error.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        say("Sharing did not work. Use Copy link instead.");
      }
    }
  }

  return (
    <div>
      <div
        className={`grid grid-cols-1 gap-3 ${canShare ? "min-[360px]:grid-cols-2" : ""}`}
      >
        <button type="button" className={buttonClass} onClick={copy}>
          Copy link
        </button>
        {canShare ? (
          <button type="button" className={buttonClass} onClick={share}>
            Share
          </button>
        ) : null}
      </div>
      <p role="status" className="mt-2 min-h-6 text-sm text-ink-soft">
        {message}
      </p>
    </div>
  );
}
