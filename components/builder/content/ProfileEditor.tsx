import type { PortfolioData } from "@/lib/portfolio";
import { EditorSection, Field } from "../EditorFields";
import { ImageUploadField } from "../UploadFields";
import type { usePortfolioEditorActions } from "../usePortfolioEditorActions";

export function ProfileEditor({
  profile,
  actions,
}: {
  profile: PortfolioData["profile"];
  actions: Pick<
    ReturnType<typeof usePortfolioEditorActions>,
    | "activeVariant"
    | "updateProfile"
    | "updateVariantMeta"
  >;
}) {
  const {
    activeVariant,
    updateProfile,
    updateVariantMeta,
  } = actions;

  return (
    <EditorSection title="Profile" subtitle="Identity and positioning" defaultOpen>
      <Field
        label="Name"
        value={profile.name}
        onChange={(value) => updateProfile("name", value)}
      />
      {/* One field for the role this portfolio targets. The published
          page shows the portfolio's target role over the profile
          role, so both are kept in step rather than asking twice. */}
      <Field
        label="Role"
        value={activeVariant?.targetRole || profile.role}
        onChange={(value) => {
          updateProfile("role", value);
          updateVariantMeta("targetRole", value);
        }}
      />
      <Field
        label="Tagline"
        multiline
        value={profile.tagline}
        onChange={(value) => updateProfile("tagline", value)}
      />
      <Field
        label="About"
        hint="Separate paragraphs with a blank line."
        multiline
        value={profile.about}
        onChange={(value) => updateProfile("about", value)}
      />
      <Field
        label="Email"
        value={profile.email}
        onChange={(value) => updateProfile("email", value)}
      />
      <Field
        label="Location"
        value={profile.location}
        onChange={(value) => updateProfile("location", value)}
      />
      <Field
        label="Availability"
        multiline
        value={profile.availability}
        onChange={(value) => updateProfile("availability", value)}
      />
      <ImageUploadField
        label="Hero image"
        value={profile.heroImageUrl || ""}
        onChange={(value) => updateProfile("heroImageUrl", value)}
        help="Used by image-based hero layouts."
      />
    </EditorSection>
  );
}
