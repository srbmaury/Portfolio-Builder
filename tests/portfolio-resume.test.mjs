import test from "node:test";
import assert from "node:assert/strict";

import {
  emptyBuilderState,
  normalizeBuilderState,
  sectionHasContent,
  snapshotForVariant,
} from "../lib/portfolio.ts";

test("portfolio variants have independent resume files with safe legacy defaults", () => {
  const legacy = structuredClone(emptyBuilderState);
  delete legacy.variants[0].resume;

  const normalized = normalizeBuilderState(legacy);

  assert.deepEqual(normalized.variants[0].resume, {
    url: "",
    publicId: "",
    fileName: "",
  });
});

test("published snapshots include only the active portfolio resume", () => {
  const state = structuredClone(emptyBuilderState);
  state.variants[0].resume = {
    url: "https://res.cloudinary.com/demo/image/upload/v1/folioblocks/uploads/backend-resume.pdf",
    publicId: "folioblocks/uploads/backend-resume",
    fileName: "Saurabh_Backend_Resume.pdf",
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
  };

  assert.equal(
    sectionHasContent(resumeSection, state.data, state.variants[0].resume),
    true
  );
});
