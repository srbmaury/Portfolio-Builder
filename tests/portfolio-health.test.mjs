import test from "node:test";
import assert from "node:assert/strict";

import { emptyBuilderState } from "../lib/portfolio.ts";
import { analyzePortfolioHealth } from "../lib/portfolio-health.ts";

test("health checker finds blocking gaps in an empty portfolio", () => {
  const state = structuredClone(emptyBuilderState);
  const report = analyzePortfolioHealth(state);

  assert.equal(report.status, "needs-attention");
  assert.ok(report.counts.error >= 3);
  assert.ok(report.issues.some((item) => item.id === "profile-name"));
  assert.ok(report.issues.some((item) => item.id === "target-role"));
  assert.ok(report.issues.some((item) => item.id === "projects-targeting"));
  assert.ok(report.issues.some((item) => item.id === "contact"));
});

test("health checker accepts a complete targeted portfolio", () => {
  const state = structuredClone(emptyBuilderState);
  const variant = state.variants[0];

  state.data.profile = {
    name: "Saurabh Maurya",
    role: "Backend Engineer",
    tagline: "Backend engineer building reliable distributed systems.",
    about: "I build scalable backend and platform systems.",
    email: "saurabh@example.com",
    location: "India",
    availability: "Open to opportunities",
    heroImageUrl: "https://res.cloudinary.com/demo/image/upload/hero.png",
    socials: [
      { label: "GitHub", url: "https://github.com/srbmaury" },
    ],
  };
  state.data.experience = [
    {
      id: "exp-1",
      company: "Example",
      role: "Software Engineer",
      period: "2024 — Present",
      summary: "Built reliable services.",
    },
  ];
  state.data.projects = [
    {
      id: "project-1",
      title: "Project",
      description: "A production-ready backend project.",
      stack: ["Java", "PostgreSQL"],
      imageUrl: "https://res.cloudinary.com/demo/image/upload/project.png",
      githubUrl: "https://github.com/srbmaury/project",
      liveUrl: "https://example.com",
    },
  ];
  state.data.skills = ["Java", "PostgreSQL"];

  variant.name = "Backend";
  variant.targetRole = "Backend Engineer";
  variant.content.experienceIds = ["exp-1"];
  variant.content.projectIds = ["project-1"];
  variant.content.skills = ["Java", "PostgreSQL"];
  variant.resume.url = "https://res.cloudinary.com/demo/image/upload/resume.pdf";

  const report = analyzePortfolioHealth(state);
  assert.equal(report.counts.error, 0);
  assert.equal(report.counts.warning, 0);
  assert.equal(report.status, "ready");
});

test("health checker flags broken project links and image-led layouts", () => {
  const state = structuredClone(emptyBuilderState);
  const variant = state.variants[0];

  state.data.profile.name = "Saurabh";
  state.data.profile.role = "Engineer";
  state.data.profile.tagline = "Engineer";
  state.data.profile.about = "About";
  state.data.profile.email = "saurabh@example.com";
  state.data.projects = [
    {
      id: "project-1",
      title: "Project",
      description: "Description",
      stack: ["TypeScript"],
      githubUrl: "not-a-url",
    },
  ];

  variant.name = "General";
  variant.targetRole = "Engineer";
  variant.content.projectIds = ["project-1"];
  variant.config.sections.find((section) => section.id === "projects").variant =
    "image-grid";
  variant.config.sections.find((section) => section.id === "experience").visible =
    false;
  variant.config.sections.find((section) => section.id === "skills").visible =
    false;
  variant.config.sections.find((section) => section.id === "resume").visible =
    false;

  const report = analyzePortfolioHealth(state);
  assert.ok(
    report.issues.some((item) => item.id === "project-invalid-link-project-1")
  );
  assert.ok(report.issues.some((item) => item.id === "project-images"));
});
