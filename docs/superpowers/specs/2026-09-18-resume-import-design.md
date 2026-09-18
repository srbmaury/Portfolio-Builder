# Resume Import Design

Date: 2026-09-18

## Scope

Add a resume-import workflow to FolioBlocks. This change is intentionally limited to resume upload, structured extraction, review, and applying the result to the existing shared portfolio content. It does not add JSON editing, custom sections, AI job tailoring, analytics, or new persistence tables.

## User flow

1. In the Content tab, the user sees an **Import resume** action near the shared-profile intro.
2. The user uploads a PDF or DOCX resume.
3. FolioBlocks extracts text on the server and converts it into a structured draft containing:
   - profile: name, role/headline, email, location, about/summary, links
   - experience
   - projects
   - skills
4. FolioBlocks opens a review dialog before modifying the workspace.
5. The user can:
   - edit extracted text fields
   - remove incorrectly detected experience/project entries
   - deselect sections they do not want to import
6. Clicking **Apply to portfolio** merges the reviewed data into the existing shared profile.
7. Imported experience, projects, and skills are automatically included in the currently active portfolio variant.
8. Nothing is written to Supabase until the user uses the existing Save/Publish flow.

## Architecture

### Client

Add a focused `ResumeImportDialog` used from `PortfolioBuilder`.

Responsibilities:
- file selection and validation
- multipart upload to the resume parsing endpoint
- loading/error states
- editable review state
- apply/cancel actions

The dialog receives the current builder state only when applying the reviewed result. Parsing remains independent from the builder state.

### Server endpoint

Add `POST /api/resume/parse`.

Responsibilities:
- accept one PDF or DOCX file
- reject unsupported type or files above the configured size limit
- extract plain text
- run deterministic parsing into a normalized resume draft
- return JSON only

No resume file is persisted after parsing.

### Parsing

Use server-side libraries:
- PDF: `pdf-parse`
- DOCX: `mammoth`

A separate `lib/resume-parser.ts` converts extracted text into FolioBlocks-compatible structured data.

Parsing is heuristic and deterministic, not LLM-backed. It recognizes common headings such as Experience, Work Experience, Projects, Skills, Summary, Education, and links/contact lines.

The parser should prefer under-extraction to inventing data. Unknown text is not silently mapped to profile fields.

## Data contract

The parser returns a draft separate from `PortfolioData` so the review UI can represent partial extraction.

```ts
type ResumeImportDraft = {
  profile: {
    name?: string;
    role?: string;
    tagline?: string;
    about?: string;
    email?: string;
    location?: string;
    socials: Array<{ label: string; url: string }>;
  };
  experience: Array<{
    id: string;
    company: string;
    role: string;
    period: string;
    summary: string;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    stack: string[];
    githubUrl?: string;
    liveUrl?: string;
  }>;
  skills: string[];
};
```

## Merge behavior

Applying an import does not blindly replace the whole workspace.

- Non-empty reviewed profile fields replace the corresponding existing profile fields.
- Existing hero image and availability remain unchanged unless explicitly present in the future; the first version does not derive them from a resume.
- Imported social links are merged by URL and label without duplicates.
- Imported experience and projects are appended, while obvious duplicates are removed using normalized company/role/period and title comparisons.
- Skills are unioned case-insensitively while preserving readable spelling.
- New imported experience/project IDs are included in the active variant.
- Imported skills are included in the active variant.
- Other portfolio variants keep their current targeting selections.
- Existing design, branding, section ordering, and publishing state are untouched.

## Error handling

- Unsupported file: clear validation message before upload when possible.
- Oversized file: client and server validation.
- Empty/unreadable resume: return a user-facing parse error.
- Sparse extraction: show the review dialog with the fields that were found rather than failing.
- Parse endpoint must not expose stack traces to the client.

## Security and privacy

- Parsing happens in memory.
- Resume files are not stored in Supabase, Cloudinary, or the filesystem.
- File type and size are validated server-side.
- The endpoint does not require authentication because local-only builder users should still be able to import; it performs no persistence and returns only data derived from the uploaded file.
- The endpoint accepts only PDF/DOCX.

## Testing

Add tests for:
- section detection and contact extraction
- experience/project/skills parsing
- duplicate-safe merge behavior
- active-variant targeting after import
- unsupported/empty input handling
- legacy builder state remains unchanged by normalization

Run:
- `npm test`
- `npm run typecheck`
- `npm run build`

## Files expected to change

- `components/PortfolioBuilder.tsx`
- `components/ResumeImportDialog.tsx` (new)
- `lib/resume-parser.ts` (new)
- `lib/resume-import.ts` (new merge helper)
- `app/api/resume/parse/route.ts` (new)
- `app/globals.css`
- `package.json` / lockfile
- tests for parser and merge behavior

No Supabase migration is required.
