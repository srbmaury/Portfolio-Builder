import { v2 as cloudinary } from "cloudinary";
import {
  parseCloudinaryAssetUrl,
  type CloudinaryAssetRef,
} from "@/lib/cloudinary-assets";

export function cloudinaryCloudName() {
  return process.env.CLOUDINARY_CLOUD_NAME || "";
}

export function configureCloudinaryServer() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary cleanup is not configured.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudName;
}

export async function listCloudinaryUrlsByTag(tag: string) {
  configureCloudinaryServer();

  const urls: string[] = [];
  let nextCursor: string | undefined;

  do {
    const response = await cloudinary.api.resources_by_tag(tag, {
      resource_type: "image",
      type: "upload",
      max_results: 500,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    });

    for (const resource of response.resources || []) {
      if (typeof resource.secure_url === "string") {
        urls.push(resource.secure_url);
      }
    }

    nextCursor =
      typeof response.next_cursor === "string"
        ? response.next_cursor
        : undefined;
  } while (nextCursor);

  return urls;
}

export async function destroyCloudinaryUrls(urls: string[]) {
  const cloudName = configureCloudinaryServer();
  const refs = new Map<string, CloudinaryAssetRef>();

  for (const url of urls) {
    const ref = parseCloudinaryAssetUrl(url, cloudName);
    if (!ref) continue;
    refs.set(`${ref.resourceType}:${ref.publicId}`, ref);
  }

  const results = await Promise.allSettled(
    [...refs.values()].map((ref) =>
      cloudinary.uploader.destroy(ref.publicId, {
        resource_type: ref.resourceType,
        type: "upload",
        invalidate: true,
      })
    )
  );

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  );

  if (failures.length) {
    throw new Error(
      `Could not delete ${failures.length} Cloudinary asset${failures.length === 1 ? "" : "s"}.`
    );
  }

  return refs.size;
}
