import { Resend } from "resend";

export type OutgoingMail = {
  subject: string;
  text: string;
  replyTo: string;
  /** `content` is a base64 string: Resend's SDK would JSON-encode a Buffer as a huge number array. */
  attachments?: { filename: string; content: string; contentType: string }[];
};

export type MailResult = "sent" | "logged" | "unavailable" | "failed";

export function mailConfig() {
  return {
    to: process.env.CONTACT_TO || "support@sidedataa.com",
    from: process.env.CONTACT_FROM || "SideData Website <no-reply@sidedataa.com>",
    apiKey: process.env.RESEND_API_KEY || "",
  };
}

/**
 * Sends through Resend when RESEND_API_KEY is set. Without a key:
 * development logs the message to the server console, production reports
 * "unavailable" so the route can answer 503. Message bodies are never logged
 * in production.
 */
export async function sendMail(mail: OutgoingMail): Promise<MailResult> {
  const { to, from, apiKey } = mailConfig();

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("[forms] RESEND_API_KEY is not set; cannot deliver submission.");
      return "unavailable";
    }
    const { attachments, ...rest } = mail;
    console.info("[forms] (dev) RESEND_API_KEY not set. Would send:\n", {
      to,
      from,
      ...rest,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        base64Chars: a.content.length,
      })),
    });
    return "logged";
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
      ...(mail.attachments ? { attachments: mail.attachments } : {}),
    });
    if (error) {
      console.error("[forms] Resend rejected the message:", error.name);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error(
      "[forms] Resend request failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return "failed";
  }
}
