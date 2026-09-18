import test from "node:test";
import assert from "node:assert/strict";

import { selectOrphanedTargetContent } from "../lib/portfolio-cleanup.ts";

test("portfolio deletion selects only target content unused by remaining portfolios", () => {
  const result = selectOrphanedTargetContent(
    {
      experienceIds: ["exp-shared", "exp-target"],
      projectIds: ["project-shared", "project-target"],
      skills: ["Java", "Redis"],
    },
    [
      {
        experienceIds: ["exp-shared"],
        projectIds: ["project-shared"],
        skills: ["Java", "PostgreSQL"],
      },
    ]
  );

  assert.deepEqual(result, {
    experienceIds: ["exp-target"],
    projectIds: ["project-target"],
    skills: ["Redis"],
  });
});

test("last portfolio deletion selects every targeted content item", () => {
  const result = selectOrphanedTargetContent(
    {
      experienceIds: ["exp-a"],
      projectIds: ["project-a"],
      skills: ["Java"],
    },
    []
  );

  assert.deepEqual(result, {
    experienceIds: ["exp-a"],
    projectIds: ["project-a"],
    skills: ["Java"],
  });
});
