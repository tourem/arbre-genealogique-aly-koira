interface Option<T extends string> {
  value: T;
  label: string;
  glyph?: string;
}

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (next: T) => void;
  ariaLabel?: string;
}

/**
 * Two-state (or N-state) segmented control. Renders as role="radiogroup" with
 * role="radio" + aria-checked on each option. Used here for gender selection,
 * but kept generic enough for reuse.
 */
export default function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: Props<T>) {
  return (
    <div className="edit-segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={`edit-segmented-btn${active ? ' is-active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.glyph && <span className="edit-segmented-glyph" aria-hidden="true">{opt.glyph}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
