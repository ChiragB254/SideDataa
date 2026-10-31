import { expect, test, type Page } from "@playwright/test";

const meta = (page: Page, attr: "property" | "name", key: string) =>
  page.locator(`meta[${attr}="${key}"]`).first().getAttribute("content");

for (const route of ["/", "/careers", "/card", "/about", "/card/chirag-bansal"]) {
  test(`share metadata and a real 1200x630 PNG: ${route}`, async ({ page, request }) => {
    await page.goto(route);
    for (const key of [
      "og:title",
      "og:description",
      "og:url",
      "og:image",
      "og:image:alt",
    ]) {
      expect(await meta(page, "property", key), key).toBeTruthy();
    }
    expect(await meta(page, "property", "og:type")).toBe("website");
    expect(await meta(page, "property", "og:image:width")).toBe("1200");
    expect(await meta(page, "property", "og:image:height")).toBe("630");
    expect(await meta(page, "name", "twitter:card")).toBe("summary_large_image");
    expect(await meta(page, "name", "twitter:title")).toBeTruthy();
    expect(await meta(page, "name", "twitter:image")).toBeTruthy();

    const image = await meta(page, "property", "og:image");
    expect(image).toMatch(/^https:\/\/sidedataa\.com\//);
    // The test server is local: request the same path on it.
    const res = await request.get(new URL(image!).pathname + new URL(image!).search);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    expect(res.headers()["cache-control"]).toBeTruthy();
    const body = await res.body();
    expect(body.subarray(1, 4).toString()).toBe("PNG");
    expect(body.readUInt32BE(16)).toBe(1200);
    expect(body.readUInt32BE(20)).toBe(630);
    expect(body.length).toBeGreaterThan(5_000);
  });
}

test("home, careers and card have different share images", async ({ page }) => {
  const urls = new Set<string>();
  for (const route of ["/", "/careers", "/card"]) {
    await page.goto(route);
    urls.add((await meta(page, "property", "og:image"))!);
  }
  expect(urls.size).toBe(3);
});

test("person card is noindex and not in the sitemap; company card is indexable", async ({
  page,
  request,
}) => {
  await page.goto("/card/chirag-bansal");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.goto("/card");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://sidedataa.com/card",
  );
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("https://sidedataa.com/card<");
  expect(xml).not.toContain("/card/chirag-bansal");
  expect(xml).not.toContain("/card/sidedata");
});

test("vCard downloads with the right headers and content", async ({ request }) => {
  for (const [slug, hasTel] of [
    ["sidedata", false],
    ["chirag-bansal", true],
  ] as const) {
    const res = await request.get(`/card/${slug}/contact.vcf`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("text/vcard; charset=utf-8");
    expect(res.headers()["content-disposition"]).toBe(
      `attachment; filename="${slug}.vcf"`,
    );
    const text = await res.text();
    expect(text.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(/^TEL/m.test(text)).toBe(hasTel);
  }
});

test("unknown card slug is a 404", async ({ request }) => {
  expect((await request.get("/card/nobody")).status()).toBe(404);
  expect((await request.get("/card/nobody/contact.vcf")).status()).toBe(404);
});
