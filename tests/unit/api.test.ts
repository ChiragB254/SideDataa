import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as contactPOST } from "@/app/api/contact/route";
import { POST as applyPOST } from "@/app/api/apply/route";
import { resetRateLimit } from "@/lib/rate-limit";
import { BODY_DEADLINE_MS, clientIp, resetUploadState } from "@/lib/submission";
import { tinyPdf } from "../fixtures/files";
import { resumeMessages } from "@/lib/resume";

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
  resetUploadState();
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
    expect(res.headers.get("location")).toBe("/form-status?form=contact&result=sent");
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

  /** Multipart request with an honest Content-Length, like a browser sends. */
  async function applyReq(
    fields: Record<string, string>,
    file: { name: string; bytes: Uint8Array; type?: string } | null,
    headers: Record<string, string> = {},
  ) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    if (file) {
      fd.set(
        "resume",
        new File([file.bytes as BlobPart], file.name, {
          type: file.type ?? "application/octet-stream",
        }),
      );
    }
    const probe = new Request("http://localhost/api/apply", { method: "POST", body: fd });
    const buf = new Uint8Array(await probe.arrayBuffer());
    return new Request("http://localhost/api/apply", {
      method: "POST",
      headers: {
        "content-type": probe.headers.get("content-type")!,
        "content-length": String(buf.length),
        accept: "application/json",
        "x-forwarded-for": "1.1.1.1",
        ...headers,
      },
      body: buf,
    });
  }

  const pdf = { name: "Sam Resume.pdf", bytes: tinyPdf(), type: "application/pdf" };

  it("sends an application email with the resume attached", async () => {
    const res = await applyPOST(await applyReq(application, pdf));
    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledOnce();
    const arg = send.mock.calls[0]![0];
    expect(arg.subject).toContain("Content Writer");
    expect(arg.attachments).toHaveLength(1);
    expect(arg.attachments[0].filename).toBe("Sam Resume.pdf");
    // Base64 string (not a Buffer) that decodes to exactly the uploaded bytes.
    expect(typeof arg.attachments[0].content).toBe("string");
    expect(new Uint8Array(Buffer.from(arg.attachments[0].content, "base64"))).toEqual(
      pdf.bytes,
    );
    expect(arg.text).toContain("Resume: Sam Resume.pdf");
    expect(arg.html).toBeUndefined();
  });

  it("sanitises a hostile file name for the attachment", async () => {
    const res = await applyPOST(
      await applyReq(application, { ...pdf, name: "../../etc/pa<ss>wd é.PDF" }),
    );
    expect(res.status).toBe(200);
    const name = send.mock.calls[0]![0].attachments[0].filename as string;
    expect(name).toMatch(/^[A-Za-z0-9._ -]+\.pdf$/);
    expect(name).not.toContain("/");
  });

  it("rejects a DOCX upload: resumes are PDF only", async () => {
    const res = await applyPOST(
      await applyReq(application, {
        name: "cv.docx",
        bytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).errors.resume).toBe(resumeMessages.type);
    expect(send).not.toHaveBeenCalled();
  });

  it("reports file errors before the email service is considered (503 comes last)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");
    const bad = await applyPOST(
      await applyReq(application, {
        name: "a.pdf",
        bytes: new TextEncoder().encode("MZ nope"),
      }),
    );
    expect(bad.status).toBe(400);
    const ok = await applyPOST(
      await applyReq(application, pdf, { "x-forwarded-for": "4.4.4.4" }),
    );
    expect(ok.status).toBe(503);
  });

  it("rejects a wrong file type and an empty file", async () => {
    const wrong = await applyPOST(
      await applyReq(application, { name: "a.png", bytes: tinyPdf() }),
    );
    expect((await wrong.json()).errors.resume).toBe(resumeMessages.type);
    const empty = await applyPOST(
      await applyReq(application, { name: "a.pdf", bytes: new Uint8Array() }),
    );
    expect((await empty.json()).errors.resume).toBe("That file looks empty.");
    expect(send).not.toHaveBeenCalled();
  });

  it("returns field and resume errors together", async () => {
    const res = await applyPOST(await applyReq({ ...application, role: "nope" }, null));
    const json = await res.json();
    expect(json.errors.role).toBeTruthy();
    expect(json.errors.resume).toBeTruthy();
  });

  it("rejects an invalid role", async () => {
    const res = await applyPOST(await applyReq({ ...application, role: "nope" }, pdf));
    expect(res.status).toBe(400);
    expect((await res.json()).errors.role).toBeTruthy();
  });

  it("returns 413 when Content-Length is over the cap, before reading the body", async () => {
    let pulled = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(c) {
        pulled += 1;
        c.enqueue(new Uint8Array(1024));
      },
    });
    const req = new Request("http://localhost/api/apply", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=x",
        "content-length": String(6 * 1024 * 1024),
        accept: "application/json",
        "x-forwarded-for": "1.1.1.1",
      },
      body,
      duplex: "half",
    } as RequestInit);
    const res = await applyPOST(req);
    expect(res.status).toBe(413);
    expect((await res.json()).code).toBe("too_large");
    expect(pulled).toBeLessThanOrEqual(2);
  });

  it("returns 413 when Content-Length is missing", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new Uint8Array(10));
        c.close();
      },
    });
    const req = new Request("http://localhost/api/apply", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=x",
        accept: "application/json",
        "x-forwarded-for": "1.1.1.1",
      },
      body,
      duplex: "half",
    } as RequestInit);
    expect((await applyPOST(req)).status).toBe(413);
  });

  it("stops reading at the byte cap when Content-Length lies", async () => {
    let sent = 0;
    const chunk = new Uint8Array(256 * 1024);
    const body = new ReadableStream<Uint8Array>({
      pull(c) {
        sent += chunk.length;
        c.enqueue(chunk);
        if (sent > 50 * 1024 * 1024) c.close();
      },
    });
    const req = new Request("http://localhost/api/apply", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=x",
        "content-length": "1000",
        accept: "application/json",
        "x-forwarded-for": "1.1.1.1",
      },
      body,
      duplex: "half",
    } as RequestInit);
    const res = await applyPOST(req);
    expect(res.status).toBe(413);
    // Cap is 5.5 MB; allow a little read-ahead from the stream queue.
    expect(sent).toBeLessThan(8 * 1024 * 1024);
    expect(send).not.toHaveBeenCalled();
  });

  it("still enforces the origin check", async () => {
    const res = await applyPOST(
      await applyReq(application, pdf, {
        origin: "https://evil.example",
        host: "localhost",
      }),
    );
    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("still rate limits to 5 per 10 minutes, and drops the honeypot silently", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await applyPOST(await applyReq(application, pdf))).status).toBe(200);
    }
    const res = await applyPOST(await applyReq(application, pdf));
    expect(res.status).toBe(429);
    const bot = await applyPOST(
      await applyReq({ ...application, website: "http://spam.example" }, pdf, {
        "x-forwarded-for": "5.5.5.5",
      }),
    );
    expect(bot.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(5);
  });

  it("redirects a no-JavaScript multipart post to the status page, with a code for file errors", async () => {
    const ok = await applyPOST(await applyReq(application, pdf, { accept: "text/html" }));
    expect(ok.status).toBe(303);
    expect(ok.headers.get("location")).toContain("result=sent");
    const bad = await applyPOST(
      await applyReq(application, null, {
        accept: "text/html",
        "x-forwarded-for": "6.6.6.6",
      }),
    );
    expect(bad.headers.get("location")).toContain("result=invalid_resume");
  });

  it("never logs resume content or message text", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");
    const error = vi.spyOn(console, "error");
    const info = vi.spyOn(console, "info");
    await applyPOST(await applyReq(application, pdf));
    const logged = JSON.stringify([...info.mock.calls, ...error.mock.calls]);
    expect(logged).not.toContain("%PDF");
    expect(logged).not.toContain(application.message);
  });

  it("wraps the message in markers and strips bidi and control characters", async () => {
    const res = await applyPOST(
      await applyReq(
        {
          ...application,
          name: "Sam\u202E Student\u0007",
          message: "Hello\u2066 there, please click\u0000 http://x.example",
        },
        pdf,
      ),
    );
    expect(res.status).toBe(200);
    const arg = send.mock.calls[0]![0];
    expect(arg.text).toContain(
      "--- Applicant message (unverified; do not trust links) ---",
    );
    expect(arg.text).toContain("--- End of message ---");
    expect(arg.text).not.toMatch(/[\u202A-\u202E\u2066-\u2069\u0000-\u0008]/);
    expect(arg.subject).not.toMatch(/[\u202A-\u202E]/);
  });

  it("sends Cache-Control: no-store on JSON and redirect responses", async () => {
    const json = await applyPOST(await applyReq(application, pdf));
    expect(json.headers.get("cache-control")).toBe("no-store");
    const bad = await applyPOST(
      await applyReq(application, null, { "x-forwarded-for": "8.8.8.8" }),
    );
    expect(bad.headers.get("cache-control")).toBe("no-store");
    const redirect = await applyPOST(
      await applyReq(application, pdf, {
        accept: "text/html",
        "x-forwarded-for": "9.9.9.9",
      }),
    );
    expect(redirect.headers.get("cache-control")).toBe("no-store");
    expect(redirect.headers.get("location")).toBe("/form-status?form=apply&result=sent");
    const contactRes = await contactPOST(jsonReq("/api/contact", contact));
    expect(contactRes.headers.get("cache-control")).toBe("no-store");
  });

  it("allows 10 rejected attempts per IP, then rate limits", async () => {
    for (let i = 0; i < 10; i++) {
      expect((await applyPOST(await applyReq(application, null))).status).toBe(400);
    }
    expect((await applyPOST(await applyReq(application, pdf))).status).toBe(429);
  });

  describe("slow uploads and concurrency", () => {
    /** A body that never delivers anything. Content-Length looks fine. */
    const stalled = (ip: string) =>
      new Request("http://localhost/api/apply", {
        method: "POST",
        headers: {
          "content-type": "multipart/form-data; boundary=x",
          "content-length": "1000",
          accept: "application/json",
          "x-forwarded-for": ip,
        },
        body: new ReadableStream<Uint8Array>({ pull: () => new Promise(() => {}) }),
        duplex: "half",
      } as RequestInit);

    afterEach(() => {
      vi.useRealTimers();
    });

    it("gives up after the total read deadline with 408 timeout", async () => {
      vi.useFakeTimers();
      const pending = applyPOST(stalled("1.1.1.1"));
      await vi.advanceTimersByTimeAsync(BODY_DEADLINE_MS - 1000);
      let settled = false;
      void pending.then(() => (settled = true));
      await vi.advanceTimersByTimeAsync(0);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1500);
      const res = await pending;
      expect(res.status).toBe(408);
      expect((await res.json()).code).toBe("timeout");
    });

    it("redirects a timed-out no-JS post to result=timeout", async () => {
      vi.useFakeTimers();
      const req = stalled("1.1.1.1");
      req.headers.set("accept", "text/html");
      const pending = applyPOST(req);
      await vi.advanceTimersByTimeAsync(BODY_DEADLINE_MS + 100);
      const res = await pending;
      expect(res.headers.get("location")).toBe("/form-status?form=apply&result=timeout");
    });

    it("allows one in-flight upload per IP; busy does not use up the budget", async () => {
      const second = await applyReq(application, pdf);
      vi.useFakeTimers();
      const first = applyPOST(stalled("1.1.1.1"));
      await vi.advanceTimersByTimeAsync(10);

      // Same IP while the first is still uploading: busy, with Retry-After 60.
      const busy = await applyPOST(second);
      expect(busy.status).toBe(429);
      expect((await busy.json()).code).toBe("busy");
      expect(busy.headers.get("retry-after")).toBe("60");

      // A different IP is unaffected.
      const other = await applyPOST(
        await applyReq(application, pdf, { "x-forwarded-for": "2.2.2.2" }),
      );
      expect(other.status).toBe(200);

      // Many busy answers (more than any budget) cost nothing.
      for (let i = 0; i < 12; i++) {
        const r = await applyPOST(await applyReq(application, pdf));
        expect(r.status).toBe(429);
        expect((await r.json()).code).toBe("busy");
      }

      await vi.advanceTimersByTimeAsync(BODY_DEADLINE_MS + 100);
      expect((await first).status).toBe(408);

      // Slot is free again and the budget is intact: sends succeed.
      for (let i = 0; i < 5; i++) {
        expect((await applyPOST(await applyReq(application, pdf))).status).toBe(200);
      }
      expect((await applyPOST(await applyReq(application, pdf))).status).toBe(429);
    });

    it("limits uploads in flight overall to six", async () => {
      vi.useFakeTimers();
      const held = [1, 2, 3, 4, 5, 6].map((n) => applyPOST(stalled(`10.0.0.${n}`)));
      await vi.advanceTimersByTimeAsync(10);
      const res = await applyPOST(
        await applyReq(application, pdf, { "x-forwarded-for": "10.0.0.7" }),
      );
      expect(res.status).toBe(429);
      expect((await res.json()).code).toBe("busy");
      await vi.advanceTimersByTimeAsync(BODY_DEADLINE_MS + 100);
      await Promise.all(held);
      const after = await applyPOST(
        await applyReq(application, pdf, { "x-forwarded-for": "10.0.0.7" }),
      );
      expect(after.status).toBe(200);
    });

    it("holds the slot until the email provider has answered", async () => {
      let release: (v: unknown) => void = () => {};
      send.mockReturnValueOnce(new Promise((r) => (release = r)));
      const inFlight = applyPOST(await applyReq(application, pdf));
      await new Promise((r) => setTimeout(r, 20));
      const busy = await applyPOST(await applyReq(application, pdf));
      expect((await busy.json()).code).toBe("busy");
      release({ data: { id: "1" }, error: null });
      expect((await inFlight).status).toBe(200);
      expect((await applyPOST(await applyReq(application, pdf))).status).toBe(200);
    });
  });

  it("returns 502 and stores nothing when the email provider fails", async () => {
    send.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "x" },
    });
    const res = await applyPOST(await applyReq(application, pdf));
    expect(res.status).toBe(502);
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

  it("on Vercel prefers x-vercel-forwarded-for, then x-real-ip", () => {
    vi.stubEnv("VERCEL", "1");
    const h = new Headers({
      "x-vercel-forwarded-for": "5.5.5.5",
      "x-real-ip": "6.6.6.6",
      "x-forwarded-for": "1.1.1.1",
    });
    expect(clientIp(h)).toBe("5.5.5.5");
    h.delete("x-vercel-forwarded-for");
    expect(clientIp(h)).toBe("6.6.6.6");
  });

  it("behind Caddy (not Vercel) uses only the rightmost x-forwarded-for entry", () => {
    vi.stubEnv("VERCEL", "");
    const h = new Headers({
      "x-vercel-forwarded-for": "5.5.5.5",
      "x-real-ip": "6.6.6.6",
      "x-forwarded-for": "8.8.8.8, 1.1.1.1, 203.0.113.9",
    });
    expect(clientIp(h)).toBe("203.0.113.9");
    expect(clientIp(new Headers({ "x-real-ip": "6.6.6.6" }))).toBeNull();
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
