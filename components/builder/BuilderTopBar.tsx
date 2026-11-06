import { AppNav } from "@/components/AppNav";
import type { useBuilderWorkspace } from "./useBuilderWorkspace";

type Props = Pick<
  ReturnType<typeof useBuilderWorkspace>,
  "cloudUserId" | "cloudStatus" | "cloudMessage" | "hasUnsavedChanges" | "saveToCloud"
> & {
  accountEmail: string | null;
  isAdmin: boolean;
  onHealth: () => void;
  onPublish: () => void;
};

export function BuilderTopBar({
  accountEmail,
  isAdmin,
  cloudUserId,
  cloudStatus,
  cloudMessage,
  hasUnsavedChanges,
  saveToCloud,
  onHealth,
  onPublish,
}: Props) {
  return (
    <AppNav
      current="builder"
      className="builder-topbar"
      email={accountEmail}
      isAdmin={isAdmin}
      actions={
        <>
          <div className="builder-status" title={cloudMessage || undefined} aria-live="polite">
            <span
              className={`save-dot cloud-${cloudStatus}${hasUnsavedChanges ? " cloud-dirty" : ""}`}
            />
            <span>
              {cloudUserId
                ? cloudStatus === "loading"
                  ? "Syncing…"
                  : cloudStatus === "error"
                    ? "Cloud error"
                    : hasUnsavedChanges
                      ? "Unsaved changes"
                      : cloudStatus === "saved"
                        ? "Saved"
                        : "Cloud ready"
                : "Local"}
            </span>
          </div>
          <button
            type="button"
            className="topbar-link topbar-health"
            onClick={onHealth}
          >
            Health
          </button>
          {cloudUserId ? (
            <button
              className={
                hasUnsavedChanges
                  ? "primary-button topbar-save topbar-save-dirty"
                  : "topbar-link topbar-save"
              }
              onClick={saveToCloud}
              disabled={cloudStatus === "loading" || !hasUnsavedChanges}
              title={
                hasUnsavedChanges
                  ? "Save changes to cloud"
                  : "All changes are saved"
              }
            >
              Save
            </button>
          ) : null}

          <button
            className="primary-button topbar-publish"
            onClick={onPublish}
            disabled={
              cloudStatus === "loading" ||
              Boolean(cloudUserId && hasUnsavedChanges)
            }
            title={
              cloudUserId
                ? hasUnsavedChanges
                  ? "Save changes before publishing"
                  : "Publish and copy public link"
                : undefined
            }
          >
            {cloudUserId ? (
              hasUnsavedChanges ? (
                <>
                  <span className="publish-label-desktop">Save changes first</span>
                  <span className="publish-label-mobile">Save first</span>
                </>
              ) : (
                "Publish"
              )
            ) : (
              "Sign in to publish"
            )}
          </button>
        </>
      }
      sidebarExtras={
        <button type="button" onClick={onHealth}>
          Portfolio health
        </button>
      }
    />
  );
}
