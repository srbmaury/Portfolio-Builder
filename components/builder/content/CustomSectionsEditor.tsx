import type { PortfolioData } from "@/lib/portfolio";
import { EditorCard, EditorSection, Field } from "../EditorFields";
import type { CreateDialogKind } from "../types";
import type { usePortfolioEditorActions } from "../usePortfolioEditorActions";

export function CustomSectionsEditor({
  customSections,
  setCreateDialog,
  actions,
}: {
  customSections: PortfolioData["customSections"];
  setCreateDialog: (kind: CreateDialogKind) => void;
  actions: Pick<
    ReturnType<typeof usePortfolioEditorActions>,
    | "renameCustomSection"
    | "addCustomItem"
    | "updateCustomItem"
    | "removeCustomItem"
    | "removeCustomSection"
  >;
}) {
  const {
    renameCustomSection,
    addCustomItem,
    updateCustomItem,
    removeCustomItem,
    removeCustomSection,
  } = actions;

  return (
    <EditorSection
      title="Custom sections"
      subtitle={`${customSections.length} sections`}
      actionLabel="+ Add"
      onAction={() => setCreateDialog("custom-section")}
    >
      {customSections.length === 0 ? (
        <p className="editor-empty-note">
          Add Education, Certifications, Awards, Publications, Talks,
          Open Source, Testimonials, or any section you need.
        </p>
      ) : null}

      {customSections.map((customSection) => (
        <EditorCard
          key={customSection.id}
          title={customSection.title || "Custom section"}
          onDelete={() => removeCustomSection(customSection.id)}
        >
          <Field
            label="Section title"
            value={customSection.title}
            onChange={(value) =>
              renameCustomSection(customSection.id, value)
            }
          />

          <div className="custom-editor-items-head">
            <div>
              <strong>Items</strong>
              <span>{customSection.items.length} entries</span>
            </div>
            <button
              type="button"
              onClick={() => addCustomItem(customSection.id)}
            >
              + Item
            </button>
          </div>

          {customSection.items.length === 0 ? (
            <p className="editor-empty-note">
              Add an item, then use only the fields that make sense for
              this section.
            </p>
          ) : null}

          <div className="custom-editor-items">
            {customSection.items.map((item, itemIndex) => (
              <div className="custom-editor-item" key={item.id}>
                <div className="custom-editor-item-head">
                  <strong>
                    {item.heading || `Item ${itemIndex + 1}`}
                  </strong>
                  <button
                    type="button"
                    className="danger-link"
                    onClick={() =>
                      removeCustomItem(customSection.id, item.id)
                    }
                  >
                    Remove
                  </button>
                </div>
                <Field
                  label="Heading"
                  value={item.heading}
                  onChange={(value) =>
                    updateCustomItem(
                      customSection.id,
                      item.id,
                      "heading",
                      value
                    )
                  }
                />
                <Field
                  label="Subheading"
                  value={item.subheading}
                  onChange={(value) =>
                    updateCustomItem(
                      customSection.id,
                      item.id,
                      "subheading",
                      value
                    )
                  }
                />
                <Field
                  label="Period / meta"
                  value={item.meta}
                  onChange={(value) =>
                    updateCustomItem(
                      customSection.id,
                      item.id,
                      "meta",
                      value
                    )
                  }
                />
                <Field
                  label="Description"
                  multiline
                  value={item.description}
                  onChange={(value) =>
                    updateCustomItem(
                      customSection.id,
                      item.id,
                      "description",
                      value
                    )
                  }
                />
                <Field
                  label="Link label"
                  value={item.linkLabel}
                  onChange={(value) =>
                    updateCustomItem(
                      customSection.id,
                      item.id,
                      "linkLabel",
                      value
                    )
                  }
                />
                <Field
                  label="Link URL"
                  value={item.linkUrl}
                  onChange={(value) =>
                    updateCustomItem(
                      customSection.id,
                      item.id,
                      "linkUrl",
                      value
                    )
                  }
                />
              </div>
            ))}
          </div>
        </EditorCard>
      ))}
    </EditorSection>
  );
}
