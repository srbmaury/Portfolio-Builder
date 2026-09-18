export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

type SignatureResponse = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function uploadImageToCloudinary(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Choose a JPG, PNG, WebP, GIF, or AVIF image.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image must be 10 MB or smaller.");
  }

  const signatureResponse = await fetch("/api/uploads/cloudinary-signature", {
    method: "POST",
  });

  if (signatureResponse.status === 401) {
    throw new Error("Sign in to upload images.");
  }

  if (!signatureResponse.ok) {
    throw new Error("Image uploads are temporarily unavailable.");
  }

  const signed = (await signatureResponse.json()) as SignatureResponse;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signed.apiKey);
  formData.append("timestamp", String(signed.timestamp));
  formData.append("signature", signed.signature);
  formData.append("folder", signed.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Image upload failed. Please try again.");
  }

  return (await response.json()) as CloudinaryUploadResult;
}
