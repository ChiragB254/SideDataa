import { describe, expect, it } from "vitest";
import { GET } from "@/app/healthz/route";

describe("GET /healthz", () => {
  it("returns 200 {ok:true} with no-store and nothing else", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ ok: true });
  });
});
