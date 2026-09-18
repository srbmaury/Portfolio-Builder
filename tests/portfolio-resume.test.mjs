import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  emptyBuilderState,
  normalizeBuilderState,
  sectionHasContent,
  snapshotForVariant,
} from "../lib/portfolio.ts";
import { cloudinaryUploadEndpoint } from "../lib/cloudinary.ts";

const cloudinarySource = await readFile(
  new URL("../lib/cloudinary.ts", import.meta.url),
  "utf8"
);
const rendererSource = await readFile(
  new URL("../components/PortfolioRenderer.tsx", import.meta.url),
  "utf8"
);
const launcherSource = await readFile(
  new URL("../components/ResumeModalLauncher.tsx", import.meta.url),
  "utf8"
).catch(() => "");
const publicPageSource = await readFile(
  new URL("../app/[username]/[portfolio]/page.tsx", import.meta.url),
  "utf8"
);
const publicRouteSource = await readFile(
  new URL("../app/api/public-resume/[portfolioId]/route.ts", import.meta.url),
  "utf8"
).catch(() => "");
const ownerRouteSource = await readFile(
  new URL("../app/api/resume/[variantKey]/route.ts", import.meta.url),
  "utf8"
).catch(() => "");
const builderSource = await readFile(
  new URL("../components/PortfolioBuilder.tsx", import.meta.url),
  "utf8"
);
const deliverySource = await readFile(
  new URL("../lib/resume-delivery.ts", import.meta.url),
  "utf8"
).catch(() => "");

test("portfolio variants have independent resume files with safe legacy defaults", () => {
  const legacy = structuredClone(emptyBuilderState);
  delete legacy.variants[0].resume;

  const normalized = normalizeBuilderState(legacy);

  assert.deepEqual(normalized.variants[0].resume, {
    url: "",
    publicId: "",
    fileName: "",
    showInHero: false,
  });
});

test("published snapshots include only the active portfolio resume settings", () => {
  const state = structuredClone(emptyBuilderState);
  state.variants[0].resume = {
    url: "https://res.cloudinary.com/demo/image/upload/v1/folioblocks/uploads/backend-resume.pdf",
    publicId: "folioblocks/uploads/backend-resume",
    fileName: "Saurabh_Backend_Resume.pdf",
    showInHero: true,
  };

  const snapshot = snapshotForVariant(state);

  assert.deepEqual(snapshot.meta?.resume, state.variants[0].resume);
});

test("resume section renders only when the active portfolio has a resume URL", () => {
  const state = structuredClone(emptyBuilderState);
  const resumeSection = {
    id: "resume",
    type: "resume",
    variant: "embed",
    visible: true,
    title: "Resume",
  };

  assert.equal(
    sectionHasContent(resumeSection, state.data, state.variants[0].resume),
    false
  );

  state.variants[0].resume = {
    url: "https://res.cloudinary.com/demo/image/upload/v1/folioblocks/uploads/resume.pdf",
    publicId: "folioblocks/uploads/resume",
    fileName: "Resume.pdf",
    showInHero: false,
  };

  assert.equal(
    sectionHasContent(resumeSection, state.data, state.variants[0].resume),
    true
  );
});

test("Cloudinary upload endpoint supports raw resume delivery", () => {
  assert.equal(
    cloudinaryUploadEndpoint("demo", "raw"),
    "https://api.cloudinary.com/v1_1/demo/raw/upload"
  );
  assert.match(cloudinarySource, /uploadToCloudinary[\s\S]*"raw"/);
});

test("public portfolio routes resume rendering through a published-only proxy", () => {
  assert.match(publicPageSource, /publicResumeUrl/);
  assert.match(rendererSource, /publicResumeUrl/);
  assert.match(publicRouteSource, /is_published/);
  assert.match(publicRouteSource, /published_snapshot/);
  assert.match(publicRouteSource, /loadResumePdf/);
  assert.match(deliverySource, /application\/pdf/);
  assert.match(deliverySource, /Content-Disposition/);
});

test("hero resume modal is opt-in and keyboard accessible", () => {
  assert.match(rendererSource, /showInHero/);
  assert.match(rendererSource, /ResumeModalLauncher/);
  assert.match(launcherSource, /role="dialog"/);
  assert.match(launcherSource, /aria-modal="true"/);
  assert.match(launcherSource, /Escape/);
  assert.match(launcherSource, /Open in new tab/);
});


test("builder preview proxies legacy saved resumes for the authenticated owner", () => {
  assert.match(ownerRouteSource, /auth\.getUser\(\)/);
  assert.match(ownerRouteSource, /resume_config/);
  assert.match(ownerRouteSource, /variant_key/);
  assert.match(builderSource, /builderResumeUrl/);
  assert.match(builderSource, /\/api\/resume\//);
  assert.match(rendererSource, /value\.startsWith\("\/api\/resume\/"\)/);
  assert.match(builderSource, /openUrl=\{builderResumeUrl\}/);
});

test("resume delivery rejects non-PDF upstream payloads", () => {
  assert.match(deliverySource, /%PDF-/);
  assert.match(deliverySource, /Resume source did not return a PDF/);
  assert.match(deliverySource, /Cache-Control": "no-store"/);
});
