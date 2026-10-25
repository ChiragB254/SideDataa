/**
 * Resume validation. Pure functions: no I/O, nothing is executed or
 * decompressed. Shared by the browser (type and size only) and the API route
 * (full check including content signatures).
 *
 * NOT checked: viruses, macros or scripts inside a DOCX, or malicious PDFs.
 * A file that passes is a PDF or a ZIP that looks like a Word document. It is
 * emailed to the owner, who should open attachments in a safe viewer.
 */

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

/** Whole request body cap: the file plus form fields and multipart framing. */
export const APPLY_MAX_BODY_BYTES = RESUME_MAX_BYTES + 512 * 1024;

export const RESUME_ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const resumeMessages = {
  missing: "Attach your resume.",
  type: "Resumes must be a PDF or DOCX file.",
  tooLarge: "The file is too large. The limit is 5 MB.",
  empty: "That file looks empty.",
  content:
    "That file does not look like a valid PDF or DOCX. Check it opens, then try again.",
} as const;

const TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;
export type ResumeExt = keyof typeof TYPES;

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
  if (ext !== "pdf" && ext !== "docx") return null;
  if (parts.slice(1, -1).some((p) => RISKY_INNER.has(p))) return null;
  return ext;
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

/**
 * DOCX is a ZIP. Read only the end-of-central-directory record and the entry
 * names in the central directory; require "[Content_Types].xml" and at least
 * one "word/" entry. Nothing is decompressed.
 */
function isDocx(b: Uint8Array): boolean {
  if (!startsWith(b, [0x50, 0x4b, 0x03, 0x04])) return false; // PK\x03\x04
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  // EOCD is within the last 22 + 65535 bytes.
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65535); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return false;
  const entries = view.getUint16(eocd + 10, true);
  const cdSize = view.getUint32(eocd + 12, true);
  const cdOffset = view.getUint32(eocd + 16, true);
  if (cdOffset + cdSize > eocd || entries === 0 || entries > 20000) return false;

  let pos = cdOffset;
  let hasTypes = false;
  let hasWord = false;
  const decoder = new TextDecoder("utf-8");
  for (let n = 0; n < entries; n++) {
    if (pos + 46 > cdOffset + cdSize || view.getUint32(pos, true) !== 0x02014b50) {
      return false;
    }
    const nameLen = view.getUint16(pos + 28, true);
    const extraLen = view.getUint16(pos + 30, true);
    const commentLen = view.getUint16(pos + 32, true);
    if (pos + 46 + nameLen > cdOffset + cdSize) return false;
    const name = decoder.decode(b.subarray(pos + 46, pos + 46 + nameLen));
    if (name === "[Content_Types].xml") hasTypes = true;
    if (name.startsWith("word/")) hasWord = true;
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return hasTypes && hasWord;
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
  const cleaned = base
    .replace(/[^A-Za-z0-9._ -]+/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.\s-]+|[.\s]+$/g, "")
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
  const good = meta.ext === "pdf" ? isPdf(file.bytes) : isDocx(file.bytes);
  if (!good) return { ok: false, message: resumeMessages.content };
  return {
    ok: true,
    ext: meta.ext,
    filename: safeFilename(file.name, meta.ext),
    contentType: TYPES[meta.ext],
    size: file.bytes.byteLength,
    bytes: file.bytes,
  };
}
