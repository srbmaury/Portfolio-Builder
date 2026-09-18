export type CloudinaryAssetRef = {
  publicId: string;
  resourceType: "image" | "raw" | "video";
};

export function cloudinaryUserTag(userId: string) {
  return `fb-user-${userId.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
}

export function cloudinaryPortfolioTag(
  userId: string,
  variantKey: string
) {
  const owner = userId.toLowerCase().replace(/[^a-z0-9]/g, "");
  const slug = variantKey
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);
  const fingerprint = fnv1a32(variantKey);

  return `fb-portfolio-${owner}-${slug || "portfolio"}-${fingerprint}`;
}

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function parseCloudinaryAssetUrl(
  value: string,
  cloudName: string
): CloudinaryAssetRef | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
      return null;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments[0] !== cloudName) return null;

    const resourceType = segments[1];
    const deliveryType = segments[2];

    if (
      !["image", "raw", "video"].includes(resourceType) ||
      deliveryType !== "upload"
    ) {
      return null;
    }

    const tail = segments.slice(3);
    const versionIndex = tail.findIndex((segment) => /^v\d+$/.test(segment));
    const publicSegments =
      versionIndex >= 0 ? tail.slice(versionIndex + 1) : tail;

    if (!publicSegments.length) return null;

    let publicId = decodeURIComponent(publicSegments.join("/"));
    if (resourceType !== "raw") {
      publicId = publicId.replace(/\.[a-z0-9]{1,10}$/i, "");
    }

    if (!publicId.startsWith("folioblocks/")) {
      return null;
    }

    return {
      publicId,
      resourceType: resourceType as CloudinaryAssetRef["resourceType"],
    };
  } catch {
    return null;
  }
}

export function collectCloudinaryUrls(
  value: unknown,
  cloudName: string
): string[] {
  const urls = new Set<string>();

  function visit(input: unknown) {
    if (typeof input === "string") {
      if (parseCloudinaryAssetUrl(input, cloudName)) {
        urls.add(input);
      }
      return;
    }

    if (Array.isArray(input)) {
      for (const item of input) visit(item);
      return;
    }

    if (input && typeof input === "object") {
      for (const nested of Object.values(input as Record<string, unknown>)) {
        visit(nested);
      }
    }
  }

  visit(value);
  return [...urls];
}

export function selectUnreferencedAssetUrls(
  candidateUrls: string[],
  remainingReferenceUrls: string[]
) {
  const remaining = new Set(remainingReferenceUrls);
  return Array.from(new Set(candidateUrls)).filter(
    (url) => !remaining.has(url)
  );
}
