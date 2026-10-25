import { describe, expect, it } from "vitest";
import {
  checkResumeMeta,
  RESUME_MAX_BYTES,
  RESUME_TYPES,
  resumeMessages,
  safeFilename,
  validateResume,
} from "@/lib/resume";
import { makeZip, tinyDocx, tinyPdf } from "../fixtures/files";

const DOCX = RESUME_TYPES.includes("docx");
const msg = (r: ReturnType<typeof validateResume>) => (r.ok ? "ok" : r.message);

describe("validateResume", () => {
  it("accepts a valid PDF", () => {
    const r = validateResume({ name: "My Resume.pdf", bytes: tinyPdf() });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.contentType).toBe("application/pdf");
      expect(r.filename).toBe("My Resume.pdf");
    }
  });

  it.runIf(DOCX)("accepts a valid DOCX, case-insensitive extension", () => {
    const r = validateResume({ name: "CV.DOCX", bytes: tinyDocx() });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.filename).toBe("CV.docx");
  });

  it("rejects a missing file and an empty file input", () => {
    expect(msg(validateResume(undefined))).toBe(resumeMessages.missing);
    expect(msg(validateResume(null))).toBe(resumeMessages.missing);
    // Browsers send an empty, nameless part when no file was chosen.
    expect(msg(validateResume({ name: "", bytes: new Uint8Array() }))).toBe(
      resumeMessages.missing,
    );
  });

  it("rejects the wrong extension", () => {
    expect(msg(validateResume({ name: "resume.txt", bytes: tinyPdf() }))).toBe(
      resumeMessages.type,
    );
    expect(msg(validateResume({ name: "resume.doc", bytes: tinyPdf() }))).toBe(
      resumeMessages.type,
    );
    expect(msg(validateResume({ name: "resume", bytes: tinyPdf() }))).toBe(
      resumeMessages.type,
    );
  });

  it.runIf(!DOCX)("rejects DOCX when only PDF is accepted", () => {
    expect(msg(validateResume({ name: "cv.docx", bytes: tinyDocx() }))).toBe(
      resumeMessages.type,
    );
  });

  it("rejects wrong magic bytes (an .exe renamed .pdf)", () => {
    const exe = new TextEncoder().encode("MZ\x90\x00 this is not a pdf");
    expect(msg(validateResume({ name: "resume.pdf", bytes: exe }))).toBe(
      resumeMessages.content,
    );
    expect(msg(validateResume({ name: "resume.docx", bytes: tinyPdf() }))).toBe(
      DOCX ? resumeMessages.content : resumeMessages.type,
    );
  });

  it.runIf(DOCX)("rejects a ZIP that is not a Word document", () => {
    const zip = makeZip({ "readme.txt": "hello" });
    expect(msg(validateResume({ name: "resume.docx", bytes: zip }))).toBe(
      resumeMessages.content,
    );
    const truncated = tinyDocx().slice(0, 40);
    expect(msg(validateResume({ name: "resume.docx", bytes: truncated }))).toBe(
      resumeMessages.content,
    );
  });

  it("rejects zero bytes", () => {
    expect(msg(validateResume({ name: "resume.pdf", bytes: new Uint8Array() }))).toBe(
      resumeMessages.empty,
    );
  });

  it("enforces the 5 MB limit exactly", () => {
    const at = new Uint8Array(RESUME_MAX_BYTES);
    at.set(tinyPdf());
    expect(validateResume({ name: "a.pdf", bytes: at }).ok).toBe(true);
    const over = new Uint8Array(RESUME_MAX_BYTES + 1);
    over.set(tinyPdf());
    expect(msg(validateResume({ name: "a.pdf", bytes: over }))).toBe(
      resumeMessages.tooLarge,
    );
  });

  it("rejects double extensions and control characters in the name", () => {
    expect(msg(validateResume({ name: "resume.pdf.exe", bytes: tinyPdf() }))).toBe(
      resumeMessages.type,
    );
    expect(msg(validateResume({ name: "resume.exe.pdf", bytes: tinyPdf() }))).toBe(
      resumeMessages.type,
    );
    expect(msg(validateResume({ name: "re\u0000sume.pdf", bytes: tinyPdf() }))).toBe(
      resumeMessages.type,
    );
    expect(msg(validateResume({ name: "res\nume.pdf", bytes: tinyPdf() }))).toBe(
      resumeMessages.type,
    );
  });

  it("allows a normal dotted name like resume.v2.pdf", () => {
    expect(validateResume({ name: "resume.v2.pdf", bytes: tinyPdf() }).ok).toBe(true);
  });
});

describe("safeFilename", () => {
  it("keeps the basename only and strips unsafe characters", () => {
    expect(safeFilename("../../etc/passwd/Résumé <1>.pdf", "pdf")).toBe("R_sum_ _1.pdf");
    expect(safeFilename("C:\\Users\\me\\cv.docx", "docx")).toBe("cv.docx");
  });
  it("limits length to 80 and falls back to resume", () => {
    expect(safeFilename(`${"a".repeat(200)}.pdf`, "pdf").length).toBeLessThanOrEqual(80);
    expect(safeFilename(".pdf", "pdf")).toBe("resume.pdf");
    expect(safeFilename("  .. .pdf", "pdf")).toBe("resume.pdf");
  });
  it("turns every inner dot into an underscore", () => {
    expect(safeFilename("a.exe .pdf", "pdf")).toBe("a_exe.pdf");
    expect(safeFilename("resume.v2.final.pdf", "pdf")).toBe("resume_v2_final.pdf");
    expect(safeFilename("x..y.pdf", "pdf")).not.toMatch(/\..*\./);
  });
  it("forces the validated extension", () => {
    expect(safeFilename("cv.exe", "pdf")).toBe("cv.pdf");
  });
});

describe("checkResumeMeta", () => {
  it("checks type and size without reading content", () => {
    expect(checkResumeMeta({ name: "a.pdf", size: 10 }).ok).toBe(true);
    expect(checkResumeMeta({ name: "a.png", size: 10 })).toEqual({
      ok: false,
      message: resumeMessages.type,
    });
    expect(checkResumeMeta({ name: "a.pdf", size: 0 })).toEqual({
      ok: false,
      message: resumeMessages.empty,
    });
  });
});
