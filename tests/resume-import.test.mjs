import test from "node:test";
import assert from "node:assert/strict";

import { emptyBuilderState } from "../lib/portfolio.ts";
import { parseResumeText } from "../lib/resume-parser.ts";
import { mergeResumeImport } from "../lib/resume-import.ts";

test("resume parser extracts profile, experience, projects, links, and skills", () => {
  const draft = parseResumeText(`
Saurabh Maurya
Backend Engineer
Hyderabad, India
saurabh@example.com
https://github.com/srbmaury

SUMMARY
Backend engineer building distributed systems and reliable platforms.

EXPERIENCE
Salesforce
Associate Member of Technical Staff | Jun 2024 - Present
- Built metadata dependency extraction.
- Improved deployment reliability.

Razorpay
Software Engineer Intern | May 2023 - Jul 2023
- Built Grafana dashboards and Prometheus alerting.

PROJECTS
Ecommerce Search
Personalized product search and recommendation platform.
Stack: Flask, PostgreSQL, Redis
https://github.com/srbmaury/Ecommerce-Search

SKILLS
Java, Distributed Systems, PostgreSQL, Redis
`);

  assert.equal(draft.profile.name, "Saurabh Maurya");
  assert.equal(draft.profile.role, "Backend Engineer");
  assert.equal(draft.profile.email, "saurabh@example.com");
  assert.equal(draft.profile.location, "Hyderabad, India");
  assert.match(draft.profile.about || "", /distributed systems/i);
  assert.equal(draft.profile.socials[0]?.label, "GitHub");

  assert.equal(draft.experience.length, 2);
  assert.equal(draft.experience[0].company, "Salesforce");
  assert.equal(draft.experience[0].role, "Associate Member of Technical Staff");
  assert.equal(draft.experience[0].period, "Jun 2024 - Present");
  assert.match(draft.experience[0].summary, /metadata dependency extraction/i);

  assert.equal(draft.projects.length, 1);
  assert.equal(draft.projects[0].title, "Ecommerce Search");
  assert.deepEqual(draft.projects[0].stack, ["Flask", "PostgreSQL", "Redis"]);
  assert.match(draft.projects[0].githubUrl || "", /Ecommerce-Search/);

  assert.deepEqual(draft.skills, [
    "Java",
    "Distributed Systems",
    "PostgreSQL",
    "Redis",
  ]);
});

test("resume merge de-duplicates shared content and targets only new imports in active variant", () => {
  const state = structuredClone(emptyBuilderState);
  state.data.profile.availability = "Open to backend roles";
  state.data.profile.heroImageUrl = "https://res.cloudinary.com/demo/image/upload/hero.png";
  state.data.profile.socials = [
    { label: "GitHub", url: "https://github.com/srbmaury" },
  ];
  state.data.experience = [
    {
      id: "experience-salesforce",
      company: "Salesforce",
      role: "Associate Member of Technical Staff",
      period: "Jun 2024 - Present",
      summary: "Existing summary",
    },
  ];
  state.data.skills = ["Java"];
  state.variants[0].content.experienceIds = ["experience-salesforce"];
  state.variants[0].content.skills = ["Java"];

  const next = mergeResumeImport(state, {
    profile: {
      name: "Saurabh Maurya",
      role: "Backend Engineer",
      email: "saurabh@example.com",
      socials: [
        { label: "GitHub", url: "https://github.com/srbmaury" },
        { label: "LinkedIn", url: "https://linkedin.com/in/srbmaury" },
      ],
    },
    experience: [
      {
        id: "import-salesforce",
        company: "Salesforce",
        role: "Associate Member of Technical Staff",
        period: "Jun 2024 - Present",
        summary: "Imported duplicate",
      },
      {
        id: "import-razorpay",
        company: "Razorpay",
        role: "Software Engineer Intern",
        period: "May 2023 - Jul 2023",
        summary: "Built payment observability.",
      },
    ],
    projects: [],
    skills: ["java", "Redis"],
  });

  assert.equal(next.data.profile.name, "Saurabh Maurya");
  assert.equal(next.data.profile.role, "Backend Engineer");
  assert.equal(next.data.profile.availability, "Open to backend roles");
  assert.equal(
    next.data.profile.heroImageUrl,
    "https://res.cloudinary.com/demo/image/upload/hero.png"
  );
  assert.equal(next.data.profile.socials.length, 2);

  assert.equal(next.data.experience.length, 2);
  const razorpay = next.data.experience.find((item) => item.company === "Razorpay");
  assert.ok(razorpay);
  assert.ok(next.variants[0].content.experienceIds.includes(razorpay.id));

  assert.deepEqual(next.data.skills, ["Java", "Redis"]);
  assert.deepEqual(next.variants[0].content.skills, ["Java", "Redis"]);
});

test("resume parser rejects empty text", () => {
  assert.throws(() => parseResumeText("   \n\t"), /readable resume text/i);
});
