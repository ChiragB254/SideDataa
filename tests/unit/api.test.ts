import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as contactPOST } from "@/app/api/contact/route";
import { POST as applyPOST } from "@/app/api/apply/route";
import { resetRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/submission";

const send = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

const contact = {
  name: "Ada Example",
  email: "ada@example.com",
  service: "cloud-services",
  message: "We want to move one application to AWS.",
};

function jsonReq(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "x-forwarded-for": "1.1.1.1",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resetRateLimit();
  send.mockReset();
  send.mockResolvedValue({ data: { id: "1" }, error: null });
  vi.unstubAllEnvs();
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("POST /api/contact", () => {
  it("sends an email and returns ok", async () => {
    const res = await contactPOST(jsonReq("/api/contact", contact));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(send).toHaveBeenCalledOnce();
    const arg = send.mock.calls[0]![0];
    expect(arg.to).toEqual(["support@sidedataa.com"]);
    expect(arg.replyTo).toBe("ada@example.com");
    expect(arg.subject).toContain("Ada Example");
  });

  it("uses CONTACT_TO when set", async () => {
    vi.stubEnv("CONTACT_TO", "inbox@example.com");
    await contactPOST(jsonReq("/api/contact", contact));
    expect(send.mock.calls[0]![0].to).toEqual(["inbox@example.com"]);
  });

  it("returns field errors with 400 for invalid input", async () => {
    const res = await contactPOST(jsonReq("/api/contact", { ...contact, email: "bad" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.code).toBe("invalid");
    expect(json.errors.email).toBeTruthy();
    expect(send).not.toHaveBeenCalled();
  });

  it("silently accepts but does not send when the honeypot is filled", async () => {
    const res = await contactPOST(
      jsonReq("/api/contact", { ...contact, website: "http://spam.example" }),
    );
    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it("rate limits after 5 submissions from one IP", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await contactPOST(jsonReq("/api/contact", contact))).status).toBe(200);
    }
    const res = await contactPOST(jsonReq("/api/contact", contact));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBeTruthy();
    // A different IP is unaffected.
    const other = await contactPOST(
      jsonReq("/api/contact", contact, { "x-forwarded-for": "2.2.2.2" }),
    );
    expect(other.status).toBe(200);
  });

  it("rejects cross-origin posts", async () => {
    const res = await contactPOST(
      jsonReq("/api/contact", contact, {
        origin: "https://evil.example",
        host: "localhost",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 503 in production when email is not configured, without logging the message", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");
    const info = vi.spyOn(console, "info");
    const error = vi.spyOn(console, "error");
    const res = await contactPOST(jsonReq("/api/contact", contact));
    expect(res.status).toBe(503);
    const logged = JSON.stringify([...info.mock.calls, ...error.mock.calls]);
    expect(logged).not.toContain(contact.message);
  });

  it("logs and succeeds in development when email is not configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESEND_API_KEY", "");
    const res = await contactPOST(jsonReq("/api/contact", contact));
    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it("returns 502 when the email provider fails", async () => {
    send.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "x" },
    });
    const res = await contactPOST(jsonReq("/api/contact", contact));
    expect(res.status).toBe(502);
  });

  it("checks Turnstile when a secret is set", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ success: false })));
    vi.stubGlobal("fetch", fetchMock);
    const missing = await contactPOST(jsonReq("/api/contact", contact));
    expect(missing.status).toBe(403);

    const rejected = await contactPOST(
      jsonReq("/api/contact", { ...contact, "cf-turnstile-response": "tok" }),
    );
    expect(rejected.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledOnce();

    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true })));
    const ok = await contactPOST(
      jsonReq("/api/contact", { ...contact, "cf-turnstile-response": "tok" }),
    );
    expect(ok.status).toBe(200);
  });

  it("redirects plain HTML form posts to the status page", async () => {
    const body = new URLSearchParams({ ...contact });
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-forwarded-for": "3.3.3.3",
      },
      body,
    });
    const res = await contactPOST(req);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(
      "http://localhost/form-status?form=contact&result=sent",
    );
  });

  it("strips line breaks from the subject", async () => {
    await contactPOST(
      jsonReq("/api/contact", { ...contact, name: "Ada\r\nBcc: x@example.com" }),
    );
    expect(send.mock.calls[0]![0].subject).not.toMatch(/[\r\n]/);
  });
});

describe("POST /api/apply", () => {
  const application = {
    name: "Sam Student",
    email: "sam@example.com",
    role: "content-writer",
    link: "https://example.com/portfolio",
    message: "I write about technology and enjoy editing.",
  };

  it("sends an application email", async () => {
    const res = await applyPOST(jsonReq("/api/apply", application));
    expect(res.status).toBe(200);
    expect(send.mock.calls[0]![0].subject).toContain("Content Writer");
  });

  it("rejects an invalid role", async () => {
    const res = await applyPOST(jsonReq("/api/apply", { ...application, role: "nope" }));
    expect(res.status).toBe(400);
    expect((await res.json()).errors.role).toBeTruthy();
  });
});

describe("client IP and rate limiting", () => {
  it("ignores spoofed leftmost x-forwarded-for entries", async () => {
    // Attacker rotates the leftmost value; the rightmost (proxy-added) is constant.
    for (let i = 0; i < 5; i++) {
      const res = await contactPOST(
        jsonReq("/api/contact", contact, { "x-forwarded-for": `9.9.9.${i}, 7.7.7.7` }),
      );
      expect(res.status).toBe(200);
    }
    const res = await contactPOST(
      jsonReq("/api/contact", contact, { "x-forwarded-for": "9.9.9.99, 7.7.7.7" }),
    );
    expect(res.status).toBe(429);
  });

  it("prefers x-vercel-forwarded-for", () => {
    const h = new Headers({
      "x-vercel-forwarded-for": "5.5.5.5",
      "x-forwarded-for": "1.1.1.1",
    });
    expect(clientIp(h)).toBe("5.5.5.5");
  });

  it("returns null when no IP header exists", () => {
    expect(clientIp(new Headers())).toBeNull();
  });

  it("does not lock all anonymous visitors after 5 submissions", async () => {
    const anon = () =>
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(contact),
      });
    for (let i = 0; i < 10; i++) expect((await contactPOST(anon())).status).toBe(200);
  });
});

describe("body size limit", () => {
  it("rejects oversized bodies even without content-length", async () => {
    const big = JSON.stringify({ ...contact, message: "a".repeat(60_000) });
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "x-real-ip": "4.4.4.4",
      },
      body: new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode(big));
          c.close();
        },
      }),
      // @ts-expect-error duplex is required by Node for streamed bodies
      duplex: "half",
    });
    expect((await contactPOST(req)).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
});

describe("turnstile configuration", () => {
  it("skips (does not 403) when the secret is set without a site key", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await contactPOST(jsonReq("/api/contact", contact));
    expect(res.status).toBe(200);
  });
});
