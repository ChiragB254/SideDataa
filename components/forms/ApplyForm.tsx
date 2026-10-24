"use client";

import { FormEngine, type FieldConfig } from "./FormEngine";
import { applySchema } from "@/lib/schemas";
import { roleOptions } from "@/content/slugs";

const fields: FieldConfig[] = [
  { name: "name", label: "Name", type: "text", required: true, autoComplete: "name" },
  { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
  {
    name: "role",
    label: "Role",
    type: "select",
    required: true,
    placeholderOption: "Choose a role",
    options: roleOptions.map((r) => ({ value: r.slug, label: r.label })),
  },
  {
    name: "link",
    label: "Link to your work",
    type: "url",
    hint: "A portfolio, GitHub or LinkedIn page. Start with https://",
    autoComplete: "url",
  },
  {
    name: "message",
    label: "Tell us about yourself",
    type: "textarea",
    required: true,
    hint: "What you have made or written, what you want to learn, and anything you would like us to know.",
    rows: 7,
  },
];

export function ApplyForm() {
  return (
    <FormEngine
      kind="apply"
      endpoint="/api/apply"
      schema={applySchema}
      fields={fields}
      submitLabel="Send application"
      successTitle="Application received"
      successBody="Thanks, we have received your application."
    />
  );
}
