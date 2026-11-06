import type { PortfolioVariant } from "@/lib/portfolio";
import { Field } from "./EditorFields";

export function PortfolioSwitcher({
  variants,
  activeVariantId,
  activeVariant,
  onSelect,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
}: {
  variants: PortfolioVariant[];
  activeVariantId: string;
  activeVariant?: PortfolioVariant;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="variant-switcher">
      <div className="variant-switcher-head">
        <div>
          <span>Portfolios</span>
          <small>Each portfolio keeps its own content</small>
        </div>
        <button onClick={onCreate}>+ New</button>
      </div>

      <div className="variant-pills">
        {variants.map((variant) => (
          <button
            key={variant.id}
            className={variant.id === activeVariantId ? "active" : ""}
            onClick={() => onSelect(variant.id)}
          >
            {variant.name || "Untitled"}
          </button>
        ))}
      </div>

      {activeVariant && (
        <div className="variant-meta-grid">
          <Field
            label="Portfolio name"
            value={activeVariant.name}
            onChange={onRename}
          />
          <div className="variant-meta-actions">
            <button onClick={onDuplicate}>Duplicate</button>
            <button
              className="danger-link"
              onClick={onDelete}
              disabled={variants.length <= 1}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
