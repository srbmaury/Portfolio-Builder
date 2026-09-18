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
import { selectOrphanedTargetContent } from "@/lib/portfolio-cleanup";
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

    const deletable = isLastPortfolio
      ? Array.from(new Set(candidates))
      : selectUnreferencedAssetUrls(candidates, remainingReferences);

    await destroyCloudinaryUrls(deletable);

    if (isLastPortfolio) {
      const cleanupResults = await Promise.all([
        supabase.from("experiences").delete().eq("user_id", user.id),
        supabase.from("projects").delete().eq("user_id", user.id),
        supabase.from("skills").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("user_id", user.id),
        supabase.from("product_events").delete().eq("user_id", user.id),
      ]);
      const cleanupError = cleanupResults.find((result) => result.error)?.error;
      if (cleanupError) throw cleanupError;
    } else {
      const cleanupResults = [
        await supabase
          .from("product_events")
          .delete()
          .eq("user_id", user.id)
          .eq("variant_key", variantKey),
      ];

      if (orphanedContent.experienceIds.length) {
        cleanupResults.push(
          await supabase
            .from("experiences")
            .delete()
            .eq("user_id", user.id)
            .in("id", orphanedContent.experienceIds)
        );
      }

      if (orphanedContent.projectIds.length) {
        cleanupResults.push(
          await supabase
            .from("projects")
            .delete()
            .eq("user_id", user.id)
            .in("id", orphanedContent.projectIds)
        );
      }

      if (orphanedContent.skills.length) {
        cleanupResults.push(
          await supabase
            .from("skills")
            .delete()
            .eq("user_id", user.id)
            .in("name", orphanedContent.skills)
        );
      }

      const cleanupError = cleanupResults.find((result) => result.error)?.error;
      if (cleanupError) throw cleanupError;
    }

    const { error: deleteError } = await supabase
      .from("portfolios")
      .delete()
      .eq("user_id", user.id)
      .eq("variant_key", variantKey);

    if (deleteError) throw deleteError;

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
