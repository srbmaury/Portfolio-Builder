import { slugify, type Experience, type Project } from "./portfolio.ts";
import type { ResumeImportDraft } from "./resume-parser.ts";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
// gemini-2.5-flash returns 404 "no longer available to new users" on keys
// issued recently. gemini-3.6-flash is current but was serving a steady 503
// ("experiencing high demand") when this was wired up, so the default is the
// sibling that answers reliably. GEMINI_MODEL overrides it.
const DEFAULT_MODEL = "gemini-3.5-flash";

// A resume is small; the cap only guards against a pathological upload.
const MAX_INPUT_CHARS = 24_000;

const MAX_ATTEMPTS = 3;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    profile: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING" },
        role: { type: "STRING" },
        about: { type: "STRING" },
        email: { type: "STRING" },
        location: { type: "STRING" },
        socials: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: { label: { type: "STRING" }, url: { type: "STRING" } },
            required: ["label", "url"],
          },
        },
      },
      required: ["socials"],
    },
    experience: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          company: { type: "STRING" },
          role: { type: "STRING" },
          period: { type: "STRING" },
          summary: { type: "STRING" },
        },
        required: ["company", "role", "period", "summary"],
      },
    },
    projects: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          description: { type: "STRING" },
          stack: { type: "ARRAY", items: { type: "STRING" } },
          githubUrl: { type: "STRING" },
          liveUrl: { type: "STRING" },
        },
        required: ["title", "description", "stack"],
      },
    },
    skills: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["profile", "experience", "projects", "skills"],
} as const;

// The failures this is here to absorb all come from the same place: a PDF is
// extracted as one flat stream, so a two-column layout interleaves sections,
// wraps lists mid-item and drops the blank lines that separated entries.
const INSTRUCTIONS = `You extract structured data from a resume.

The text comes from a PDF or DOCX and has already lost its layout. Expect:
- Two columns flattened together, so a date or heading can sit in the middle
  of an unrelated section. Attach each value to the entry it belongs to.
- Lists wrapped mid-item, so "feature" and "engineering" may be split across
  lines and are one skill.
- Inline category labels like "Languages: Python, Java Tools: Docker". The
  label is not a skill; the values after it are.
- Missing blank lines between entries, so consecutive roles or projects run
  together. Each job is one experience entry; each project is one project.

Rules:
- Copy wording from the resume. Do not invent, summarise or embellish.
- Omit a field entirely rather than guessing at it.
- company is the employer. role is the job title. Do not swap them.
- skills are individual technologies or competencies, never category labels,
  dates or section headings.
- Return only the person's own contact links as socials, not project links.`;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function httpUrl(value: unknown): string | undefined {
  const candidate = str(value, 300);
  if (!candidate) return undefined;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  // A resume prints "linkedin.com/in/name", not the scheme. Rejecting those
  // outright drops every social link the model correctly found.
  return /^[\w-]+(\.[\w-]+)+\//.test(candidate)
    ? `https://${candidate}`
    : undefined;
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(signal?.reason);
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function isAiResumeExtractionConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function normalizeAiDraft(payload: unknown): ResumeImportDraft {
  const root = asRecord(payload);
  const profileRaw = asRecord(root.profile);

  const socials: Array<{ label: string; url: string }> = [];
  for (const entry of asArray(profileRaw.socials)) {
    const record = asRecord(entry);
    const url = httpUrl(record.url);
    const label = str(record.label, 40);
    if (url && label && !socials.some((social) => social.url === url)) {
      socials.push({ label, url });
    }
  }

  const experience: Experience[] = [];
  for (const entry of asArray(root.experience)) {
    const record = asRecord(entry);
    const company = str(record.company, 120) || "";
    const role = str(record.role, 160) || "";
    if (!company && !role) continue;
    const period = str(record.period, 60) || "";
    experience.push({
      id: `resume-experience-${slugify(`${company}-${role}-${period}`)}-${experience.length + 1}`,
      company,
      role,
      period,
      summary: str(record.summary, 1200) || "",
    });
  }

  const projects: Project[] = [];
  for (const entry of asArray(root.projects)) {
    const record = asRecord(entry);
    const title = str(record.title, 140);
    if (!title) continue;
    const stack: string[] = [];
    for (const item of asArray(record.stack)) {
      const value = str(item, 80);
      if (value && !stack.some((seen) => seen.toLowerCase() === value.toLowerCase())) {
        stack.push(value);
      }
    }
    projects.push({
      id: `resume-project-${slugify(title)}-${projects.length + 1}`,
      title,
      description: str(record.description, 1200) || "",
      stack,
      githubUrl: httpUrl(record.githubUrl),
      liveUrl: httpUrl(record.liveUrl),
    });
  }

  const skills: string[] = [];
  const seenSkills = new Set<string>();
  for (const item of asArray(root.skills)) {
    const skill = str(item, 80);
    if (!skill) continue;
    const key = skill.toLowerCase();
    if (seenSkills.has(key)) continue;
    seenSkills.add(key);
    skills.push(skill);
  }

  const email = str(profileRaw.email, 160);

  return {
    profile: {
      name: str(profileRaw.name, 120),
      role: str(profileRaw.role, 160),
      about: str(profileRaw.about, 1200),
      email: email && /.+@.+\..+/.test(email) ? email : undefined,
      location: str(profileRaw.location, 120),
      socials,
    },
    experience,
    projects,
    skills,
  };
}

export function isDraftEmpty(draft: ResumeImportDraft) {
  return (
    !draft.profile.name &&
    !draft.profile.email &&
    draft.experience.length === 0 &&
    draft.projects.length === 0 &&
    draft.skills.length === 0
  );
}

/**
 * Returns null when no API key is configured, so the caller falls back to the
 * deterministic parser. Throws when the call fails or comes back unusable,
 * which the caller also treats as a reason to fall back.
 */
export async function extractResumeWithAi(
  text: string,
  options: { signal?: AbortSignal } = {}
): Promise<ResumeImportDraft | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const url = `${ENDPOINT}/${encodeURIComponent(model)}:generateContent`;

  const request = {
      method: "POST",
      signal: options.signal,
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: INSTRUCTIONS }] },
        contents: [{ role: "user", parts: [{ text: text.slice(0, MAX_INPUT_CHARS) }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          // Extraction is copying, not reasoning, and the thinking budget is
          // what pushed this past the request timeout.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
  };

  // The free tier returns 503 often enough that falling straight back to the
  // parser would waste most calls. A 4xx will not clear, so it is not retried.
  let response = await fetch(url, request);
  for (let attempt = 1; attempt < MAX_ATTEMPTS && !response.ok; attempt += 1) {
    if (response.status < 500) break;
    await delay(400 * 2 ** (attempt - 1), options.signal);
    response = await fetch(url, request);
  }

  if (!response.ok) {
    throw new Error(
      `Gemini resume extraction failed with ${response.status} ${response.statusText}`
    );
  }

  const body = asRecord(await response.json());
  const candidate = asRecord(asArray(body.candidates)[0]);
  const part = asRecord(asArray(asRecord(candidate.content).parts)[0]);
  const raw = typeof part.text === "string" ? part.text : "";

  if (!raw.trim()) {
    throw new Error("Gemini resume extraction returned no content");
  }

  const draft = normalizeAiDraft(JSON.parse(raw));

  if (isDraftEmpty(draft)) {
    throw new Error("Gemini resume extraction returned an empty draft");
  }

  return draft;
}
