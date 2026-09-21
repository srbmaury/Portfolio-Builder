import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * This function is the only one invoked from the browser, so it needs CORS.
 * Without a preflight response the browser refuses to send the request at all
 * and supabase-js reports "Failed to send a request to the Edge Function".
 *
 * Allowing any origin is safe here because authorisation is a bearer token in
 * a header rather than a cookie: a third-party page cannot obtain one, and a
 * request without a valid token is rejected below.
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "Authentication required." }, 401);
  }

  const token = authorization.slice("Bearer ".length);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Account deletion is not configured." }, 503);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return json({ error: "Authentication required." }, 401);
  }

  const cleanupUrl =
    Deno.env.get("ACCOUNT_CLEANUP_URL") ??
    "https://devfoliox.qd.je/api/account/assets";

  const cleanupResponse = await fetch(cleanupUrl, {
    method: "DELETE",
    headers: {
      Authorization: authorization,
    },
  });

  if (!cleanupResponse.ok) {
    const payload = await cleanupResponse
      .json()
      .catch(() => ({ error: "Account asset cleanup failed." }));
    return json(
      {
        error:
          typeof payload?.error === "string"
            ? payload.error
            : "Account asset cleanup failed.",
      },
      502
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return json({ error: deleteError.message }, 500);
  }

  return json({ deleted: true }, 200);
});
