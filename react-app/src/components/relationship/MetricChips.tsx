import { useId, useState } from 'react';
import type { RelationGroup } from './groupRelations';

interface Props {
  group: RelationGroup;
}

interface ChipDef {
  label: string;
  value?: string;
  tooltip: string;
}

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
  const worst = group.paths[group.paths.length - 1];
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

  if (pathCount > 1) {
    const delta = worst.proximityScore - best.proximityScore;
    if (delta > 0) {
      chips.push({
        label: 'Écart',
        value: `+${delta}`,
        tooltip: `Différence de proximité entre le chemin le plus court et le plus long : ${delta} génération${delta > 1 ? 's' : ''}.`,
      });
    }
  }

  return (
    <span className="parente-metric-chips" role="group" aria-label="Métriques de la relation">
      {chips.map((c) => <Chip key={c.label} chip={c} />)}
    </span>
  );
}

function Chip({ chip }: { chip: ChipDef }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span
      className={`parente-metric-chip${open ? ' is-open' : ''}`}
      tabIndex={0}
      role="button"
      aria-describedby={open ? id : undefined}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      <span className="parente-metric-chip-label">{chip.label}</span>
      {chip.value && <span className="parente-metric-chip-value">{chip.value}</span>}
      <span className="parente-metric-chip-info" aria-hidden="true">ⓘ</span>
      {open && (
        <span id={id} role="tooltip" className="parente-metric-chip-tooltip">
          {chip.tooltip}
        </span>
      )}
    </span>
  );
}
