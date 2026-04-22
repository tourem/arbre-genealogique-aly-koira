import type { Member, MemberDict } from '../../lib/types';
import { rankLabel, type Foyer } from '../../lib/foyers';
import Avatar from '../ui/Avatar';
import CardActionsMenu from './CardActionsMenu';

interface Props {
  foyer: Foyer;
  personGender: 'M' | 'F';
  members: MemberDict;
  onNavigate: (id: string) => void;
  onInfo?: (member: Member) => void;
  showRank: boolean;
  /** Admin uniquement : affiche les menus ⋯ (header + chaque enfant). */
  showActions?: boolean;
  /** Dissolution du mariage ; undefined si foyer orphelin (pas de conjoint). */
  onDissolve?: () => void;
  /** Detach un enfant de ce foyer. */
  onDetachChild?: (childId: string) => void;
}

export default function FoyerBlock({
  foyer, personGender, members: _members, onNavigate, onInfo: _onInfo, showRank,
  showActions, onDissolve, onDetachChild,
}: Props) {
  const { rank, spouse, spouseName, children, orphan } = foyer;
  const count = children.length;

  const spouseDisplayName = spouse?.name ?? spouseName ?? '';
  const spouseGender: 'M' | 'F' = spouse?.gender ?? (personGender === 'M' ? 'F' : 'M');
  const rankText = orphan ? null : rankLabel(rank, spouseGender);

  const headerActions = showActions && !orphan ? [
    ...(spouse ? [{
      label: 'Voir sa fiche',
      onClick: () => onNavigate(spouse.id),
    }] : []),
    ...(onDissolve ? [{
      label: 'Retirer ce foyer',
      onClick: onDissolve,
      danger: true,
    }] : []),
  ] : null;

  return (
    <article className={`foyer-block${orphan ? ' foyer-block--orphan' : ''}`} aria-label={orphan ? 'Enfants sans conjoint identifié' : `Foyer avec ${spouseDisplayName}`}>
      <header className="foyer-header">
        {!orphan && (
          <div className="foyer-rank" aria-hidden="true">{rank}</div>
        )}
        <div className="foyer-spouse">
          {orphan ? (
            <div className="foyer-spouse-avatar-placeholder" aria-hidden="true">?</div>
          ) : spouse ? (
            <button
              type="button"
              className="foyer-spouse-link"
              onClick={() => onNavigate(spouse.id)}
              aria-label={`Voir la fiche de ${spouse.name}`}
            >
              <Avatar name={spouse.name} gender={spouse.gender} generation={spouse.generation} size="md" />
            </button>
          ) : (
            <div className="foyer-spouse-static">
              <Avatar name={spouseDisplayName || '?'} gender={spouseGender} size="md" />
            </div>
          )}
          <div className="foyer-spouse-info">
            <div className="foyer-spouse-name">
              {orphan ? 'Conjoint non identifié' : spouseDisplayName}
              {spouse?.alias && <span className="foyer-spouse-alias"> « {spouse.alias} »</span>}
            </div>
            {rankText && showRank && (
              <div className="foyer-spouse-rank">{rankText}</div>
            )}
            {!showRank && !orphan && (
              <div className="foyer-spouse-rank">{spouseGender === 'M' ? 'Époux' : 'Épouse'}</div>
            )}
          </div>
        </div>
        <div className="foyer-count" aria-label={`${count} enfant${count > 1 ? 's' : ''}`}>
          <span className="foyer-count-num">{count}</span>
          <span className="foyer-count-label">enfant{count > 1 ? 's' : ''}</span>
        </div>
        {headerActions && headerActions.length > 0 && (
          <CardActionsMenu
            actions={headerActions}
            label={`Actions sur le foyer avec ${spouseDisplayName}`}
          />
        )}
      </header>

      {children.length > 0 && (
        <div className="foyer-descendants" role="list" aria-label="Descendance">
          <div className="foyer-descendants-label">Descendance</div>
          <div className="foyer-descendants-grid">
            {children.map((c) => (
              <div
                key={c.id}
                className={`child-chip${showActions && onDetachChild ? ' child-chip--has-menu' : ''}`}
                role="listitem"
              >
                <button
                  type="button"
                  className="child-chip-body"
                  onClick={() => onNavigate(c.id)}
                  aria-label={`Voir la fiche de ${c.name}`}
                >
                  <Avatar name={c.name} gender={c.gender} size="sm" />
                  <span className="child-chip-main">
                    <span className="child-chip-name">{c.first_name ?? c.name.split(' ')[0] ?? c.name}</span>
                    {c.alias && <span className="child-chip-alias">« {c.alias} »</span>}
                  </span>
                  <span className="child-chip-meta">
                    <span className="child-chip-gen">G{c.generation}</span>
                    <span className="child-chip-sep" aria-hidden="true">·</span>
                    <span className={`child-chip-gender child-chip-gender--${c.gender === 'M' ? 'm' : 'f'}`} aria-hidden="true">
                      {c.gender === 'M' ? '♂' : '♀'}
                    </span>
                  </span>
                </button>
                {showActions && onDetachChild && (
                  <CardActionsMenu
                    actions={[
                      { label: 'Voir sa fiche', onClick: () => onNavigate(c.id) },
                      { label: 'Retirer de ce foyer', onClick: () => onDetachChild(c.id), danger: true },
                    ]}
                    label={`Actions sur ${c.name}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
