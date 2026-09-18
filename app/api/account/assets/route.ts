import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  cloudinaryUserTag,
  collectCloudinaryUrls,
} from "@/lib/cloudinary-assets";
import {
  configureCloudinaryServer,
  destroyCloudinaryUrls,
  listCloudinaryUrlsByTag,
} from "@/lib/cloudinary-server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  const supabase = bearerToken
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${bearerToken}`,
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )
    : await createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(bearerToken || undefined);

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const cloudName = configureCloudinaryServer();
    const [
      profileResult,
      projectResult,
      portfolioResult,
      taggedAssets,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("hero_image_url")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("projects")
        .select("image_url")
        .eq("user_id", user.id),
      supabase
        .from("portfolios")
        .select("branding_config, resume_config, published_snapshot")
        .eq("user_id", user.id),
      listCloudinaryUrlsByTag(cloudinaryUserTag(user.id)),
    ]);

    const queryError = [
      profileResult.error,
      projectResult.error,
      portfolioResult.error,
    ].find(Boolean);
    if (queryError) throw queryError;

    const persistedAssets = collectCloudinaryUrls(
      {
        profile: profileResult.data,
        projects: projectResult.data || [],
        portfolios: portfolioResult.data || [],
      },
      cloudName
    );

    const allAssets = Array.from(
      new Set([...persistedAssets, ...taggedAssets])
    );

    await destroyCloudinaryUrls(allAssets);

    return NextResponse.json({
      cleaned: true,
      deletedAssets: allAssets.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Account cleanup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
