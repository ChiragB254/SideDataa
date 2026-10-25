# Business cards, digital cards and share images

One list, `content/cards.ts`, drives everything: the printed cards, the digital pages, the vCards and the QR codes. The Open Graph (link preview) images share the same look.

## Add a person

1. Add an entry to `cards` in `content/cards.ts` (there is a commented example). Fields: `slug` (`[a-z0-9-]`, becomes the URL), `kind: "person"`, `name`, `title`, `email`, and optionally `phone` (display format) with `phoneDial` (digits for `tel:` links, e.g. `+14374313144`) and `linkedin`. Validation runs on import and in the unit tests.
2. Run `npm run cards:print`. This regenerates the QR codes (`content/generated/qr.ts`, committed) and the print files.
3. Commit the changes. The new page is `/card/<slug>`, its vCard is `/card/<slug>/contact.vcf`, and its share image is generated at build time.

Person pages are `noindex` and not in the sitemap: they are shared by link or QR code. The company card, `/card`, is indexed and in the sitemap.

## Regenerate the print files

```bash
npx playwright install chromium   # once
npm run cards:print               # all cards
npm run cards:print -- chirag-bansal   # one card
```

Output goes to `design/cards/<slug>/`:

| File                                           | What                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| `<slug>-print.pdf`                             | Send this to the printer. Colour, page 1 front, page 2 back.               |
| `<slug>-print-1colour.pdf`                     | Same layout, black only, for one-colour printing on unprinted stock.       |
| `<slug>-front.png`, `<slug>-back.png`          | 300 dpi previews, 1125 x 675 px, including bleed.                          |
| `<slug>-front-guides.png`, `...-back-guides.png` | Same, with the trim line (magenta, dashed) and the safe line (cyan, dashed). |

The files are small, so they are committed.

## Print specification

- Trim size: 3.5 x 2 in (88.9 x 50.8 mm).
- Bleed: 0.125 in (3.175 mm) on every side. PDF page size is 3.75 x 2.25 in (95.25 x 57.15 mm). The teal band on the back and the illustration on the front run into the bleed.
- Safe zone: all text and the QR symbol are at least 0.125 in (3.175 mm) inside the trim.
- Fonts are embedded (Source Serif 4, IBM Plex Sans), taken from `assets/fonts`. Smallest text is 7 pt.
- Colours: ink `#1B1F23`, accent `#2F5D62`, paper `#FAF9F6`. The PDFs are RGB. Printers convert RGB to CMYK, and the teal and the off-white can shift. Ask the printer for a proof before a full run.
- The PDF has no separate TrimBox or BleedBox entries. Printers normally work from the page size and the stated bleed. Tell them: "3.5 x 2 in with 0.125 in bleed".
- QR code: error correction Q, 4-module quiet zone, about 18.8 mm square symbol (24 mm with its quiet zone).
- Paper (suggestions, not requirements): a 14 pt or 16 pt (about 350 to 400 gsm) uncoated or lightly textured stock suits the off-white look. Avoid gloss and spot effects; the style is quiet.

## How the QR code and vCard work

- The QR code on each card encodes `https://sidedataa.com/card` (company) or `https://sidedataa.com/card/<slug>` (person). The origin is fixed in `content/cards.ts` (`cardOrigin`) on purpose: a printed code must not change with a staging build.
- The digital page shows the same QR code as inline SVG, with the URL as text beside it. No JavaScript is involved.
- `npm run cards:qr` writes `content/generated/qr.ts`. A unit test fails if that file is out of date, and another decodes every QR code (web and print) with jsQR to check it returns the exact URL.
- "Save contact" downloads `/card/<slug>/contact.vcf` (vCard 3.0, `text/vcard; charset=utf-8`, attachment). It carries name, organisation, title (people only), email, website, phone (only when the card has one) and a Toronto, Ontario, Canada address with no street.
- Share uses the Web Share API only where the browser has it; Copy link is always there.

## Share images (Open Graph)

`lib/og.tsx` draws every 1200 x 630 PNG. Headlines live next to each route: `app/opengraph-image.tsx` (home and any page without its own), `app/careers/opengraph-image.tsx`, `app/card/opengraph-image.tsx` and `app/card/[slug]/opengraph-image.tsx`. They are rendered at build time and served as static PNGs. Key content stays inside the central 1000 x 500 area because WhatsApp crops differently from LinkedIn.

LinkedIn and WhatsApp cache previews. After deploying, re-scrape the links: LinkedIn Post Inspector (linkedin.com/post-inspector) for each URL; WhatsApp needs a new URL (add `?v=2`) or a wait for its cache to expire.

## Where the placeholder logo lives

There is no real logo yet. The mark and wordmark are a placeholder in three places that mirror each other; change them together:

1. `components/Logo.tsx` (website and the digital card page).
2. `lib/brand-art.ts` (`logoMarkSvg`, `brand.wordmark`) for print cards and share images.
3. `public/logo-mark.svg` and `app/icon.svg` (favicon).

The layouts are wordmark-led, so a real logo can replace the mark and the wordmark without moving anything else.

## Owner checklist

- [ ] Confirm the mailbox `chirag.bansal@sidedataa.com` exists before printing.
- [ ] Confirm the phone format `+1 437 431 3144` (and the dialling form `+14374313144`).
- [ ] Replace the placeholder logo (see above), then run `npm run cards:print`.
- [ ] Add further people (names, titles) in `content/cards.ts`.
- [ ] Decide whether person pages should be indexed (they are `noindex` now), and whether to add a LinkedIn address.
- [ ] Order a printed proof and check colour, the QR code (scan it with two phones) and the trim.
- [ ] After deploying, re-scrape previews in LinkedIn Post Inspector and check a WhatsApp message.
