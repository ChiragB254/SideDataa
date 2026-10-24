import { z } from "zod";
import { serviceSlugs } from "@/content/slugs";
import { roleSlugs } from "@/content/slugs";

/**
 * Shared by the browser (client-side validation) and the route handlers.
 * Field names double as HTML input names.
 */

const text = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(
      min,
      min <= 1 ? `${label} is required.` : `${label} needs at least ${min} characters.`,
    )
    .max(max, `${label} must be ${max} characters or fewer.`);

const email = z
  .string({ error: "Email is required." })
  .trim()
  .min(1, "Email is required.")
  .max(254, "Email must be 254 characters or fewer.")
  .pipe(z.email("Enter an email address like name@example.com."));

const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .transform((v) => (v ? v : undefined));

const optionalUrl = z
  .string()
  .trim()
  .max(300, "Link must be 300 characters or fewer.")
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || /^https?:\/\/\S+\.\S+$/i.test(v), {
    message: "Enter a full link starting with https://",
  });

export const serviceInterestOptions = [...serviceSlugs, "not-sure"] as const;

const honeypot = z.string().optional();
const turnstile = z.string().max(4096).optional();

export const contactSchema = z.object({
  name: text("Name", 1, 100),
  email,
  company: optionalText("Company", 120),
  service: z.enum(serviceInterestOptions, {
    error: "Choose a service, or Not sure yet.",
  }),
  message: text("Message", 10, 5000),
  website: honeypot,
  "cf-turnstile-response": turnstile,
});

export const applySchema = z.object({
  name: text("Name", 1, 100),
  email,
  role: z.enum(roleSlugs, { error: "Choose a role." }),
  link: optionalUrl,
  message: text("Message", 10, 3000),
  website: honeypot,
  "cf-turnstile-response": turnstile,
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ApplyInput = z.infer<typeof applySchema>;

export type FieldErrors = Record<string, string>;

/** Flatten a ZodError to one message per field (first issue wins). */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
