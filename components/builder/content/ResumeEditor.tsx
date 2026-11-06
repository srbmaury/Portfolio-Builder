import { cloneResume } from "@/lib/portfolio";
import { EditorSection } from "../EditorFields";
import { ResumeUploadField } from "../UploadFields";
import type { usePortfolioEditorActions } from "../usePortfolioEditorActions";

export function ResumeEditor({
  activeVariantId,
  builderResumeUrl,
  actions,
}: {
  activeVariantId: string;
  builderResumeUrl: string | undefined;
  actions: Pick<
    ReturnType<typeof usePortfolioEditorActions>,
    | "activeVariant"
    | "updateResume"
  >;
}) {
  const {
    activeVariant,
    updateResume,
  } = actions;

  return (
    <EditorSection
      title="Resume"
      subtitle={activeVariant?.resume.url ? "PDF attached" : "Optional PDF"}
    >
      <p className="editor-empty-note">
        This resume belongs to <strong>{activeVariant?.name || "this portfolio"}</strong>,
        so different role-specific portfolios can show different resumes.
      </p>
      <ResumeUploadField
        value={activeVariant?.resume || cloneResume()}
        variantKey={activeVariant?.id || activeVariantId}
        openUrl={builderResumeUrl}
        onChange={updateResume}
      />
      <label className="resume-hero-toggle">
        <input
          type="checkbox"
          checked={Boolean(activeVariant?.resume.showInHero)}
          disabled={!activeVariant?.resume.url}
          onChange={(event) =>
            updateResume({
              ...(activeVariant?.resume || cloneResume()),
              showInHero: event.target.checked,
            })
          }
        />
        <span>
          <strong>Show résumé link in hero</strong>
          <small>
            Adds a “View résumé” action that opens the PDF in an accessible modal.
          </small>
        </span>
      </label>
      <label className="resume-hero-toggle">
        <input
          type="checkbox"
          checked={Boolean(
            activeVariant?.resume.hideSectionWhenHeroLink
          )}
          disabled={
            !activeVariant?.resume.url ||
            !activeVariant?.resume.showInHero
          }
          onChange={(event) =>
            updateResume({
              ...(activeVariant?.resume || cloneResume()),
              hideSectionWhenHeroLink: event.target.checked,
            })
          }
        />
        <span>
          <strong>
            Hide standalone Resume section when hero link is shown
          </strong>
          <small>
            Keeps the résumé available from the hero without repeating
            the full Resume section lower on the page.
          </small>
        </span>
      </label>
    </EditorSection>
  );
}
