import { EditorSection, Field } from "./EditorFields";
import { ImageUploadField } from "./UploadFields";
import { designPresets, matchesDesignPreset } from "@/lib/design-presets";
import { sectionType, templateCatalog } from "@/lib/portfolio";
import type { BuilderState, PortfolioSnapshot, ThemeName } from "@/lib/portfolio";
import type { usePortfolioEditorActions } from "./usePortfolioEditorActions";

type Props = {
  state: Pick<BuilderState, "data" | "activeVariantId">;
  snapshot: PortfolioSnapshot;
  visibleSections: number;
  actions: Pick<
    ReturnType<typeof usePortfolioEditorActions>,
    | "activeVariant"
    | "updateTheme"
    | "updateBranding"
    | "setVariant"
    | "setSectionTitle"
    | "toggleSection"
    | "moveSection"
    | "shuffleDesign"
    | "chooseDesignPreset"
  >;
};

export function DesignPanel({
  state,
  snapshot,
  visibleSections,
  actions,
}: Props) {
  const {
    activeVariant,
    updateTheme,
    updateBranding,
    setVariant,
    setSectionTitle,
    toggleSection,
    moveSection,
    shuffleDesign,
    chooseDesignPreset,
  } = actions;

  return (
    <div className="panel-body">
      <div className="panel-intro design-intro">
        <div>
          <h2>Layout and theme</h2>
          <p>
            {visibleSections} sections are visible in {activeVariant?.name || "this portfolio"}.
            Changing the design never changes your content.
          </p>
        </div>
        <button className="shuffle-button" onClick={shuffleDesign}>
          Shuffle design
        </button>
      </div>

      <section className="design-presets" aria-labelledby="design-presets-title">
        <h3 id="design-presets-title">Start with a complete design</h3>
        <p>Choose a coordinated layout, then adjust any section below.</p>
        <div className="design-preset-list">
          {designPresets.map((preset) => (
            <button key={preset.id} type="button" className={`design-preset preset-${preset.id}`}
              aria-pressed={Boolean(activeVariant && matchesDesignPreset(activeVariant.config, preset))}
              onClick={() => chooseDesignPreset(preset)}>
              <span className="design-preset-preview" aria-hidden="true"><i /><i /><i /></span>
              <strong>{preset.name}</strong><span>{preset.description}</span>
            </button>
          ))}
        </div>
      </section>

      <EditorSection
        title="Brand & sharing"
        subtitle="Favicon and link preview"
        defaultOpen
      >
        <ImageUploadField
          label="Favicon"
          value={activeVariant?.branding.faviconUrl || ""}
          onChange={(value) => updateBranding("faviconUrl", value)}
          uploadScope={{
            scope: "portfolio",
            variantKey: activeVariant?.id || state.activeVariantId,
          }}
          help="Optional. Use a square PNG or WebP; this icon appears in the browser tab for this portfolio."
        />
        <Field
          label="Share title"
          value={activeVariant?.branding.shareTitle || ""}
          onChange={(value) => updateBranding("shareTitle", value)}
          hint="Optional. Defaults to your name and target role."
        />
        <Field
          label="Share description"
          multiline
          value={activeVariant?.branding.shareDescription || ""}
          onChange={(value) => updateBranding("shareDescription", value)}
          hint="Optional. Defaults to your portfolio tagline."
        />
        <ImageUploadField
          label="Social share card"
          value={activeVariant?.branding.shareImageUrl || ""}
          onChange={(value) => updateBranding("shareImageUrl", value)}
          uploadScope={{
            scope: "portfolio",
            variantKey: activeVariant?.id || state.activeVariantId,
          }}
          help="Optional. Recommended 1200 × 630. Leave blank to use an automatically generated card personalized to this portfolio."
        />
        <div className="sharing-preview-note">
          <strong>Link preview</strong>
          <span>
            LinkedIn, X, Slack, WhatsApp and other apps will use these settings when this portfolio link is pasted.
          </span>
        </div>
      </EditorSection>

      <div className="theme-picker">
        <label>Theme</label>
        <div className="theme-options">
          {([
            "ink",
            "sand",
            "moss",
            "aurora",
            "cobalt",
            "rose",
            "mono",
            "sunset",
            "ice",
            "noir",
          ] as ThemeName[]).map((theme) => (
            <button
              key={theme}
              className={`theme-swatch swatch-${theme} ${
                snapshot.config.theme === theme ? "active" : ""
              }`}
              onClick={() => updateTheme(theme)}
              aria-label={`Use ${theme} theme`}
            >
              <span />
              {theme}
            </button>
          ))}
        </div>
      </div>

      <section className="section-order-panel">
        <div className="section-order-heading">
          <div>
            <strong>Section order</strong>
            <span>Move sections without opening each layout card.</span>
          </div>
          <small>{snapshot.config.sections.length} sections</small>
        </div>
        <div className="section-order-list">
          {snapshot.config.sections.map((section, index) => {
            const sectionLabel =
              section.title?.trim() ||
              (sectionType(section) === "custom"
                ? state.data.customSections.find(
                    (item) => item.id === section.customSectionId
                  )?.title || "Custom section"
                : section.id);

            return (
              <div className="section-order-row" key={`order-${section.id}`}>
                <span className="section-order-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <strong>{sectionLabel}</strong>
                  <small>{section.visible ? "Visible" : "Hidden"}</small>
                </div>
                <div className="section-order-actions">
                  <button
                    type="button"
                    onClick={() => moveSection(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${sectionLabel} section up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(index, 1)}
                    disabled={index === snapshot.config.sections.length - 1}
                    aria-label={`Move ${sectionLabel} section down`}
                  >
                    ↓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="section-config-list">
        {snapshot.config.sections.map((section, index) => (
          <div className="section-config" key={section.id}>
            <div className="section-config-head">
              <div className="section-name-editor">
                <label htmlFor={`section-name-${section.id}`}>Section name</label>
                <input
                  id={`section-name-${section.id}`}
                  value={section.title || ""}
                  onChange={(event) =>
                    setSectionTitle(section.id, event.target.value)
                  }
                  aria-label={`Edit ${section.id} section name`}
                />
                <small>
                  {sectionType(section) === "custom"
                    ? state.data.customSections.find(
                        (item) => item.id === section.customSectionId
                      )?.title || "custom"
                    : section.id} · {section.visible ? section.variant : "hidden"}
                </small>
              </div>

              <div className="section-actions">
                <button
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${section.id} up`}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveSection(index, 1)}
                  disabled={index === snapshot.config.sections.length - 1}
                  aria-label={`Move ${section.id} down`}
                >
                  ↓
                </button>
                <button onClick={() => toggleSection(section.id)}>
                  {section.visible ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {section.visible && (
              <>
                <div className="variant-grid">
                {templateCatalog[sectionType(section)].map((variant) => (
                  <button
                    key={variant.id}
                    className={
                      section.variant === variant.id
                        ? "variant-card active"
                        : "variant-card"
                    }
                    onClick={() => setVariant(section.id, variant.id)}
                  >
                    <span className={`variant-preview variant-${variant.id}`}>
                      <i />
                      <i />
                      <i />
                    </span>
                    <strong>{variant.label}</strong>
                    <small>{variant.description}</small>
                  </button>
                ))}
              </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
