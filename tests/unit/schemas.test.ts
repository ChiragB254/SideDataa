import { describe, expect, it } from "vitest";
import { applySchema, contactSchema, fieldErrors } from "@/lib/schemas";

const validContact = {
  name: "Ada Example",
  email: "ada@example.com",
  company: "",
  service: "ai-development",
  message: "We would like to talk about a document search tool.",
};

describe("contactSchema", () => {
  it("accepts a valid submission and drops empty optional fields", () => {
    const r = contactSchema.safeParse(validContact);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.company).toBeUndefined();
  });

  it("trims whitespace", () => {
    const r = contactSchema.safeParse({ ...validContact, name: "  Ada  " });
    expect(r.success && r.data.name).toBe("Ada");
  });

  it("rejects bad email, empty name, short message and unknown service", () => {
    const r = contactSchema.safeParse({
      ...validContact,
      name: " ",
      email: "nope",
      message: "short",
      service: "x",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errs = fieldErrors(r.error);
      expect(Object.keys(errs).sort()).toEqual(["email", "message", "name", "service"]);
      expect(errs.name).toBe("Name is required.");
    }
  });

  it("rejects over-long messages", () => {
    expect(
      contactSchema.safeParse({ ...validContact, message: "a".repeat(5001) }).success,
    ).toBe(false);
  });

  it("requires the service field", () => {
    const { service, ...rest } = validContact;
    void service;
    expect(contactSchema.safeParse(rest).success).toBe(false);
  });
});

describe("applySchema", () => {
  const valid = {
    name: "Sam Student",
    email: "sam@example.com",
    role: "web-developer",
    link: "https://github.com/example",
    message: "I have built a few small React projects.",
  };

  it("accepts a valid application", () => {
    expect(applySchema.safeParse(valid).success).toBe(true);
  });

  it("allows the link to be empty", () => {
    const r = applySchema.safeParse({ ...valid, link: "" });
    expect(r.success && r.data.link).toBeUndefined();
  });

  it("rejects non-http links such as javascript:", () => {
    expect(applySchema.safeParse({ ...valid, link: "javascript:alert(1)" }).success).toBe(
      false,
    );
    expect(applySchema.safeParse({ ...valid, link: "github.com/x" }).success).toBe(false);
  });

  it("rejects unknown roles", () => {
    expect(applySchema.safeParse({ ...valid, role: "ceo" }).success).toBe(false);
  });
});
