import { expect, test } from "@playwright/test";

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

// officeparser only treats a vertical jump as a line break once the gap is
// clearly wider than the font size. At 11pt text a 16pt leading falls below
// that threshold, so every line arrives joined by spaces instead. The resume
// parser is line-based, so the fixture has to clear the threshold to exercise
// anything past the email regex.
const LINE_GAP = 24;

function buildTextPdf(lines: string[]) {
  const commands = [
    "BT",
    "/F1 11 Tf",
    "72 740 Td",
    ...lines.flatMap((line, index) => [
      `(${escapePdfText(line)}) Tj`,
      ...(index < lines.length - 1 ? [`0 -${LINE_GAP} Td`] : []),
    ]),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(commands, "ascii")} >>\nstream\n${commands}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets[index + 1] = Buffer.byteLength(pdf, "ascii");
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "ascii");
}

test("resume parse API extracts a real PDF into an editable draft", async ({
  request,
}) => {
  const pdf = buildTextPdf([
    "Saurabh Maurya",
    "Backend Engineer",
    "Hyderabad, India",
    "saurabh@example.com",
    "SUMMARY",
    "Backend engineer building reliable platforms.",
    "SKILLS",
    "Java, Redis",
  ]);

  const response = await request.post("/api/resume/parse", {
    multipart: {
      file: {
        name: "resume.pdf",
        mimeType: "application/pdf",
        buffer: pdf,
      },
    },
  });

  const payload = await response.json();

  expect(response.status(), JSON.stringify(payload)).toBe(200);
  expect(payload.draft.profile.name).toBe("Saurabh Maurya");
  expect(payload.draft.profile.email).toBe("saurabh@example.com");
  expect(payload.draft.skills).toEqual(["Java", "Redis"]);
});
