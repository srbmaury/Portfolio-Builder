export const MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024;

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type ResumeFileMetadata = {
  name: string;
  type: string;
  size: number;
};

export type ResumeFileValidation =
  | { ok: true }
  | { ok: false; error: string };

export function validateResumeFileMetadata(
  file: ResumeFileMetadata
): ResumeFileValidation {
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === PDF_MIME || lowerName.endsWith(".pdf");
  const isDocx = file.type === DOCX_MIME || lowerName.endsWith(".docx");

  if (!isPdf && !isDocx) {
    return {
      ok: false,
      error: "Choose a PDF or DOCX resume.",
    };
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return {
      ok: false,
      error: "The resume file is empty.",
    };
  }

  if (file.size > MAX_RESUME_FILE_SIZE) {
    return {
      ok: false,
      error: "Resume files must be 5 MB or smaller.",
    };
  }

  return { ok: true };
}
