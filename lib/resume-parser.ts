import { slugify, type Experience, type Project } from "./portfolio.ts";

export type ResumeImportDraft = {
  profile: {
    name?: string;
    role?: string;
    tagline?: string;
    about?: string;
    email?: string;
    location?: string;
    socials: Array<{ label: string; url: string }>;
  };
  experience: Experience[];
  projects: Project[];
  skills: string[];
};

type ResumeSection =
  | "header"
  | "summary"
  | "experience"
  | "projects"
  | "skills"
  | "ignore";

const SECTION_ALIASES: Record<string, ResumeSection> = {
  summary: "summary",
  profile: "summary",
  "professional summary": "summary",
  "career summary": "summary",
  objective: "summary",
  experience: "experience",
  "work experience": "experience",
  "professional experience": "experience",
  employment: "experience",
  "employment history": "experience",
  projects: "projects",
  "selected projects": "projects",
  "personal projects": "projects",
  "key projects": "projects",
  skills: "skills",
  "technical skills": "skills",
  technologies: "skills",
  "core skills": "skills",
  education: "ignore",
  certifications: "ignore",
  certification: "ignore",
  awards: "ignore",
  publications: "ignore",
  interests: "ignore",
};

const MONTH =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const PERIOD_RE = new RegExp(
  `(?:${MONTH}\\s+)?(?:19|20)\\d{2}\\s*(?:-|–|—|to)\\s*(?:Present|Current|(?:${MONTH}\\s+)?(?:19|20)\\d{2})`,
  "i"
);
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const URL_RE = /https?:\/\/[^\s)>\],]+/gi;

export function parseResumeText(value: string): ResumeImportDraft {
  const text = value.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").trim();
  if (!text) {
    throw new Error("No readable resume text was found.");
  }

  const sections = splitSections(text);
  const headerLines = nonEmpty(sections.header);
  const headerText = headerLines.join("\n");
  const email = headerText.match(EMAIL_RE)?.[0] || text.match(EMAIL_RE)?.[0];
  const urls = Array.from(new Set(headerText.match(URL_RE) || []));

  const headerCandidates = headerLines.filter(
    (line) => !EMAIL_RE.test(line) && !line.match(/^https?:\/\//i) && !looksLikePhone(line)
  );

  const name = headerCandidates.find((line) => line.length <= 80);
  const afterName = name
    ? headerCandidates.slice(headerCandidates.indexOf(name) + 1)
    : headerCandidates;
  const location = afterName.find(looksLikeLocation);
  const role = afterName.find(
    (line) => line !== location && line.length <= 120 && !PERIOD_RE.test(line)
  );

  const summary = cleanParagraph(sections.summary);
  const socials = urls.map((url) => ({
    label: socialLabel(url),
    url,
  }));

  const profile: ResumeImportDraft["profile"] = { socials };
  if (name) profile.name = name;
  if (role) profile.role = role;
  if (email) profile.email = email;
  if (location) profile.location = location;
  if (summary) {
    profile.about = summary;
    profile.tagline = firstSentence(summary, 180);
  }

  const experience = parseExperience(sections.experience);
  const projects = parseProjects(sections.projects);
  const skills = parseSkills(sections.skills);

  if (
    !profile.name &&
    !profile.email &&
    !profile.about &&
    experience.length === 0 &&
    projects.length === 0 &&
    skills.length === 0
  ) {
    throw new Error("No readable resume text was found.");
  }

  return { profile, experience, projects, skills };
}

function splitSections(text: string): Record<ResumeSection, string[]> {
  const result: Record<ResumeSection, string[]> = {
    header: [],
    summary: [],
    experience: [],
    projects: [],
    skills: [],
    ignore: [],
  };

  let current: ResumeSection = "header";

  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/[ \t]+/g, " ").trim();
    const heading = sectionHeading(line);
    if (heading) {
      current = heading;
      continue;
    }
    result[current].push(line);
  }

  return result;
}

function sectionHeading(line: string): ResumeSection | null {
  if (!line || line.length > 48) return null;
  const normalized = line
    .toLowerCase()
    .replace(/[:|]$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return SECTION_ALIASES[normalized] || null;
}

function parseExperience(lines: string[]): Experience[] {
  const clean = nonEmpty(lines).map(stripBullet);
  const periodIndexes = clean
    .map((line, index) => (PERIOD_RE.test(line) ? index : -1))
    .filter((index) => index >= 0);

  if (!periodIndexes.length) return [];

  const entries: Experience[] = [];

  for (let markerIndex = 0; markerIndex < periodIndexes.length; markerIndex += 1) {
    const periodIndex = periodIndexes[markerIndex];
    const periodLine = clean[periodIndex];
    const period = periodLine.match(PERIOD_RE)?.[0] || "";
    const beforePeriod = periodLine
      .replace(PERIOD_RE, "")
      .replace(/[|·,:-]+\s*$/, "")
      .trim();

    let companyIndex = -1;
    let company = "";
    let role = "";

    if (beforePeriod) {
      role = beforePeriod;
      companyIndex = periodIndex - 1;
      company = clean[companyIndex] || "";
    } else if (periodIndex >= 2) {
      companyIndex = periodIndex - 2;
      company = clean[companyIndex] || "";
      role = clean[periodIndex - 1] || "";
    } else if (periodIndex === 1) {
      companyIndex = 0;
      company = clean[0] || "";
    }

    if (!company && !role) continue;

    const nextPeriodIndex = periodIndexes[markerIndex + 1];
    let summaryEnd = clean.length;

    if (nextPeriodIndex !== undefined) {
      const nextPeriodLine = clean[nextPeriodIndex];
      const nextBeforePeriod = nextPeriodLine
        .replace(PERIOD_RE, "")
        .replace(/[|·,:-]+\s*$/, "")
        .trim();
      const nextCompanyIndex = nextBeforePeriod
        ? nextPeriodIndex - 1
        : Math.max(0, nextPeriodIndex - 2);
      summaryEnd = Math.max(periodIndex + 1, nextCompanyIndex);
    }

    const summary = clean
      .slice(periodIndex + 1, summaryEnd)
      .filter((line) => !line.match(/^https?:\/\//i))
      .join(" ")
      .trim();

    entries.push({
      id: `resume-experience-${slugify(`${company}-${role}-${period}`)}-${entries.length + 1}`,
      company,
      role,
      period,
      summary,
    });
  }

  return entries;
}

function parseProjects(lines: string[]): Project[] {
  const entries: Project[] = [];

  for (const [index, block] of blocks(lines).entries()) {
    const clean = block.map(stripBullet).filter(Boolean);
    if (clean.length < 2) continue;

    const title = clean[0];
    if (PERIOD_RE.test(title) || EMAIL_RE.test(title)) continue;

    const stackLine = clean.find((line) =>
      /^(?:stack|tech(?:nologies)?|built with)\s*:/i.test(line)
    );
    const stack = stackLine
      ? stackLine
          .replace(/^[^:]+:/, "")
          .split(/[,;|]/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const urls = clean.filter((line) => /^https?:\/\//i.test(line));
    const githubUrl = urls.find((url) => /github\.com/i.test(url));
    const liveUrl = urls.find((url) => !/github\.com/i.test(url));
    const description = clean
      .slice(1)
      .filter(
        (line) =>
          line !== stackLine &&
          !line.match(/^https?:\/\//i)
      )
      .join(" ")
      .trim();

    entries.push({
      id: `resume-project-${slugify(title)}-${index + 1}`,
      title,
      description,
      stack,
      githubUrl,
      liveUrl,
    });
  }

  return entries;
}

function parseSkills(lines: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of nonEmpty(lines)) {
    const value = line.replace(/^(?:skills?|technologies)\s*:\s*/i, "");
    for (const item of value.split(/[,;|•]/)) {
      const skill = stripBullet(item).trim();
      if (!skill || skill.length > 80) continue;
      const key = skill.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(skill);
    }
  }

  return result;
}

function blocks(lines: string[]): string[][] {
  const result: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      if (current.length) {
        result.push(current);
        current = [];
      }
      continue;
    }
    current.push(line);
  }

  if (current.length) result.push(current);
  return result;
}

function nonEmpty(lines: string[]) {
  return lines.map((line) => line.trim()).filter(Boolean);
}

function stripBullet(value: string) {
  return value.replace(/^[•●▪◦*-]+\s*/, "").trim();
}

function cleanParagraph(lines: string[]) {
  return nonEmpty(lines).map(stripBullet).join(" ").trim();
}

function firstSentence(value: string, max: number) {
  const match = value.match(/^.*?[.!?](?:\s|$)/);
  const sentence = (match?.[0] || value).trim();
  return sentence.length <= max
    ? sentence
    : `${sentence.slice(0, max - 1).trimEnd()}…`;
}

function looksLikePhone(value: string) {
  return /^\+?[\d()\s.-]{8,}$/.test(value.trim());
}

function looksLikeLocation(value: string) {
  const line = value.trim();
  if (!line || line.length > 80 || PERIOD_RE.test(line)) return false;
  return /,/.test(line) || /\b(?:India|USA|United States|UK|Remote)\b/i.test(line);
}

function socialLabel(url: string) {
  if (/github\.com/i.test(url)) return "GitHub";
  if (/linkedin\.com/i.test(url)) return "LinkedIn";
  if (/x\.com|twitter\.com/i.test(url)) return "X";
  return "Website";
}
