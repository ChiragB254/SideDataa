import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { brand, heroArtSvg, logoMarkSvg, svgDataUri } from "@/lib/brand-art";
import { site } from "@/lib/site";

/*
 * Open Graph / Twitter share images, one system for every page.
 * 1200x630 PNG (1.91:1, the ratio LinkedIn and WhatsApp use). Everything that matters
 * sits inside the central 1000x500 area (100px side, 65px top/bottom margins) because
 * WhatsApp and some feeds crop the edges. Fonts are the site's own families, read from
 * assets/fonts (no network). These routes are prerendered at build time.
 */
export const ogSize = { width: 1200, height: 630 } as const;
export const ogContentType = "image/png";

async function font(file: string) {
  return readFile(join(process.cwd(), "assets/fonts", file));
}

export type OgInput = {
  /** The one-line message. Keep it under about 60 characters. */
  headline: string;
  /** Optional teal line under the headline. */
  sub?: string;
};

export async function renderOgImage({ headline, sub }: OgInput) {
  const [serif, plex, plexMedium, plexSemi] = await Promise.all([
    font("SourceSerif4-Medium.woff"),
    font("IBMPlexSans-Regular.woff"),
    font("IBMPlexSans-Medium.woff"),
    font("IBMPlexSans-SemiBold.woff"),
  ]);
  const size = headline.length > 44 ? 62 : 70;
  const mark = svgDataUri(logoMarkSvg());
  const art = svgDataUri(heroArtSvg({ strokeWidth: 2.6 }));

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: brand.paper,
        color: brand.ink,
        padding: "65px 100px",
        fontFamily: "IBM Plex Sans",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mark} width={52} height={52} alt="" />
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginLeft: 18,
            fontFamily: "Source Serif 4",
            fontSize: 42,
          }}
        >
          {brand.wordmark.primary}
          <span
            style={{
              marginLeft: 12,
              fontFamily: "IBM Plex Sans",
              fontWeight: 600,
              fontSize: 17,
              letterSpacing: 2.4,
              textTransform: "uppercase",
              color: brand.muted,
            }}
          >
            {brand.wordmark.secondary}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 610 }}>
          <div
            style={{
              fontFamily: "Source Serif 4",
              fontSize: size,
              lineHeight: 1.1,
              letterSpacing: -1,
            }}
          >
            {headline}
          </div>
          {sub ? (
            <div
              style={{
                marginTop: 26,
                fontSize: 31,
                fontWeight: 500,
                color: brand.accent,
              }}
            >
              {sub}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", flex: 1, justifyContent: "flex-end" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={art} width={370} height={291} alt="" />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: `2px solid ${brand.rule}`,
          paddingTop: 20,
          fontSize: 28,
          fontWeight: 500,
          color: brand.inkSoft,
        }}
      >
        <span>sidedataa.com</span>
        <span style={{ fontWeight: 400 }}>{site.locationLabel}</span>
      </div>
    </div>,
    {
      ...ogSize,
      fonts: [
        { name: "Source Serif 4", data: serif, weight: 500, style: "normal" },
        { name: "IBM Plex Sans", data: plex, weight: 400, style: "normal" },
        { name: "IBM Plex Sans", data: plexMedium, weight: 500, style: "normal" },
        { name: "IBM Plex Sans", data: plexSemi, weight: 600, style: "normal" },
      ],
      headers: {
        // Static asset content: let browsers and CDNs reuse it, revalidate on deploy.
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    },
  );
}
