import { NextResponse } from "next/server";
import { OfficeParser } from "officeparser";
import { parseResumeText } from "@/lib/resume-parser";
import {
  MAX_RESUME_FILE_SIZE,
  validateResumeFileMetadata,
} from "@/lib/resume-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

    const validation = validateResumeFileMetadata(value);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const ast = await OfficeParser.parseOffice(value, {
      abortSignal: controller.signal,
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

    return NextResponse.json({ draft: parseResumeText(text) });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Resume parsing took too long. Try a smaller or simpler PDF/DOCX file."
        : error instanceof Error && /readable resume text/i.test(error.message)
          ? error.message
          : "We could not read that resume. Try another PDF or DOCX file.";

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
