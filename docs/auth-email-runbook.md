# Auth email operations

DevFolioX sends Supabase Auth messages through the `send-email` Edge Function and Brevo's HTTPS transactional API. The browser never receives provider or hook secrets.

## Secret ownership

The Edge Function requires these Supabase project secrets:

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `SEND_EMAIL_HOOK_SECRET`

Supabase generates the Standard Webhooks value used as `SEND_EMAIL_HOOK_SECRET` when the Send Email Auth Hook is configured. A `BREVO_WEBHOOK_SECRET` is not the Supabase hook secret and is not required for sending; retain it only when a separate Brevo delivery-event endpoint verifies bounce or delivery callbacks.

Never give these names a `NEXT_PUBLIC_` prefix, print their values, or commit a secrets file.

## CLI discovery and project check

The Supabase CLI changes over time. Discover the installed syntax before using it:

```bash
npx supabase --help
npx supabase functions --help
npx supabase functions deploy --help
npx supabase secrets --help
npx supabase secrets set --help
```

Authenticate and link only after confirming the project reference derived from `NEXT_PUBLIC_SUPABASE_URL` matches the intended hosted project. Use `npx supabase login` and `npx supabase link --project-ref <confirmed-ref>` only when the help output confirms those commands and flags.

## Localhost gate

Before production deployment:

1. Start the local stack using the current `npx supabase start --help` syntax.
2. Serve the function with a temporary secrets file outside the repository.
3. Configure the local Send Email Hook to call the local `send-email` function.
4. Confirm an unsigned request receives HTTP 401.
5. Complete signup confirmation and password recovery in a browser using local Mailpit/Inbucket.
6. Run `npm test`, `npm run typecheck`, `npm run build`, and `npx playwright test`.

Production deployment is blocked until this gate passes or an environmental limitation is explicitly accepted.

## Deployment

Create a temporary API-only env file with `mktemp -d`, validate its exact path, and populate it without echoing values. Based on the current CLI help, set the four secrets and deploy the function using the equivalents of:

```bash
npx supabase secrets set --env-file <temporary-api-only-env-file>
npx supabase functions deploy send-email --no-verify-jwt
```

Delete the temporary directory after the secrets command succeeds. In Supabase Dashboard, open Authentication → Hooks, enable the Send Email Hook, and select the deployed function URL. Store the generated signing value as `SEND_EMAIL_HOOK_SECRET` for the Edge Function.

The function intentionally disables platform JWT verification because Supabase Auth is the caller. It still rejects every request whose Standard Webhooks signature is absent or invalid.

## Live verification

Keep SMTP configured until live API delivery is proven. Create a unique Gmail plus-address through the production signup UI, locate the DevFolioX confirmation message in Gmail, follow the link, and confirm `/builder` loads with a session. Then sign out, request password recovery, follow the Gmail reset message, choose a new password, and sign in with it.

After both paths succeed, remove `BREVO_SMTP_USER`, `BREVO_SMTP_PASSWORD`, and `[auth.email.smtp]`. Request another recovery email and verify it in Gmail to prove the API hook remains authoritative.

## Rollback

Before SMTP cleanup, disable the Send Email Hook to return immediately to the configured SMTP path. After cleanup, restore SMTP credentials through Supabase configuration first, then disable the Send Email Hook. Do not modify the browser authentication contract during rollback.

## Evidence and cleanup

Record command exit codes, Gmail receipt, browser destinations, and provider acceptance without recording passwords, OTPs, hashes, signatures, API keys, or complete verification URLs. Remove the test account through an authorized admin path when available.
