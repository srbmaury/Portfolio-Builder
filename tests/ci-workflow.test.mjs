import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflow = await readFile(
  new URL("../.github/workflows/ci.yml", import.meta.url),
  "utf8"
);

test("pull requests run only the build and e2e checks once", () => {
  assert.match(workflow, /push:\n\s+branches: \["main"\]/);
  assert.match(workflow, /pull_request:/);
  assert.doesNotMatch(workflow, /branches: \["\*\*"\]/);

  const jobsSection = workflow.slice(workflow.indexOf("jobs:\n") + 6);
  const jobs = [...jobsSection.matchAll(/^  ([a-z0-9_-]+):$/gm)].map(
    ([, job]) => job
  );
  assert.deepEqual(jobs, ["build", "e2e"]);
});
