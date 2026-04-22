import type { Member, MemberDict } from '../../lib/types';
import { buildLineage } from '../../lib/lineage';
import Avatar from '../ui/Avatar';
import SonghayTerm from '../ui/SonghayTerm';
import CardActionsMenu from './CardActionsMenu';

interface Props {
  person: Member;
  members: MemberDict;
  onNavigate: (id: string) => void;
  onInfo?: (member: Member) => void;
  /** Admin uniquement : affiche le menu ⋯ avec "Retirer cette relation". */
  showActions?: boolean;
  onDetachParent?: (role: 'father' | 'mother') => void;
}

interface ParentCardProps {
  parent: Member | null;
  fallbackName?: string | null;
  role: 'father' | 'mother';
  members: MemberDict;
  onNavigate?: (id: string) => void;
  onInfo?: (member: Member) => void;
  fallbackMotherRef?: string;
  personGeneration?: number;
  otherParentId?: string | null;
  showActions?: boolean;
  onDetach?: () => void;
}

function ParentCard({
  parent, fallbackName, role, members, onNavigate, onInfo: _onInfo,
  fallbackMotherRef: _fallbackMotherRef, personGeneration, otherParentId,
  showActions, onDetach,
}: ParentCardProps) {
  const isFather = role === 'father';
  const roleLabel = isFather ? 'Père' : 'Mère';
  const songhayTerm = isFather ? 'baba' : 'gna';
  const genderClass = isFather ? 'M' : 'F';

  // Helper : menu ⋯ avec actions sur la relation parent-enfant.
  const renderMenu = (labelTarget: string) => {
    if (!showActions || !onDetach) return null;
    const actions = [];
    if (parent && onNavigate) {
      actions.push({
        label: 'Voir sa fiche',
        onClick: () => onNavigate(parent.id),
      });
    }
    actions.push({
      label: `Retirer ${role === 'father' ? 'le père' : 'la mère'}`,
      onClick: onDetach,
      danger: true,
    });
    return (
      <CardActionsMenu
        actions={actions}
        label={`Actions sur ${labelTarget}`}
      />
    );
  };

  // Parent réel en DB : version enrichie avec lignage + navigation.
  if (parent) {
    const lineage = buildLineage(parent, members, { excludeSpouseId: otherParentId ?? null });
    return (
      <div className={`parent-card parent-card--${role}${showActions ? ' parent-card--has-menu' : ''}`}>
        <button
          type="button"
          className="parent-card-body"
          onClick={() => onNavigate?.(parent.id)}
          aria-label={`Voir la fiche de ${parent.name}`}
        >
          <div className="parent-card-avatar">
            <Avatar name={parent.name} gender={parent.gender} generation={parent.generation} size="md" />
          </div>
          <div className="parent-card-main">
            <div className="parent-card-role">
              <span>{roleLabel}</span>
              <span className="parent-card-role-sep" aria-hidden="true">·</span>
              <SonghayTerm term={songhayTerm} variant="inline" />
            </div>
            <div className="parent-card-name">
              {parent.name}
              {parent.alias && <span className="parent-card-alias"> « {parent.alias} »</span>}
            </div>
            {lineage && <div className="parent-card-lineage">{lineage}</div>}
          </div>
          <svg className="parent-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        {renderMenu(parent.name)}
      </div>
    );
  }

  // Parent sans ID (simple nom libre) : carte statique, pas de navigation.
  if (fallbackName) {
    const gen = typeof personGeneration === 'number' ? personGeneration - 1 : null;
    return (
      <div className={`parent-card parent-card--${role} parent-card--static${showActions ? ' parent-card--has-menu' : ''}`}>
        <div className="parent-card-body parent-card-body--static">
          <div className="parent-card-avatar">
            <Avatar name={fallbackName} gender={genderClass} generation={gen} size="md" />
          </div>
          <div className="parent-card-main">
            <div className="parent-card-role">
              <span>{roleLabel}</span>
              <span className="parent-card-role-sep" aria-hidden="true">·</span>
              <SonghayTerm term={songhayTerm} variant="inline" />
            </div>
            <div className="parent-card-name">{fallbackName}</div>
            <div className="parent-card-lineage parent-card-lineage--muted">Sans fiche détaillée</div>
          </div>
        </div>
        {renderMenu(fallbackName)}
      </div>
    );
  }

  // Parent inconnu : carte placeholder allégée + cliquable pour ajouter.
  return (
    <button
      type="button"
      className={`parent-card parent-card--${role} parent-card--unknown`}
      aria-label={`Ajouter ${role === 'father' ? 'le père' : 'la mère'} manquant${role === 'mother' ? 'e' : ''}`}
      onClick={() => {
        // TODO: wire add-parent modal (Phase ultérieure via FAB > « Compléter un parent »).
        // eslint-disable-next-line no-console
        console.log('add parent', role);
      }}
    >
      <div className="parent-card-avatar parent-card-avatar--placeholder" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="8" r="4" />
          <path d="M3 22v-2a6 6 0 0 1 6-6h3" />
          <line x1="19" y1="14" x2="19" y2="20" />
          <line x1="16" y1="17" x2="22" y2="17" />
        </svg>
      </div>
      <div className="parent-card-main">
        <div className="parent-card-role">
          <span>{roleLabel}</span>
          <span className="parent-card-role-sep" aria-hidden="true">·</span>
          <SonghayTerm term={songhayTerm} variant="inline" />
        </div>
        <div className="parent-card-name parent-card-name--muted">Non renseigné</div>
        <div className="parent-card-add-hint">
          {role === 'father' ? '+ Ajouter le père' : '+ Ajouter la mère'}
        </div>
      </div>
    </button>
  );
}

export default function ParentsSection({
  person, members, onNavigate, onInfo, showActions, onDetachParent,
}: Props) {
  const father = person.father_id && members[person.father_id] ? members[person.father_id] : null;
  const mother = person.mother_ref && members[person.mother_ref] ? members[person.mother_ref] : null;
  const motherFallback = typeof person.mother_ref === 'string' && !mother ? person.mother_ref : null;

  if (!father && !mother && !motherFallback) return null;

  // Les cartes "Retirer" n'ont de sens que si un parent (ID ou ref texte) est présent.
  const hasFather = !!father || !!person.father_id;
  const hasMother = !!mother || !!motherFallback;

  return (
    <section className="parents-section" aria-label="Parents">
      <h2 className="parents-section-title">Parents</h2>
      <div className="parents-grid">
        <ParentCard
          parent={father}
          role="father"
          members={members}
          onNavigate={onNavigate}
          onInfo={onInfo}
          personGeneration={person.generation}
          otherParentId={mother?.id ?? null}
          showActions={showActions && hasFather}
          onDetach={() => onDetachParent?.('father')}
        />
        <ParentCard
          parent={mother}
          fallbackName={motherFallback}
          fallbackMotherRef={person.mother_ref ?? undefined}
          role="mother"
          members={members}
          onNavigate={onNavigate}
          onInfo={onInfo}
          personGeneration={person.generation}
          otherParentId={father?.id ?? null}
          showActions={showActions && hasMother}
          onDetach={() => onDetachParent?.('mother')}
        />
      </div>
    </section>
  );
}
