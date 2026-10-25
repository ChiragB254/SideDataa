import Link from "next/link";
import { Container } from "@/components/Container";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Form status",
  description: "Result of your form submission.",
  path: "/form-status",
  noindex: true,
});

const copy: Record<string, { title: string; body: string }> = {
  sent: {
    title: "Thanks. Your message was sent.",
    body: "We have received your message.",
  },
  invalid: {
    title: "Some fields were missing or not valid.",
    body: "Go back, check each field, and send again. Name, a valid email and a message are required.",
  },
  rate_limited: {
    title: "Too many submissions.",
    body: "Please wait a few minutes and try again.",
  },
  bot_check: {
    title: "The spam check did not pass.",
    body: "Go back, reload the page and try again.",
  },
  unavailable: {
    title: "This form is not accepting messages right now.",
    body: `Please email ${site.email} instead.`,
  },
  failed: {
    title: "We could not send your message.",
    body: `Please try again, or email ${site.email}.`,
  },
  invalid_resume: {
    title: "Your resume could not be accepted.",
    body: "Go back and attach a PDF or DOCX file of 5 MB or less, then check the other fields and send again.",
  },
  too_large: {
    title: "That file is too large.",
    body: "The limit is 5 MB. Go back, attach a smaller PDF or DOCX file and send again.",
  },
  bad_request: {
    title: "The request could not be read.",
    body: "Go back and try again.",
  },
};

export default async function FormStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string; result?: string }>;
}) {
  const { form, result } = await searchParams;
  const message =
    result !== undefined && Object.hasOwn(copy, result) ? copy[result]! : copy.failed!;
  const ok = result === "sent";
  const back = form === "apply" ? "/careers#apply" : "/contact";

  return (
    <section className="py-16 md:py-24">
      <Container>
        <h1 className="max-w-[24ch] text-4xl leading-tight md:text-5xl">
          {message.title}
        </h1>
        <div
          role={ok ? "status" : "alert"}
          className="mt-6 max-w-xl text-lg text-ink-soft"
        >
          <p>{message.body}</p>
        </div>
        <p className="mt-8">
          <Link className="link inline-flex min-h-11 items-center" href={ok ? "/" : back}>
            {ok ? "Back to the home page" : "Go back to the form"}
          </Link>
        </p>
      </Container>
    </section>
  );
}
