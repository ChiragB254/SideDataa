import { applySchema } from "@/lib/schemas";
import { handleSubmission, oneLine, wrapMessage } from "@/lib/submission";
import { APPLY_MAX_BODY_BYTES } from "@/lib/resume";
import { roleOptions } from "@/content/slugs";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleSubmission(request, {
    kind: "apply",
    schema: applySchema,
    resume: true,
    maxBodyBytes: APPLY_MAX_BODY_BYTES,
    toMail: (d, resume) => {
      const role = roleOptions.find((r) => r.slug === d.role)?.label ?? d.role;
      return {
        subject: `Career application: ${oneLine(d.name)} (${role})`,
        replyTo: d.email,
        text: [
          `Name: ${oneLine(d.name)}`,
          `Email: ${oneLine(d.email)}`,
          `Role: ${role}`,
          `Link: ${d.link ? oneLine(d.link) : "-"}`,
          "",
          resume
            ? `Resume: ${resume.filename} (${resume.ext.toUpperCase()}, ${Math.max(1, Math.round(resume.size / 1024))} KB), attached`
            : "Resume: not attached",
          "",
          wrapMessage("Applicant message", d.message),
        ].join("\n"),
        ...(resume
          ? {
              attachments: [
                {
                  filename: resume.filename,
                  content: Buffer.from(
                    resume.bytes.buffer,
                    resume.bytes.byteOffset,
                    resume.bytes.byteLength,
                  ).toString("base64"),
                  contentType: resume.contentType,
                },
              ],
            }
          : {}),
      };
    },
  });
}
