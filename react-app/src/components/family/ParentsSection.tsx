import type { Member, MemberDict } from '../../lib/types';
import { buildLineage } from '../../lib/lineage';
import Avatar from '../ui/Avatar';
import SonghayTerm from '../ui/SonghayTerm';

interface Props {
  person: Member;
  members: MemberDict;
  onNavigate: (id: string) => void;
  onInfo?: (member: Member) => void;
}

interface ParentCardProps {
  parent: Member | null;
  /** Quand on n'a qu'un nom (mother_ref texte plutôt qu'ID), fallback affichable. */
  fallbackName?: string | null;
  /** Position dans le foyer parental, pour calculer le rôle + terme. */
  role: 'father' | 'mother';
  members: MemberDict;
  onNavigate?: (id: string) => void;
  onInfo?: (member: Member) => void;
  fallbackMotherRef?: string;
  personGeneration?: number;
  /** ID de l'autre parent affiché dans la même rangée, pour éviter la
   *  redondance "époux/épouse de [autre parent déjà visible]". */
  otherParentId?: string | null;
}

function ParentCard({
  parent, fallbackName, role, members, onNavigate, onInfo: _onInfo, fallbackMotherRef: _fallbackMotherRef, personGeneration, otherParentId,
}: ParentCardProps) {
  const isFather = role === 'father';
  const roleLabel = isFather ? 'Père' : 'Mère';
  const songhayTerm = isFather ? 'baba' : 'gna';
  const genderClass = isFather ? 'M' : 'F';

  // Parent réel en DB : version enrichie avec lignage + navigation.
  if (parent) {
    const lineage = buildLineage(parent, members, { excludeSpouseId: otherParentId ?? null });
    return (
      <button
        type="button"
        className={`parent-card parent-card--${role}`}
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
    );
  }

  // Parent sans ID (simple nom libre) : carte statique, pas de navigation.
  if (fallbackName) {
    const gen = typeof personGeneration === 'number' ? personGeneration - 1 : null;
    return (
      <div className={`parent-card parent-card--${role} parent-card--static`}>
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

export default function ParentsSection({ person, members, onNavigate, onInfo }: Props) {
  const father = person.father_id && members[person.father_id] ? members[person.father_id] : null;
  const mother = person.mother_ref && members[person.mother_ref] ? members[person.mother_ref] : null;
  const motherFallback = typeof person.mother_ref === 'string' && !mother ? person.mother_ref : null;

  // Si aucune donnée parent, ne pas rendre la section.
  if (!father && !mother && !motherFallback) return null;

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
        />
      </div>
    </section>
  );
}
