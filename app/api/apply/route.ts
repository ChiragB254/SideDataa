import { applySchema } from "@/lib/schemas";
import { handleSubmission, oneLine } from "@/lib/submission";
import { roleOptions } from "@/content/slugs";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleSubmission(request, {
    kind: "apply",
    schema: applySchema,
    toMail: (d) => {
      const role = roleOptions.find((r) => r.slug === d.role)?.label ?? d.role;
      return {
        subject: `Career application: ${oneLine(d.name)} (${role})`,
        replyTo: d.email,
        text: [
          `Name: ${oneLine(d.name)}`,
          `Email: ${d.email}`,
          `Role: ${role}`,
          `Link: ${d.link ? oneLine(d.link) : "-"}`,
          "",
          d.message,
        ].join("\n"),
      };
    },
  });
}
