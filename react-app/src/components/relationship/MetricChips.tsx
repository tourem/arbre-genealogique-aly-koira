import { useCallback, useId, useRef, useState } from 'react';
import type { RelationGroup } from './groupRelations';

interface Props {
  group: RelationGroup;
}

interface ChipDef {
  label: string;
  value?: string;
  tooltip: string;
}

type Placement = {
  vertical: 'below' | 'above';
  horizontal: 'start' | 'end';
};

const DEFAULT_PLACEMENT: Placement = { vertical: 'below', horizontal: 'start' };
// Estimation suffisante pour choisir un placement avant le premier render du
// tooltip : les valeurs reelles seront affinees une fois le tooltip monte.
const TOOLTIP_EST_WIDTH = 300;
const TOOLTIP_EST_HEIGHT = 120;
const EDGE_MARGIN = 12;

/**
 * Chips cliquables/survolables affichant les metriques algorithmiques
 * (nombre de chemins, proximite, equilibre) du groupe de relations.
 *
 * Chaque chip ouvre un tooltip explicatif au survol ou focus clavier.
 * Le but est de rendre accessibles ces indicateurs a des utilisateurs
 * non-developpeurs.
 */
export default function MetricChips({ group }: Props) {
  const best = group.paths[0];
  const pathCount = group.paths.length;

  const chips: ChipDef[] = [
    {
      label: pathCount === 1 ? '1 chemin' : `${pathCount} chemins distincts`,
      tooltip: pathCount === 1
        ? "Un seul chemin généalogique relie ces deux personnes."
        : `${pathCount} lignées différentes relient ces deux personnes. Sélectionnez un onglet ci-dessous pour voir chaque chemin.`,
    },
    {
      label: 'Proximité',
      value: String(best.proximityScore),
      tooltip: pathCount === 1
        ? 'Nombre total de liens parent-enfant entre A et B. Plus le chiffre est bas, plus les personnes sont proches généalogiquement.'
        : 'Nombre total de liens parent-enfant entre A et B dans le chemin le plus court. Plus le chiffre est bas, plus les personnes sont proches généalogiquement.',
    },
  ];

  // Balance n'est affiche que si >=1 (sinon trivialement equilibre)
  if (best.balanceScore > 0) {
    chips.push({
      label: 'Équilibre',
      value: String(best.balanceScore),
      tooltip: "Mesure de symétrie entre la distance vers A et la distance vers B depuis l'aïeul commun. Un équilibre faible signifie que l'aïeul est presque équidistant des deux personnes ; un équilibre élevé signifie qu'une des deux est beaucoup plus proche.",
    });
  }

  return (
    <span className="parente-metric-chips" role="group" aria-label="Métriques de la relation">
      {chips.map((c) => <Chip key={c.label} chip={c} />)}
    </span>
  );
}

function computePlacement(chipRect: DOMRect, tipW: number, tipH: number): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - chipRect.bottom;
  const spaceAbove = chipRect.top;
  const vertical: Placement['vertical'] =
    spaceBelow < tipH + EDGE_MARGIN && spaceAbove > spaceBelow ? 'above' : 'below';
  const wouldOverflowRight = chipRect.left + tipW + EDGE_MARGIN > vw;
  const horizontal: Placement['horizontal'] = wouldOverflowRight ? 'end' : 'start';
  return { vertical, horizontal };
}

function Chip({ chip }: { chip: ChipDef }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const id = useId();
  const chipRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  const openTip = useCallback(() => {
    if (chipRef.current) {
      const rect = chipRef.current.getBoundingClientRect();
      setPlacement(computePlacement(rect, TOOLTIP_EST_WIDTH, TOOLTIP_EST_HEIGHT));
    }
    setOpen(true);
  }, []);

  const closeTip = useCallback(() => setOpen(false), []);

  // Une fois le tooltip monte, on mesure ses dimensions reelles et on
  // repositionne si besoin (peut arriver avec un tooltip plus court que
  // l'estimation par defaut).
  const measureTooltip = useCallback(() => {
    if (!chipRef.current || !tooltipRef.current) return;
    const chipRect = chipRef.current.getBoundingClientRect();
    const tipRect = tooltipRef.current.getBoundingClientRect();
    const next = computePlacement(chipRect, tipRect.width, tipRect.height);
    setPlacement((prev) =>
      prev.vertical === next.vertical && prev.horizontal === next.horizontal ? prev : next,
    );
  }, []);

  return (
    <span
      ref={chipRef}
      className={`parente-metric-chip${open ? ' is-open' : ''} tip-${placement.vertical} tip-align-${placement.horizontal}`}
      tabIndex={0}
      role="button"
      aria-describedby={open ? id : undefined}
      onMouseEnter={openTip}
      onMouseLeave={closeTip}
      onFocus={openTip}
      onBlur={closeTip}
      onKeyDown={(e) => {
        if (e.key === 'Escape') closeTip();
      }}
    >
      <span className="parente-metric-chip-label">{chip.label}</span>
      {chip.value && <span className="parente-metric-chip-value">{chip.value}</span>}
      <svg
        className="parente-metric-chip-info"
        viewBox="0 0 24 24"
        width="11"
        height="11"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      {open && (
        <span
          ref={(el) => { tooltipRef.current = el; if (el) measureTooltip(); }}
          id={id}
          role="tooltip"
          className="parente-metric-chip-tooltip"
        >
          {chip.tooltip}
        </span>
      )}
    </span>
  );
}
