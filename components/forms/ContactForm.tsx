"use client";

import { FormEngine, type FieldConfig } from "./FormEngine";
import { contactSchema } from "@/lib/schemas";
import { serviceOptions } from "@/content/slugs";

const fields: FieldConfig[] = [
  { name: "name", label: "Name", type: "text", required: true, autoComplete: "name" },
  { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
  { name: "company", label: "Company", type: "text", autoComplete: "organization" },
  {
    name: "service",
    label: "What do you need help with?",
    type: "select",
    required: true,
    placeholderOption: "Choose one",
    options: [
      ...serviceOptions.map((s) => ({ value: s.slug, label: s.label })),
      { value: "not-sure", label: "Not sure yet" },
    ],
  },
  {
    name: "message",
    label: "Message",
    type: "textarea",
    required: true,
    hint: "A few sentences about the situation and what you would like to happen.",
    rows: 7,
  },
];

export function ContactForm() {
  return (
    <FormEngine
      kind="contact"
      endpoint="/api/contact"
      schema={contactSchema}
      fields={fields}
      submitLabel="Send message"
      successTitle="Message sent"
      successBody="Thanks, we have received your message."
    />
  );
}
