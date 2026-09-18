import { NextResponse } from "next/server";
import {
  cloudinaryUserTag,
  collectCloudinaryUrls,
} from "@/lib/cloudinary-assets";
import {
  configureCloudinaryServer,
  destroyCloudinaryUrls,
  listCloudinaryUrlsByTag,
} from "@/lib/cloudinary-server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

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
