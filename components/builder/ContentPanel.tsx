import { CustomSectionsEditor } from "./content/CustomSectionsEditor";
import { LinksEditor } from "./content/LinksEditor";
import { ProfileEditor } from "./content/ProfileEditor";
import { ResumeEditor } from "./content/ResumeEditor";
import { WorkEditor } from "./content/WorkEditor";
import type { BuilderState, PortfolioSnapshot } from "@/lib/portfolio";
import type { CreateDialogKind } from "./types";
import type { usePortfolioEditorActions } from "./usePortfolioEditorActions";

type Props = {
  state: Pick<BuilderState, "data" | "activeVariantId">;
  snapshot: PortfolioSnapshot;
  builderResumeUrl: string | undefined;
  setCreateDialog: (kind: CreateDialogKind) => void;
  onResumeImport: () => void;
  onGitHubImport: () => void;
  onEditJson: () => void;
  loadDemo: () => void;
  startFreshWorkspace: () => void;
  actions: Pick<
    ReturnType<typeof usePortfolioEditorActions>,
    | "activeVariant"
    | "updateProfile"
    | "updateResume"
    | "updateExperience"
    | "removeExperience"
    | "updateProject"
    | "updateProjectStack"
    | "removeProject"
    | "updateSkills"
    | "updateSocial"
    | "removeSocial"
    | "renameCustomSection"
    | "addCustomItem"
    | "updateCustomItem"
    | "removeCustomItem"
    | "removeCustomSection"
    | "updateVariantMeta"
  >;
};

export function ContentPanel({
  state,
  snapshot,
  builderResumeUrl,
  setCreateDialog,
  onResumeImport,
  onGitHubImport,
  onEditJson,
  loadDemo,
  startFreshWorkspace,
  actions,
}: Props) {
  return (
    <div className="panel-body">
      <div className="panel-intro">
        <h2>Your details</h2>
        <p>
          Fill in what this portfolio shows, or import it. Your other
          portfolios are not affected.
        </p>
        <div className="panel-intro-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onResumeImport}
          >
            Import resume
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={onGitHubImport}
          >
            Import GitHub
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={onEditJson}
          >
            Edit as JSON
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={loadDemo}
          >
            Load demo
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={startFreshWorkspace}
          >
            Start over
          </button>
        </div>
      </div>
      <ProfileEditor profile={state.data.profile} actions={actions} />
      <ResumeEditor
        activeVariantId={state.activeVariantId}
        builderResumeUrl={builderResumeUrl}
        actions={actions}
      />
      <WorkEditor
        data={state.data}
        visibleData={snapshot.data}
        setCreateDialog={setCreateDialog}
        actions={actions}
      />
      <CustomSectionsEditor
        customSections={state.data.customSections}
        setCreateDialog={setCreateDialog}
        actions={actions}
      />
      <LinksEditor
        socials={state.data.profile.socials}
        setCreateDialog={setCreateDialog}
        actions={actions}
      />
    </div>
  );
}
