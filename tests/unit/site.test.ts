import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadUrl(): Promise<string> {
  vi.resetModules();
  return (await import("@/lib/site")).site.url;
}

describe("site.url", () => {
  it("falls back to the default when NEXT_PUBLIC_SITE_URL is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined as unknown as string);
    expect(await loadUrl()).toBe("https://sidedataa.com");
  });

  it("falls back to the default when it is an empty string (unset CI variable)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const url = await loadUrl();
    expect(url).toBe("https://sidedataa.com");
    expect(() => new URL(url)).not.toThrow();
  });

  it("uses the value when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.example.com");
    expect(await loadUrl()).toBe("https://staging.example.com");
  });
});
