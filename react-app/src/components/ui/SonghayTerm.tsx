import { useId, useState } from 'react';
import { resolveSonghayTerm } from '../../lib/tooltips-songhay';

type Variant = 'inline' | 'tag';

interface Props {
  /** The Songhay term to display, e.g. "hassa", "kaga arou coté baba". */
  term: string;
  /** Visual variant. 'inline' = italic ocre text. 'tag' = rounded pill with ◆ prefix. */
  variant?: Variant;
  /** Optional extra CSS class. */
  className?: string;
}

/**
 * Displays a Songhay kinship term in italic ocre with an educational tooltip
 * on hover/focus. The tooltip content comes from the authoritative file
 * `tooltips-songhay.md` (parsed at module load). If the term isn't in the
 * registry, the component still renders the text but without tooltip.
 *
 * Definitions are NOT generated or interpreted — they are loaded mechanically
 * from the Markdown source of truth.
 */
export default function SonghayTerm({ term, variant = 'inline', className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const def = resolveSonghayTerm(term);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  const classes = [
    'songhay-term',
    variant === 'tag' ? 'songhay-term--tag' : 'songhay-term--inline',
    className,
  ].filter(Boolean).join(' ');

  // When no definition is available, render the term without interactive tooltip.
  if (!def) {
    return (
      <em lang="son" className={classes}>{term}</em>
    );
  }

  return (
    <span
      lang="son"
      className={classes}
      tabIndex={0}
      role="button"
      aria-describedby={open ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={(e) => {
        if (e.key === 'Escape') hide();
      }}
    >
      <em className="songhay-term-text">{term}</em>
      {open && (
        <span id={id} role="tooltip" className="songhay-term-tooltip">
          <span className="songhay-term-tooltip-head">
            <em className="songhay-term-tooltip-term">{def.term}</em>
            <span className="songhay-term-tooltip-short">— {def.short}</span>
          </span>
          <span className="songhay-term-tooltip-long">{def.long}</span>
          <span className="songhay-term-tooltip-category" aria-hidden="true">{def.category}</span>
        </span>
      )}
    </span>
  );
}
