

export function TargetingSection({
  title,
  selectedCount,
  totalCount,
  onSelectAll,
  onClear,
  children,
}: {
  title: string;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="targeting-section">
      <div className="targeting-section-head">
        <div>
          <strong>{title}</strong>
          <span>
            {selectedCount} of {totalCount} shown
          </span>
        </div>
        <div>
          <button onClick={onSelectAll}>All</button>
          <button onClick={onClear}>None</button>
        </div>
      </div>
      <div className="targeting-list">{children}</div>
    </section>
  );
}

export function TargetRow({
  label,
  detail,
  selected,
  onToggle,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className={`target-row ${selected ? "selected" : ""}`}>
      <label>
        <input type="checkbox" checked={selected} onChange={onToggle} />
        <span>
          <strong>{label}</strong>
          {detail && <small>{detail}</small>}
        </span>
      </label>
      <div className="target-order-actions">
        <button onClick={onMoveUp} disabled={!canMoveUp} aria-label={`Move ${label} up`}>
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label={`Move ${label} down`}
        >
          ↓
        </button>
      </div>
    </div>
  );
}
