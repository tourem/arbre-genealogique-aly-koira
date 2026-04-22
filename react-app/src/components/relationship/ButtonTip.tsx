import { useCallback, useRef, useState, type ReactElement } from 'react';

interface Props {
  /** Texte affiche dans le tooltip. */
  label: string;
  /** Le bouton (ou tout element interactif) enveloppe. Doit porter aria-label. */
  children: ReactElement;
}

type Placement = {
  vertical: 'below' | 'above';
  horizontal: 'start' | 'end' | 'center';
};

const DEFAULT_PLACEMENT: Placement = { vertical: 'below', horizontal: 'center' };
const TIP_EST_WIDTH = 160;
const TIP_EST_HEIGHT = 32;
const EDGE_MARGIN = 12;

function computePlacement(rect: DOMRect, tipW: number, tipH: number): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;
  const vertical: Placement['vertical'] =
    spaceBelow < tipH + EDGE_MARGIN && spaceAbove > spaceBelow ? 'above' : 'below';
  const chipCenter = rect.left + rect.width / 2;
  let horizontal: Placement['horizontal'] = 'center';
  if (chipCenter - tipW / 2 < EDGE_MARGIN) horizontal = 'start';
  else if (chipCenter + tipW / 2 > vw - EDGE_MARGIN) horizontal = 'end';
  return { vertical, horizontal };
}

/**
 * Tooltip compact stylé pour boutons-icône (ex. chevron de repli).
 * Aligné visuellement avec les tooltips de MetricChips — même palette, même
 * animation — mais plus court (une seule phrase).
 *
 * Le composant enveloppe un bouton, monte son propre conteneur relatif pour
 * positionner le tip, et gère placement adaptatif au viewport.
 */
export default function ButtonTip({ label, children }: Props) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  const openTip = useCallback(() => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setPlacement(computePlacement(rect, TIP_EST_WIDTH, TIP_EST_HEIGHT));
    }
    setOpen(true);
  }, []);

  const closeTip = useCallback(() => setOpen(false), []);

  return (
    <span
      ref={wrapperRef}
      className={`parente-button-tip-wrap${open ? ' is-open' : ''} tip-${placement.vertical} tip-align-${placement.horizontal}`}
      onMouseEnter={openTip}
      onMouseLeave={closeTip}
      onFocus={openTip}
      onBlur={closeTip}
    >
      {children}
      {open && (
        <span role="tooltip" className="parente-button-tip">
          {label}
        </span>
      )}
    </span>
  );
}
