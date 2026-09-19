import test from "node:test";
import assert from "node:assert/strict";

import {
  InvalidPayloadError,
  buildAuthEmails,
} from "../supabase/functions/send-email/auth-email.ts";
import { sendBrevoEmail } from "../supabase/functions/send-email/brevo.ts";

const supabaseUrl = "https://project.supabase.co";
const base = {
  user: {
    email: "person+tag@example.com",
    new_email: "new@example.com",
  },
  email_data: {
    token: "123456",
    token_hash: "hash/with+reserved=chars",
    token_new: "654321",
    token_hash_new: "old-hash",
    redirect_to:
      "https://devfoliox.example/auth/callback?next=/builder&from=email",
    email_action_type: "signup",
    site_url: "https://devfoliox.example",
  },
};

test("builds an encoded signup verification link and branded content", () => {
  const [message] = buildAuthEmails(base, supabaseUrl);
  const url = new URL(message.actionUrl);

  assert.equal(message.to, "person+tag@example.com");
  assert.equal(url.pathname, "/auth/v1/verify");
  assert.equal(url.searchParams.get("token"), "hash/with+reserved=chars");
  assert.equal(url.searchParams.get("type"), "signup");
  assert.equal(url.searchParams.get("redirect_to"), base.email_data.redirect_to);
  assert.match(message.subject, /confirm/i);
  assert.match(message.htmlContent, /DevFolio/);
  assert.match(message.textContent, /https:\/\//);
});

test("maps recovery to a password-reset message", () => {
  const [message] = buildAuthEmails(
    {
      ...base,
      email_data: { ...base.email_data, email_action_type: "recovery" },
    },
    supabaseUrl,
  );

  assert.match(message.subject, /reset/i);
  assert.equal(new URL(message.actionUrl).searchParams.get("type"), "recovery");
});

test("supports magic links, invites, and reauthentication", () => {
  for (const type of ["magiclink", "invite", "reauthentication"]) {
    const [message] = buildAuthEmails(
      {
        ...base,
        email_data: { ...base.email_data, email_action_type: type },
      },
      supabaseUrl,
    );

    assert.equal(new URL(message.actionUrl).searchParams.get("type"), type);
    assert.ok(message.subject.length > 0);
  }
});

test("escapes HTML-sensitive user metadata", () => {
  const [message] = buildAuthEmails(
    {
      ...base,
      user: {
        email: "person@example.com",
        user_metadata: { display_name: "<img src=x onerror=alert(1)>" },
      },
    },
    supabaseUrl,
  );

  assert.doesNotMatch(message.htmlContent, /<img src=x/);
});

test("maps secure email-change hashes to the correct recipients", () => {
  const messages = buildAuthEmails(
    {
      ...base,
      email_data: { ...base.email_data, email_action_type: "email_change" },
    },
    supabaseUrl,
  );

  assert.deepEqual(
    messages.map((message) => ({
      to: message.to,
      token: new URL(message.actionUrl).searchParams.get("token"),
    })),
    [
      { to: "person+tag@example.com", token: "old-hash" },
      { to: "new@example.com", token: "hash/with+reserved=chars" },
    ],
  );
});

test("uses the available hash for non-secure email change", () => {
  const payload = structuredClone(base);
  payload.email_data.email_action_type = "email_change";
  payload.email_data.token_hash_new = "";
  payload.email_data.token_new = "";

  const [message] = buildAuthEmails(payload, supabaseUrl);

  assert.equal(message.to, "new@example.com");
  assert.equal(
    new URL(message.actionUrl).searchParams.get("token"),
    "hash/with+reserved=chars",
  );
});

test("fails closed for unsupported actions and incomplete payloads", () => {
  assert.throws(
    () =>
      buildAuthEmails(
        {
          ...base,
          email_data: { ...base.email_data, email_action_type: "unknown" },
        },
        supabaseUrl,
      ),
    InvalidPayloadError,
  );

  assert.throws(
    () =>
      buildAuthEmails(
        { ...base, user: { ...base.user, email: "" } },
        supabaseUrl,
      ),
    InvalidPayloadError,
  );
});

test("sends the expected Brevo transaction without leaking the key into content", async () => {
  let request;
  const messageId = await sendBrevoEmail(
    {
      to: "person@example.com",
      subject: "Confirm",
      htmlContent: "<p>Confirm</p>",
      textContent: "Confirm",
      actionUrl: "https://example.com/verify",
    },
    {
      apiKey: "secret-key",
      senderEmail: "contact@example.com",
      senderName: "DevFolioX",
    },
    async (url, init) => {
      request = { url, init };
      return new Response(JSON.stringify({ messageId: "brevo-id" }), {
        status: 201,
      });
    },
  );

  assert.equal(messageId, "brevo-id");
  assert.equal(request.url, "https://api.brevo.com/v3/smtp/email");
  assert.equal(request.init.headers["api-key"], "secret-key");
  const body = JSON.parse(request.init.body);
  assert.deepEqual(body.sender, {
    email: "contact@example.com",
    name: "DevFolioX",
  });
  assert.deepEqual(body.to, [{ email: "person@example.com" }]);
  assert.doesNotMatch(request.init.body, /secret-key/);
});

test("rejects Brevo errors, missing message ids, and network failures", async () => {
  const message = {
    to: "person@example.com",
    subject: "Confirm",
    htmlContent: "<p>Confirm</p>",
    textContent: "Confirm",
    actionUrl: "https://example.com/verify",
  };
  const config = {
    apiKey: "secret-key",
    senderEmail: "contact@example.com",
    senderName: "DevFolioX",
  };
  const cases = [
    async () => new Response('{"message":"bad sender"}', { status: 400 }),
    async () => new Response("{}", { status: 202 }),
    async () => {
      throw new Error("socket failed");
    },
  ];

  for (const fetchImpl of cases) {
    await assert.rejects(
      sendBrevoEmail(message, config, fetchImpl),
      (error) =>
        error.name === "BrevoDeliveryError" &&
        !JSON.stringify(error).includes("secret-key") &&
        !JSON.stringify(error).includes("bad sender"),
    );
  }
});
