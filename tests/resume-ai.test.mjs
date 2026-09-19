import test from "node:test";
import assert from "node:assert/strict";

import {
  extractResumeWithAi,
  isAiResumeExtractionConfigured,
  normalizeAiDraft,
} from "../lib/resume-ai.ts";

function withEnv(key, value, run) {
  const previous = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
  return (async () => {
    try {
      return await run();
    } finally {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    }
  })();
}

function stubFetch(handler) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return handler(url, init);
  };
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

function geminiResponse(payload) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    async json() {
      return {
        candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
      };
    },
  };
}

test("extraction is skipped when no API key is configured", async () => {
  await withEnv("GEMINI_API_KEY", undefined, async () => {
    const fetchStub = stubFetch(() => {
      throw new Error("must not call the API without a key");
    });
    try {
      assert.equal(isAiResumeExtractionConfigured(), false);
      assert.equal(await extractResumeWithAi("Saurabh Maurya"), null);
      assert.equal(fetchStub.calls.length, 0);
    } finally {
      fetchStub.restore();
    }
  });
});

test("a model response becomes a draft with ids, keeping role and company apart", async () => {
  await withEnv("GEMINI_API_KEY", "test-key", async () => {
    const fetchStub = stubFetch(() =>
      geminiResponse({
        profile: {
          name: "Saurabh Maurya",
          role: "AI Engineer",
          email: "saurabh@example.com",
          socials: [{ label: "GitHub", url: "https://github.com/srbmaury" }],
        },
        experience: [
          {
            company: "Salesforce",
            role: "Associate Member of Technical Staff",
            period: "Jun 2024 - Present",
            summary: "Built an LLM-powered developer agent.",
          },
        ],
        projects: [
          {
            title: "Chess ML Coach",
            description: "End-to-end ML pipeline.",
            stack: ["Python", "LightGBM"],
          },
          {
            title: "ML-Powered E-commerce Search Engine",
            description: "Learning-to-rank search.",
            stack: ["Flask", "Redis/RQ"],
          },
        ],
        skills: ["Python", "Java"],
      })
    );

    try {
      const draft = await extractResumeWithAi("...resume text...");

      assert.equal(draft.profile.name, "Saurabh Maurya");
      assert.equal(draft.experience[0].company, "Salesforce");
      assert.equal(
        draft.experience[0].role,
        "Associate Member of Technical Staff"
      );
      assert.equal(draft.projects.length, 2, "each project stays its own entry");
      assert.deepEqual(draft.skills, ["Python", "Java"]);

      assert.match(draft.experience[0].id, /^resume-experience-/);
      assert.match(draft.projects[1].id, /^resume-project-/);
      assert.notEqual(draft.projects[0].id, draft.projects[1].id);

      const [call] = fetchStub.calls;
      const body = JSON.parse(call.init.body);
      assert.equal(call.init.headers["x-goog-api-key"], "test-key");
      assert.equal(body.generationConfig.responseMimeType, "application/json");
      assert.equal(body.generationConfig.temperature, 0);
      assert.ok(body.generationConfig.responseSchema, "a schema is requested");
    } finally {
      fetchStub.restore();
    }
  });
});

test("a failed call and an empty result both raise, so the caller can fall back", async () => {
  await withEnv("GEMINI_API_KEY", "test-key", async () => {
    let failing = stubFetch(() => ({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      async json() {
        return {};
      },
    }));
    try {
      await assert.rejects(() => extractResumeWithAi("text"), /429/);
    } finally {
      failing.restore();
    }

    const empty = stubFetch(() =>
      geminiResponse({ profile: { socials: [] }, experience: [], projects: [], skills: [] })
    );
    try {
      await assert.rejects(() => extractResumeWithAi("text"), /empty draft/i);
    } finally {
      empty.restore();
    }
  });
});

test("malformed model output is hardened rather than trusted", () => {
  const draft = normalizeAiDraft({
    profile: {
      name: "  Saurabh   Maurya ",
      email: "not-an-email",
      socials: [
        { label: "GitHub", url: "javascript:alert(1)" },
        { label: "Site", url: "https://example.com" },
        { label: "Dupe", url: "https://example.com" },
        "nonsense",
      ],
    },
    experience: [{ company: "", role: "", period: "2024", summary: "x" }],
    projects: [{ description: "no title so it is dropped", stack: "not-an-array" }],
    skills: ["Java", "java", 42, "   ", "Redis"],
  });

  assert.equal(draft.profile.name, "Saurabh Maurya", "whitespace is collapsed");
  assert.equal(draft.profile.email, undefined, "a bad email is dropped");
  assert.deepEqual(
    draft.profile.socials,
    [{ label: "Site", url: "https://example.com" }],
    "only http(s) links survive, de-duplicated"
  );
  assert.equal(draft.experience.length, 0, "an entry with no company or role is dropped");
  assert.equal(draft.projects.length, 0, "a project with no title is dropped");
  assert.deepEqual(draft.skills, ["Java", "Redis"], "non-strings and repeats are dropped");
});
