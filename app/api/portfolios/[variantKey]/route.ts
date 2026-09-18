import { NextResponse } from "next/server";
import {
  cloudinaryPortfolioTag,
  cloudinaryUserTag,
  collectCloudinaryUrls,
  selectUnreferencedAssetUrls,
} from "@/lib/cloudinary-assets";
import {
  configureCloudinaryServer,
  destroyCloudinaryUrls,
  listCloudinaryUrlsByTag,
} from "@/lib/cloudinary-server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ variantKey: string }> }
) {
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

  const { variantKey } = await context.params;
  if (!variantKey || variantKey.length > 160) {
    return NextResponse.json(
      { error: "Invalid portfolio identifier." },
      { status: 400 }
    );
  }

  const { data: target, error: targetError } = await supabase
    .from("portfolios")
    .select("variant_key, branding_config, resume_config, published_snapshot")
    .eq("user_id", user.id)
    .eq("variant_key", variantKey)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: targetError.message }, { status: 500 });
  }

  if (!target) {
    return NextResponse.json({ error: "Portfolio not found." }, { status: 404 });
  }

  const { data: remaining, error: remainingError } = await supabase
    .from("portfolios")
    .select("variant_key, branding_config, resume_config, published_snapshot")
    .eq("user_id", user.id)
    .neq("variant_key", variantKey);

  if (remainingError) {
    return NextResponse.json({ error: remainingError.message }, { status: 500 });
  }

  try {
    const cloudName = configureCloudinaryServer();
    const [
      profileResult,
      projectResult,
      taggedPortfolioAssets,
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
      listCloudinaryUrlsByTag(
        cloudinaryPortfolioTag(user.id, variantKey)
      ),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (projectResult.error) throw projectResult.error;

    const targetReferences = collectCloudinaryUrls(
      {
        branding: target.branding_config,
        resume: target.resume_config,
        publishedSnapshot: target.published_snapshot,
      },
      cloudName
    );

    const sharedReferences = collectCloudinaryUrls(
      {
        profile: profileResult.data,
        projects: projectResult.data || [],
      },
      cloudName
    );

    const remainingReferences = collectCloudinaryUrls(
      {
        portfolios: remaining || [],
        shared: {
          profile: profileResult.data,
          projects: projectResult.data || [],
        },
      },
      cloudName
    );

    const isLastPortfolio = (remaining || []).length === 0;
    let candidates = [...targetReferences, ...taggedPortfolioAssets];

    if (isLastPortfolio) {
      const taggedUserAssets = await listCloudinaryUrlsByTag(
        cloudinaryUserTag(user.id)
      );
      candidates = [
        ...candidates,
        ...sharedReferences,
        ...taggedUserAssets,
      ];
    }

    const deletable = isLastPortfolio
      ? Array.from(new Set(candidates))
      : selectUnreferencedAssetUrls(candidates, remainingReferences);

    await destroyCloudinaryUrls(deletable);

    const { error: deleteError } = await supabase
      .from("portfolios")
      .delete()
      .eq("user_id", user.id)
      .eq("variant_key", variantKey);

    if (deleteError) throw deleteError;

    if (isLastPortfolio) {
      const cleanupResults = await Promise.all([
        supabase.from("experiences").delete().eq("user_id", user.id),
        supabase.from("projects").delete().eq("user_id", user.id),
        supabase.from("skills").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("user_id", user.id),
      ]);
      const cleanupError = cleanupResults.find((result) => result.error)?.error;
      if (cleanupError) throw cleanupError;
    }

    return NextResponse.json({
      deleted: true,
      deletedAssets: deletable.length,
      deletedSharedWorkspace: isLastPortfolio,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Portfolio deletion failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
