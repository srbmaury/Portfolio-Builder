import { NextResponse } from "next/server";
import { OfficeParser } from "officeparser";
import { parseResumeText } from "@/lib/resume-parser";
import { validateResumeFileMetadata } from "@/lib/resume-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
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

    const ast = await OfficeParser.parseOffice(value);
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
      error instanceof Error &&
      /readable resume text/i.test(error.message)
        ? error.message
        : "We could not read that resume. Try another PDF or DOCX file.";

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
