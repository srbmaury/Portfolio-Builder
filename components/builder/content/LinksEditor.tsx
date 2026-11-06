import type { PortfolioData } from "@/lib/portfolio";
import { EditorCard, EditorSection, Field } from "../EditorFields";
import type { CreateDialogKind } from "../types";
import type { usePortfolioEditorActions } from "../usePortfolioEditorActions";

export function LinksEditor({
  socials,
  setCreateDialog,
  actions,
}: {
  socials: PortfolioData["profile"]["socials"];
  setCreateDialog: (kind: CreateDialogKind) => void;
  actions: Pick<
    ReturnType<typeof usePortfolioEditorActions>,
    | "updateSocial"
    | "removeSocial"
  >;
}) {
  const {
    updateSocial,
    removeSocial,
  } = actions;

  return (
    <EditorSection
      title="Links"
      subtitle={`${socials.length} links`}
      actionLabel="+ Add"
      onAction={() => setCreateDialog("link")}
    >
      {socials.map((social, index) => (
        <EditorCard
          key={`social-${index}`}
          title={social.label || `Link ${index + 1}`}
          onDelete={() => removeSocial(index)}
        >
          <Field
            label="Label"
            value={social.label}
            onChange={(value) => updateSocial(index, "label", value)}
          />
          <Field
            label="URL"
            value={social.url}
            onChange={(value) => updateSocial(index, "url", value)}
          />
        </EditorCard>
      ))}
    </EditorSection>
  );
}
