import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import {
  cloudinaryPortfolioTag,
  cloudinaryUserTag,
} from "@/lib/cloudinary-assets";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type UploadScopeRequest = {
  scope?: "shared" | "portfolio";
  variantKey?: string;
};

export async function POST(request: Request) {
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

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Uploads are not configured." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as UploadScopeRequest;
  const scope = body.scope === "portfolio" ? "portfolio" : "shared";

  if (
    scope === "portfolio" &&
    (!body.variantKey ||
      body.variantKey.length > 120 ||
      !/^[a-zA-Z0-9&._ -]+$/.test(body.variantKey))
  ) {
    return NextResponse.json(
      { error: "A valid portfolio identifier is required." },
      { status: 400 }
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "folioblocks/uploads";
  const tags = [
    cloudinaryUserTag(user.id),
    ...(scope === "portfolio" && body.variantKey
      ? [cloudinaryPortfolioTag(body.variantKey)]
      : []),
  ].join(",");

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
      tags,
    },
    apiSecret
  );

  return NextResponse.json({
    signature,
    timestamp,
    cloudName,
    apiKey,
    folder,
    tags,
  });
}
