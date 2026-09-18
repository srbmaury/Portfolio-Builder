export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  asset_id?: string;
  resource_type?: string;
};

type SignatureResponse = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  tags: string;
};

export type CloudinaryUploadScope =
  | { scope: "shared" }
  | { scope: "portfolio"; variantKey: string };

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function uploadImageToCloudinary(
  file: File,
  uploadScope: CloudinaryUploadScope = { scope: "shared" }
) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Choose a JPG, PNG, WebP, GIF, or AVIF image.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image must be 10 MB or smaller.");
  }

  return uploadToCloudinary(file, uploadScope);
}

export async function uploadResumeToCloudinary(
  file: File,
  variantKey: string
) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Choose a PDF resume.");
  }

  if (file.size > MAX_RESUME_SIZE) {
    throw new Error("Resume must be 5 MB or smaller.");
  }

  return uploadToCloudinary(
    file,
    {
      scope: "portfolio",
      variantKey,
    },
    "raw"
  );
}

async function uploadToCloudinary(
  file: File,
  uploadScope: CloudinaryUploadScope,
  resourceType: "image" | "raw" = "image"
) {
  const signatureResponse = await fetch("/api/uploads/cloudinary-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(uploadScope),
  });

  if (signatureResponse.status === 401) {
    throw new Error("Sign in to upload files.");
  }

  if (!signatureResponse.ok) {
    throw new Error("Uploads are temporarily unavailable.");
  }

  const signed = (await signatureResponse.json()) as SignatureResponse;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signed.apiKey);
  formData.append("timestamp", String(signed.timestamp));
  formData.append("signature", signed.signature);
  formData.append("folder", signed.folder);
  formData.append("tags", signed.tags);

  const response = await fetch(
    cloudinaryUploadEndpoint(signed.cloudName, resourceType),
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Upload failed. Please try again.");
  }

  return (await response.json()) as CloudinaryUploadResult;
}


export function cloudinaryUploadEndpoint(
  cloudName: string,
  resourceType: "image" | "raw"
) {
  return `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
}
