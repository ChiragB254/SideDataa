import { contactSchema } from "@/lib/schemas";
import { handleSubmission, oneLine } from "@/lib/submission";
import { serviceOptions } from "@/content/slugs";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleSubmission(request, {
    kind: "contact",
    schema: contactSchema,
    toMail: (d) => {
      const service =
        serviceOptions.find((s) => s.slug === d.service)?.label ?? "Not sure yet";
      return {
        subject: `Website inquiry: ${oneLine(d.name)} (${service})`,
        replyTo: d.email,
        text: [
          `Name: ${oneLine(d.name)}`,
          `Email: ${d.email}`,
          `Company: ${d.company ? oneLine(d.company) : "-"}`,
          `Service interest: ${service}`,
          "",
          d.message,
        ].join("\n"),
      };
    },
  });
}
