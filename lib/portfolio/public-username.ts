import { slugify } from "./identifiers.ts";
import { sampleData } from "./demo.ts";

/**
 * Demo personas that have seeded new workspaces in the past. Matching only the
 * current persona would strand anyone seeded under an earlier one, leaving a
 * stranger's name in their public URL forever, so retired names stay listed.
 */
const RETIRED_DEMO_NAME_SLUGS = ["alex-morgan"];

export function publicUsernameForProfile(
  existingUsername: string | null | undefined,
  profileName: string,
  userId: string
) {
  const profileSlug = slugify(profileName).slice(0, 30);
  const generated = `${profileSlug}-${userId.slice(0, 6)}`;
  const demoSlugs = [
    slugify(sampleData.profile.name),
    ...RETIRED_DEMO_NAME_SLUGS,
  ];

  // A demo-generated username is replaced once the profile carries a real
  // name; a user actually called after the demo persona keeps theirs.
  const isDemoGenerated =
    Boolean(existingUsername) &&
    demoSlugs.some(
      (demoSlug) =>
        existingUsername!.startsWith(`${demoSlug}-`) && profileSlug !== demoSlug
    );

  if (existingUsername && !isDemoGenerated) {
    return existingUsername;
  }

  return generated;
}
