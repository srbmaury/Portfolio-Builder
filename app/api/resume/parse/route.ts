import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { parseOffice } from "officeparser";
import { parseResumeText } from "@/lib/resume-parser";
import { extractResumeWithAi } from "@/lib/resume-ai";
import {
  MAX_RESUME_FILE_SIZE,
  validateResumeFileMetadata,
} from "@/lib/resume-upload";

export const runtime = "nodejs";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type OfficeParserFailure = Error & {
  officeIssue?: {
    code?: string;
    severity?: string;
  };
};

export async function POST(request: Request) {
  let uploadedFile: File | null = null;

  try {
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_RESUME_FILE_SIZE + 1024 * 1024
    ) {
      return NextResponse.json(
        { error: "Resume files must be 5 MB or smaller." },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const value = formData.get("file");

    if (!(value instanceof File)) {
      return NextResponse.json(
        { error: "Choose a resume file to import." },
        { status: 400 }
      );
    }

    uploadedFile = value;

    const validation = validateResumeFileMetadata(value);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Give officeparser a Node Buffer and an explicit format. This avoids
    // relying on the framework's multipart File implementation or runtime
    // magic-byte detection after Next has compiled the route.
    const fileType =
      value.type === DOCX_MIME || value.name.toLowerCase().endsWith(".docx")
        ? "docx"
        : "pdf";
    const bytes = Buffer.from(await value.arrayBuffer());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const ast = await parseOffice(bytes, {
      abortSignal: controller.signal,
      fileType,
    }).finally(() => clearTimeout(timeout));

    const rendered = await ast.to("text", {
      includeImages: false,
      textConfig: {
        preserveLayout: false,
        renderNotes: false,
      },
    });
    const text = String(rendered.value || "").trim();

    if (!text) {
      return NextResponse.json(
        { error: "No readable resume text was found." },
        { status: 422 }
      );
    }

    return NextResponse.json({ draft: await draftFromText(text) });
  } catch (error) {
    const parserError = error as OfficeParserFailure;
    console.error("[resume/parse] Resume parsing failed", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      officeIssueCode: parserError?.officeIssue?.code,
      officeIssueSeverity: parserError?.officeIssue?.severity,
      fileType: uploadedFile?.type || undefined,
      fileSize: uploadedFile?.size || undefined,
    });

    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Resume parsing took too long. Try a smaller or simpler PDF/DOCX file."
        : error instanceof Error && /readable resume text/i.test(error.message)
          ? error.message
          : "We could not read that resume. Try another PDF or DOCX file.";

    return NextResponse.json({ error: message }, { status: 422 });
  }
}

// Layout is already gone by the time the text reaches us, which is what the
// deterministic parser keeps getting wrong on two-column resumes. When a
// GEMINI_API_KEY is configured the model reads the text instead; the parser
// stays as the fallback for an unset key, a failed call, or an empty result.
async function draftFromText(text: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    const draft = await extractResumeWithAi(text, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    if (draft) return draft;
  } catch (error) {
    console.error("AI resume extraction failed, using the parser", error);
  }

  return parseResumeText(text);
}
