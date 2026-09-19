import test from "node:test";
import assert from "node:assert/strict";

import { Webhook } from "standardwebhooks";
import { createAuthEmailHandler } from "../supabase/functions/send-email/handler.ts";

const secret = `whsec_${Buffer.from(
  "01234567890123456789012345678901",
).toString("base64")}`;
const env = new Map([
  ["SEND_EMAIL_HOOK_SECRET", `v1,${secret}`],
  ["SUPABASE_URL", "https://project.supabase.co"],
  ["BREVO_API_KEY", "api-key"],
  ["BREVO_SENDER_EMAIL", "contact@example.com"],
  ["BREVO_SENDER_NAME", "DevFolioX"],
]);
const hookPayload = {
  user: { email: "person@example.com" },
  email_data: {
    token: "123456",
    token_hash: "signup-hash",
    token_new: "",
    token_hash_new: "",
    redirect_to: "https://devfoliox.example/auth/callback?next=/builder",
    email_action_type: "signup",
    site_url: "https://devfoliox.example",
  },
};

function signedRequest(payload, signingSecret = secret) {
  const body = JSON.stringify(payload);
  const timestamp = new Date();
  const webhook = new Webhook(signingSecret);
  const headers = {
    "content-type": "application/json",
    "webhook-id": "msg_test",
    "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "webhook-signature": webhook.sign("msg_test", timestamp, body),
  };

  return new Request("https://function.example/send-email", {
    method: "POST",
    body,
    headers,
  });
}

test("requires POST and a valid Standard Webhooks signature", async () => {
  const handler = createAuthEmailHandler({
    getEnv: (name) => env.get(name),
    fetchImpl: async () => new Response(),
  });

  assert.equal(
    (await handler(new Request("https://function.example", { method: "GET" })))
      .status,
    405,
  );
  assert.equal(
    (
      await handler(
        new Request("https://function.example", {
          method: "POST",
          body: JSON.stringify(hookPayload),
        }),
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await handler(
        signedRequest(
          hookPayload,
          `whsec_${Buffer.from("wrong-wrong-wrong-wrong-wrong-12").toString("base64")}`,
        ),
      )
    ).status,
    401,
  );
});

test("returns 200 only after Brevo accepts every generated message", async () => {
  let calls = 0;
  const handler = createAuthEmailHandler({
    getEnv: (name) => env.get(name),
    fetchImpl: async () => {
      calls += 1;
      return new Response(JSON.stringify({ messageId: `id-${calls}` }), {
        status: 201,
      });
    },
  });

  const response = await handler(signedRequest(hookPayload));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {});
  assert.equal(calls, 1);
});

test("returns 500 for missing config, 400 for invalid payload, and 502 for Brevo failure", async () => {
  const missing = createAuthEmailHandler({ getEnv: () => undefined });
  assert.equal((await missing(signedRequest(hookPayload))).status, 500);

  const invalid = createAuthEmailHandler({
    getEnv: (name) => env.get(name),
  });
  assert.equal((await invalid(signedRequest({ nope: true }))).status, 400);

  const rejected = createAuthEmailHandler({
    getEnv: (name) => env.get(name),
    fetchImpl: async () => new Response("provider details", { status: 400 }),
  });
  assert.equal((await rejected(signedRequest(hookPayload))).status, 502);
});
