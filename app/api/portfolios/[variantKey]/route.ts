import { NextResponse } from "next/server";
import {
  cloudinaryPortfolioTag,
  cloudinaryUserTag,
  collectCloudinaryUrls,
  selectOwnedAssetUrls,
  selectUnreferencedAssetUrls,
} from "@/lib/cloudinary-assets";
import {
  configureCloudinaryServer,
  destroyCloudinaryUrls,
  listCloudinaryUrlsByTag,
} from "@/lib/cloudinary-server";
import { selectOrphanedTargetContent } from "@/lib/portfolio-cleanup";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type DeletePortfolioRpcResult = {
  deleted?: boolean;
  deletedSharedWorkspace?: boolean;
  productEventsCleaned?: boolean;
};

/** Reads a message off an Error or off a Supabase/PostgREST error object. */
function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === "object") {
    const { message } = error as { message?: unknown };
    if (typeof message === "string" && message) return message;
  }

  return fallback;
}

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
    .select("variant_key, branding_config, resume_config, published_snapshot, content_config")
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
    .select("variant_key, branding_config, resume_config, published_snapshot, content_config")
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
        .select("id, image_url")
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

    const targetContent =
      target.content_config && typeof target.content_config === "object"
        ? target.content_config
        : { experienceIds: [], projectIds: [], skills: [] };
    const remainingContents = (remaining || []).map((portfolio) =>
      portfolio.content_config && typeof portfolio.content_config === "object"
        ? portfolio.content_config
        : { experienceIds: [], projectIds: [], skills: [] }
    );
    const orphanedContent = selectOrphanedTargetContent(
      targetContent,
      remainingContents
    );

    const orphanedProjectIds = new Set(orphanedContent.projectIds);
    const retainedProjects = (projectResult.data || []).filter(
      (project) => !orphanedProjectIds.has(project.id)
    );
    const remainingReferences = collectCloudinaryUrls(
      {
        portfolios: remaining || [],
        shared: {
          profile: profileResult.data,
          projects: retainedProjects,
        },
      },
      cloudName
    );

    const orphanedProjectResult = orphanedContent.projectIds.length
      ? await supabase
          .from("projects")
          .select("id, image_url")
          .eq("user_id", user.id)
          .in("id", orphanedContent.projectIds)
      : { data: [], error: null };

    if (orphanedProjectResult.error) throw orphanedProjectResult.error;

    const orphanedProjectAssets = collectCloudinaryUrls(
      orphanedProjectResult.data || [],
      cloudName
    );

    const isLastPortfolio = (remaining || []).length === 0;
    let candidates = [
      ...targetReferences,
      ...taggedPortfolioAssets,
      ...orphanedProjectAssets,
    ];

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

    // Only this user's own uploads may be destroyed, whatever their content
    // happens to reference.
    const ownedAssets = await listCloudinaryUrlsByTag(cloudinaryUserTag(user.id));
    const deletable = selectOwnedAssetUrls(
      isLastPortfolio
        ? Array.from(new Set(candidates))
        : selectUnreferencedAssetUrls(candidates, remainingReferences),
      ownedAssets,
      cloudName
    );

    // All database mutations happen inside one Postgres function invocation.
    // If any delete fails, Postgres rolls the entire RPC statement back.
    const { data: deletionResult, error: deleteError } = await supabase.rpc(
      "delete_portfolio_workspace",
      { p_variant_key: variantKey }
    );

    if (deleteError) throw deleteError;

    const result = (deletionResult || {}) as DeletePortfolioRpcResult;

    // Cloudinary is an external system and cannot join the database
    // transaction. Run irreversible asset deletion only after the RPC commits.
    let deletedAssets = 0;
    try {
      await destroyCloudinaryUrls(deletable);
      deletedAssets = deletable.length;
    } catch (assetError) {
      // The database transaction is already committed; leaving orphaned files
      // behind is safer than pretending the portfolio deletion failed.
      console.warn("Portfolio deleted, but its assets were not removed", assetError);
    }

    return NextResponse.json({
      deleted: result.deleted !== false,
      deletedAssets,
      deletedSharedWorkspace:
        result.deletedSharedWorkspace ?? isLastPortfolio,
      productEventsCleaned: result.productEventsCleaned !== false,
    });
  } catch (error) {
    // Supabase rejects with a plain object, not an Error, so an instanceof
    // check alone discarded the real cause and every failure surfaced as an
    // unhelpful "Portfolio deletion failed."
    const message = errorMessage(error, "Portfolio deletion failed.");
    console.error("Portfolio deletion failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
