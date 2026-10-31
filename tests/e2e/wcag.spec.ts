import { expect, test, type Page } from "@playwright/test";
import { tinyPdf } from "../fixtures/files";
import { RESUME_ACCEPT, RESUME_HINT, resumeMessages } from "../../lib/resume";

const routes = [
  "/",
  "/services",
  "/services/ai-development",
  "/services/web-development",
  "/services/server-management",
  "/services/cloud-services",
  "/services/it-services",
  "/tools",
  "/tools/ai-savings-estimator",
  "/about",
  "/about/editorial-policy",
  "/authors/chirag-bansal",
  "/blog",
  "/careers",
  "/contact",
  "/card",
  "/card/sidedata",
  "/card/chirag-bansal",
  "/privacy",
  "/terms",
  "/accessibility",
  "/form-status?form=contact&result=sent",
  "/this-page-does-not-exist",
];

const carousel = (page: Page) => page.locator('[aria-roledescription="carousel"]');
const track = (page: Page) => carousel(page).locator(".carousel-track");
const activeIndex = (page: Page) =>
  page
    .locator('[aria-label^="Choose a slide"] button[aria-current="true"]')
    .getAttribute("aria-label");
const status = (page: Page) => carousel(page).locator("p[aria-live]");
const frames = (page: Page, n = 2) =>
  page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        const tick = (left: number) =>
          left === 0 ? resolve() : requestAnimationFrame(() => tick(left - 1));
        tick(count);
      }),
    n,
  );
/** Wait until the track has finished moving to slide `i`. */
const settled = (page: Page, i: number) =>
  expect
    .poll(() =>
      track(page).evaluate(
        (el, idx) => Math.abs(el.scrollLeft - idx * el.clientWidth),
        i,
      ),
    )
    .toBeLessThan(2);

test.describe("carousel", () => {
  test("keyboard operation, inert off-screen slides, picker names", async ({ page }) => {
    await page.goto("/");
    const c = carousel(page);
    await expect(c).toHaveAttribute("aria-label", "What we build");
    const slides = c.locator('[aria-roledescription="slide"]');
    await expect(slides).toHaveCount(5);
    await expect(slides.nth(0)).toHaveAttribute("aria-label", "1 of 5");
    // Only the first slide is reachable.
    await expect(c.getByRole("button", { name: "Next slide" })).toBeVisible();
    await expect(slides.nth(0)).not.toHaveAttribute("inert", /.*/);
    for (let i = 1; i < 5; i++) await expect(slides.nth(i)).toHaveAttribute("inert", "");
    await expect(c.locator(".carousel-slide:not([inert]) a")).toHaveCount(1);

    const next = c.getByRole("button", { name: "Next slide" });
    await next.focus();
    await page.keyboard.press("Enter");
    await settled(page, 1);
    await expect(slides.nth(1)).not.toHaveAttribute("inert", /.*/);
    await expect(slides.nth(0)).toHaveAttribute("inert", "");
    await page.keyboard.press("Space");
    await settled(page, 2);
    await expect(slides.nth(2)).not.toHaveAttribute("inert", /.*/);

    const picker = c.getByRole("button", {
      name: "Show slide 5 of 5: IT services and support",
    });
    await picker.focus();
    await page.keyboard.press("Enter");
    await settled(page, 4);
    await expect(picker).toHaveAttribute("aria-current", "true");
    await expect(slides.nth(4)).not.toHaveAttribute("inert", /.*/);
    await expect(status(page)).toHaveText("Slide 5 of 5: IT services and support");

    // Tab order: slide link, slide pickers, previous, next. Never lands in a hidden slide.
    await c.locator(".carousel-slide:not([inert]) a").focus();
    await page.keyboard.press("Tab");
    await expect(c.getByRole("button", { name: /^Show slide 1 of 5/ })).toBeFocused();
    await c.getByRole("button", { name: "Previous slide" }).click();
    await settled(page, 3);
    await expect(slides.nth(3)).not.toHaveAttribute("inert", /.*/);
  });

  test("buttons are at least 44px; status is a separate polite live region", async ({
    page,
  }) => {
    await page.goto("/");
    const c = carousel(page);
    await expect(c.getByRole("button", { name: "Next slide" })).toBeVisible();
    await expect(track(page)).not.toHaveAttribute("aria-live", /.*/);
    await expect(status(page)).toHaveAttribute("aria-live", "polite");
    await expect(status(page)).toHaveAttribute("aria-atomic", "true");
    for (const b of await c.getByRole("button").all()) {
      const box = await b.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("no autoplay: slide does not change after 8 seconds", async ({ page }) => {
    await page.goto("/");
    const before = await activeIndex(page);
    await page.waitForTimeout(8000);
    expect(await activeIndex(page)).toBe(before);
    expect(await track(page).evaluate((el) => el.scrollLeft)).toBe(0);
    await expect(status(page)).toHaveText("");
  });

  test("a swipe or scroll does not announce, and updates the active slide", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      carousel(page).getByRole("button", { name: "Next slide" }),
    ).toBeVisible();
    await track(page).evaluate((el) => el.scrollTo({ left: el.clientWidth * 2 }));
    await settled(page, 2);
    await expect(
      carousel(page).getByRole("button", { name: /Show slide 3 of 5/ }),
    ).toHaveAttribute("aria-current", "true");
    await page.waitForTimeout(900);
    await expect(status(page)).toHaveText("");
  });

  for (const gap of [30, 80, 150]) {
    test(`rapid Next presses (${gap}ms apart) end on the right slide`, async ({
      page,
    }) => {
      await page.goto("/");
      const c = carousel(page);
      const next = c.getByRole("button", { name: "Next slide" });
      await next.focus();
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press("Enter");
        await page.waitForTimeout(gap);
      }
      await settled(page, 3);
      await expect(status(page)).toHaveText(/^Slide 4 of 5: /);
      await expect(c.getByRole("button", { name: /Show slide 4 of 5/ })).toHaveAttribute(
        "aria-current",
        "true",
      );
      await expect(c.locator(".carousel-slide:not([inert])")).toHaveCount(1);
      await expect(c.locator(".carousel-slide:not([inert])")).toHaveAttribute(
        "aria-label",
        "4 of 5",
      );
    });
  }

  test("reduced motion jumps straight to the slide; otherwise it animates", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const next = carousel(page).getByRole("button", { name: "Next slide" });
    await next.click();
    await frames(page, 2);
    expect(
      await track(page).evaluate((el) => Math.abs(el.scrollLeft - el.clientWidth)),
    ).toBeLessThan(2);

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await carousel(page).getByRole("button", { name: "Next slide" }).click();
    await frames(page, 2);
    const mid = await track(page).evaluate((el) => ({
      left: el.scrollLeft,
      width: el.clientWidth,
    }));
    expect(mid.left).toBeLessThan(mid.width - 2);
    await settled(page, 1);
  });

  test("controls are not rendered without JavaScript", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3100/");
    await expect(carousel(page).getByRole("button")).toHaveCount(0);
    await expect(carousel(page).locator("[inert]")).toHaveCount(0);
    await ctx.close();
  });
});

test("reduced motion: hero illustration has no animation or transition", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const info = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("svg .draw, svg .fade-in"));
    return {
      count: els.length,
      moving: els.filter((e) => {
        const s = getComputedStyle(e);
        return s.animationName !== "none" || parseFloat(s.transitionDuration) > 0.001;
      }).length,
    };
  });
  expect(info.count).toBeGreaterThan(0);
  expect(info.moving).toBe(0);
});

test("motion allowed: hero animation is short, runs once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const r = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("svg .draw, svg .fade-in"));
    return els.map((e) => {
      const s = getComputedStyle(e);
      return {
        total: parseFloat(s.animationDuration) + parseFloat(s.animationDelay),
        iter: s.animationIterationCount,
      };
    });
  });
  for (const a of r) {
    expect(a.iter).toBe("1");
    expect(a.total).toBeLessThanOrEqual(1.5);
  }
});

for (const route of routes) {
  test(`reflow at 320px, no horizontal scroll: ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(route);
    const w = await page.evaluate(() => ({
      sw: document.scrollingElement!.scrollWidth,
      iw: window.innerWidth,
    }));
    expect(w.sw).toBeLessThanOrEqual(w.iw);
  });

  test(`target size at least 24px (inline text links excepted): ${route}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto(route);
    const small = await page.evaluate(() => {
      const out: string[] = [];
      const sel = "a[href], button, input:not([type=hidden]), select, textarea";
      for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
        const r = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        if (!r.width || !r.height || st.visibility === "hidden" || el.closest("[hidden]"))
          continue;
        if (el.classList.contains("sr-only-until-focus")) continue;
        if (r.width >= 24 && r.height >= 24) continue;
        // Inline exception: link sits within a sentence of running text.
        if (el.tagName === "A" && st.display === "inline") continue;
        out.push(
          `${el.tagName} ${el.textContent?.trim().slice(0, 30)} ${r.width}x${r.height}`,
        );
      }
      return out;
    });
    expect(small).toEqual([]);
  });
}

test("focus not obscured: tabbing through the home page", async ({ page }) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/");
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const res = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const r = el.getBoundingClientRect();
        const header = document.querySelector("header")!.getBoundingClientRect();
        const style = getComputedStyle(document.querySelector("header")!);
        const fixed = style.position === "sticky" || style.position === "fixed";
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const top = document.elementFromPoint(cx, cy);
        return {
          inView: r.bottom > 0 && r.top < innerHeight,
          covered:
            fixed && r.top < header.bottom && r.bottom > header.top
              ? true
              : !!top && top !== el && !el.contains(top) && !top.contains(el),
        };
      });
      if (!res) continue;
      expect(res.inView).toBe(true);
      expect(res.covered).toBe(false);
    }
  }
});

test("careers page states unpaid, India and the joint venture plainly", async ({
  page,
}) => {
  await page.goto("/careers");
  await expect(
    page.getByText("These internships are unpaid. They run in India."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Run by two companies." }),
  ).toBeVisible();
  const link = page.getByRole("link", { name: /rightclickorbit\.com/ });
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await expect(link).toHaveAttribute("href", "https://rightclickorbit.com");
  await expect(link).toContainText("a different website");
});

for (const [route, width] of [
  ["/", 640],
  ["/", 1280],
  ["/services", 640],
  ["/services", 1280],
  ["/services/ai-development", 640],
  ["/services/ai-development", 1280],
  ["/careers", 640],
  ["/tools", 640],
  ["/tools/ai-savings-estimator", 640],
  ["/tools/ai-savings-estimator", 1280],
] as const) {
  test(`200% text size, no horizontal scroll: ${route} at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(route);
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    const w = await page.evaluate(() => ({
      sw: document.scrollingElement!.scrollWidth,
      iw: window.innerWidth,
    }));
    expect(w.sw).toBeLessThanOrEqual(w.iw);
  });
}

test.describe("careers resume upload", () => {
  const pdf = () => ({
    name: "cv.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(tinyPdf()),
  });

  test("file field is labelled, described and required", async ({ page }) => {
    await page.goto("/careers");
    const input = page.getByLabel(/^Resume/);
    await expect(input).toHaveAttribute("type", "file");
    await expect(input).toHaveAttribute("accept", RESUME_ACCEPT);
    await expect(input).toHaveAttribute("required", "");
    await expect(input).toHaveAttribute("aria-describedby", /hint/);
    await expect(page.getByText(RESUME_HINT)).toBeVisible();
    const box = await input.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("empty submit lists the resume in the error summary and focuses it from the link", async ({
    page,
  }) => {
    await page.goto("/careers");
    await page.getByRole("button", { name: "Send application" }).click();
    const link = page.getByRole("link", { name: "Resume: Attach your resume." });
    await expect(link).toBeVisible();
    await expect(page.getByLabel(/^Resume/)).toHaveAttribute("aria-invalid", "true");
    await link.click();
    await expect(page.getByLabel(/^Resume/)).toBeFocused();
  });

  test("wrong file type shows an error; a valid file shows its name in a status", async ({
    page,
  }) => {
    await page.goto("/careers");
    const input = page.getByLabel(/^Resume/);
    await input.setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello"),
    });
    await expect(page.getByText(resumeMessages.type)).toBeVisible();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await input.setInputFiles(pdf());
    await expect(page.getByText("Selected: cv.pdf (")).toBeVisible();
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await expect(
      page.locator('[role="status"]', { hasText: "Selected: cv.pdf" }),
    ).toHaveCount(1);
  });

  test("a file over 5 MB is rejected in the browser", async ({ page }) => {
    await page.goto("/careers");
    await page.getByLabel(/^Resume/).setInputFiles({
      name: "big.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
    await expect(
      page.getByText("The file is too large. The limit is 5 MB."),
    ).toBeVisible();
  });

  test("keyboard-only completion sends multipart, and the file survives a server error", async ({
    page,
  }) => {
    let calls = 0;
    let lastBody = "";
    await page.route("**/api/apply", async (route) => {
      calls++;
      lastBody = route.request().postData() ?? "";
      const type = route.request().headers()["content-type"] ?? "";
      expect(type).toContain("multipart/form-data");
      if (calls === 1) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          json: {
            ok: false,
            code: "invalid",
            message: "Some fields need attention.",
            errors: { link: "Enter a full link starting with https://" },
          },
        });
      } else {
        await route.fulfill({ json: { ok: true } });
      }
    });
    await page.goto("/careers#apply");
    await page.getByLabel(/^Name/).focus();
    await page.keyboard.type("Sam Student");
    await page.keyboard.press("Tab");
    await page.keyboard.type("sam@example.com");
    await page.keyboard.press("Tab");
    await page.keyboard.type("Content");
    await page.keyboard.press("Tab");
    await page.keyboard.type("https://example.com/me");
    await page.keyboard.press("Tab");
    await page.keyboard.type("I write about technology and enjoy editing.");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel(/^Resume/)).toBeFocused();
    await page.getByLabel(/^Resume/).setInputFiles(pdf());
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Send application" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      page.getByText("Enter a full link starting with https://").first(),
    ).toBeVisible();
    expect(lastBody).toContain('filename="cv.pdf"');
    // WCAG 3.3.7: the chosen file is still there for the retry.
    expect(
      await page
        .getByLabel(/^Resume/)
        .evaluate((el: HTMLInputElement) => el.files?.length),
    ).toBe(1);
    await page.getByRole("button", { name: "Send application" }).click();
    await expect(
      page.getByRole("heading", { name: "Application received" }),
    ).toBeVisible();
    expect(calls).toBe(2);
  });

  test("works without JavaScript: native multipart post reaches the server checks", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    const fill = async (file: { name: string; mimeType: string; buffer: Buffer }) => {
      await page.goto("http://localhost:3100/careers");
      await page.getByLabel(/^Name/).fill("Sam Student");
      await page.getByLabel(/^Email/).fill("sam@example.com");
      await page.getByLabel(/^Role/).selectOption("content-writer");
      await page
        .getByRole("textbox", { name: /^Tell us about yourself/ })
        .fill("I write about technology.");
      await page.getByLabel(/^Resume/).setInputFiles(file);
      await page.getByRole("button", { name: "Send application" }).click();
    };
    // Valid file: validation passes and the route reaches the email step
    // (the test server has no email key, so it answers "unavailable").
    await fill(pdf());
    await expect(page).toHaveURL(/form-status\?form=apply&result=unavailable/);
    await fill({ name: "x.txt", mimeType: "text/plain", buffer: Buffer.from("hi") });
    await expect(page).toHaveURL(/result=invalid_resume/);
    await expect(
      page.getByRole("heading", { name: /resume could not be accepted/i }),
    ).toBeVisible();
    await ctx.close();
  });

  test("a DOCX file is rejected: resumes are PDF only", async ({ page }) => {
    await page.goto("/careers");
    await page.getByLabel(/^Resume/).setInputFiles({
      name: "cv.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    });
    await expect(page.getByText("Resumes must be a PDF file.")).toBeVisible();
  });
});
