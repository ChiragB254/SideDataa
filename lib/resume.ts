/**
 * Resume validation. Pure functions: no I/O, nothing is executed or
 * decompressed. Shared by the browser (type and size only) and the API route
 * (full check including content signatures).
 *
 * NOT checked: viruses or malicious PDFs (scripts, links, exploits).
 * A file that passes is a file that starts like a PDF. It is
 * emailed to the owner, who should open attachments in a safe viewer.
 */

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

/** Whole request body cap: the file plus form fields and multipart framing. */
export const APPLY_MAX_BODY_BYTES = RESUME_MAX_BYTES + 512 * 1024;

export type ResumeExt = "pdf";

/**
 * The ONE place that decides which resume types are accepted. Resumes are PDF only
 * (owner decision). To allow another type, extend ResumeExt and TYPE_INFO and add a
 * content check in validateResume. The accept attribute, hint,
 * error messages, form note, privacy text and checks all derive from it.
 */
export const RESUME_TYPES: readonly ResumeExt[] = ["pdf"];

const TYPE_INFO: Record<ResumeExt, { mime: string; label: string }> = {
  pdf: { mime: "application/pdf", label: "PDF" },
};

/** "PDF". */
export const RESUME_LABEL = RESUME_TYPES.map((t) => TYPE_INFO[t].label).join(" or ");
/** "a PDF file". */
export const RESUME_FILE_PHRASE = `a ${RESUME_LABEL} file`;
export const RESUME_ACCEPT = [
  ...RESUME_TYPES.map((t) => `.${t}`),
  ...RESUME_TYPES.map((t) => TYPE_INFO[t].mime),
].join(",");
export const RESUME_HINT = `${RESUME_LABEL}, up to 5 MB.`;
export const RESUME_NOTE = `Attach your resume as ${RESUME_FILE_PHRASE}.`;

export const resumeMessages = {
  missing: "Attach your resume.",
  type: `Resumes must be a ${RESUME_LABEL} file.`,
  tooLarge: "The file is too large. The limit is 5 MB.",
  empty: "That file looks empty.",
  content: `That file does not look like a valid ${RESUME_LABEL} file. Check it opens, then try again.`,
} as const;

/** Inner extensions that make a name like "resume.exe.pdf" suspicious. */
const RISKY_INNER = new Set([
  "exe",
  "com",
  "bat",
  "cmd",
  "scr",
  "msi",
  "dll",
  "js",
  "mjs",
  "vbs",
  "ps1",
  "sh",
  "jar",
  "lnk",
  "hta",
  "html",
  "htm",
  "svg",
  "php",
  "py",
  "docm",
  "xlsm",
  "pptm",
  "app",
  "apk",
  "bin",
  "zip",
  "iso",
]);

const CONTROL = /[\u0000-\u001f\u007f]/;

function extensionOf(name: string): ResumeExt | null {
  const base = name.split(/[\\/]/).pop() ?? "";
  if (!base || CONTROL.test(base)) return null;
  const parts = base.toLowerCase().split(".");
  if (parts.length < 2) return null;
  const ext = parts[parts.length - 1] as string;
  if (!(RESUME_TYPES as readonly string[]).includes(ext)) return null;
  if (parts.slice(1, -1).some((p) => RISKY_INNER.has(p))) return null;
  return ext as ResumeExt;
}

/** Cheap checks usable in the browser: name, extension and size. */
export function checkResumeMeta(file: {
  name: string;
  size: number;
}): { ok: true; ext: ResumeExt } | { ok: false; message: string } {
  const ext = extensionOf(file.name);
  if (!ext) return { ok: false, message: resumeMessages.type };
  if (file.size === 0) return { ok: false, message: resumeMessages.empty };
  if (file.size > RESUME_MAX_BYTES)
    return { ok: false, message: resumeMessages.tooLarge };
  return { ok: true, ext };
}

const startsWith = (b: Uint8Array, sig: number[], at = 0) =>
  sig.every((v, i) => b[at + i] === v);

function isPdf(b: Uint8Array): boolean {
  return startsWith(b, [0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
}

export type ResumeCheck =
  | {
      ok: true;
      filename: string;
      contentType: string;
      ext: ResumeExt;
      size: number;
      bytes: Uint8Array;
    }
  | { ok: false; message: string };

/** Safe attachment name: basename only, [A-Za-z0-9._ -], max 80, validated extension. */
export function safeFilename(name: string, ext: ResumeExt): string {
  const base = (name.split(/[\\/]/).pop() ?? "").replace(/\.[^.]*$/, "");
  // Every dot except the final extension dot becomes "_", so a name such as
  // "a.exe .pdf" can never end up as "a.exe.pdf".
  const cleaned = base
    .replace(/[^A-Za-z0-9 _-]+/g, "_")
    .replace(/^[_\s-]+|[_\s]+$/g, "")
    .slice(0, 80 - ext.length - 1);
  return `${cleaned || "resume"}.${ext}`;
}

/** Full server-side check of an uploaded file. `file` null or undefined means none. */
export function validateResume(
  file: { name: string; bytes: Uint8Array } | null | undefined,
): ResumeCheck {
  if (!file) return { ok: false, message: resumeMessages.missing };
  const meta = checkResumeMeta({ name: file.name, size: file.bytes.byteLength });
  if (!meta.ok) {
    // A name with no file chosen arrives as an empty file with an empty name.
    if (!file.name && file.bytes.byteLength === 0) {
      return { ok: false, message: resumeMessages.missing };
    }
    return meta;
  }
  const good = isPdf(file.bytes);
  if (!good) return { ok: false, message: resumeMessages.content };
  return {
    ok: true,
    ext: meta.ext,
    filename: safeFilename(file.name, meta.ext),
    contentType: TYPE_INFO[meta.ext].mime,
    size: file.bytes.byteLength,
    bytes: file.bytes,
  };
}
