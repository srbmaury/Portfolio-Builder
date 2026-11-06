export function safeResumeUrl(value?: string) {
  if (!value) return null;
  if (
    value.startsWith("/api/public-resume/") ||
    value.startsWith("/api/resume/")
  ) {
    return value;
  }
  return safeCloudinaryUrl(value);
}

export function safeCloudinaryUrl(value?: string) {
  const url = safeExternalUrl(value);
  if (!url) return null;

  try {
    return new URL(url).hostname === "res.cloudinary.com" ? url : null;
  } catch {
    return null;
  }
}

export function safeExternalUrl(value?: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
