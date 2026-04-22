import type { Member, MemberDict } from '../../lib/types';
import { resolveTags } from '../../lib/culturalTags';
import { formatOrdinal } from '../../lib/ordinal';
import Avatar from '../ui/Avatar';
import SonghayTerm from '../ui/SonghayTerm';
import CulturalNote from './CulturalNote';

interface Props {
  person: Member;
  members: MemberDict;
  spouseCount?: number;
  childrenCount?: number;
}

export default function PersonHero({ person, members, spouseCount = 0, childrenCount = 0 }: Props) {
  const isMale = person.gender === 'M';
  const tags = resolveTags(person, members);
  const genText = person.generation === 0
    ? 'Ancêtre'
    : `${formatOrdinal(person.generation, 'F')} génération`;

  return (
    <section className="person-hero" aria-labelledby="person-hero-name">
      <div className="person-hero-avatar">
        <Avatar name={person.name} gender={person.gender} generation={person.generation} size="lg" />
      </div>

      <div className="person-hero-main">
        <h1 id="person-hero-name" className="person-hero-name-block">
          <span className="person-hero-name">{person.name}</span>
          <span className="person-hero-clan" aria-label="Clan Aly Koïra">Aly Ko<em>ï</em>ra</span>
        </h1>

        <div className="person-hero-meta">
          <span className="person-hero-meta-item">
            <span className={`sex-glyph ${isMale ? 'sex-glyph--male' : 'sex-glyph--female'}`} aria-hidden="true">
              {isMale ? '♂' : '♀'}
            </span>
            <span>{genText}</span>
          </span>

          {person.alias && (
            <>
              <span className="person-hero-meta-sep" aria-hidden="true">·</span>
              <span className="person-hero-meta-item">
                <em className="person-hero-alias">« {person.alias} »</em>
              </span>
            </>
          )}

          {tags.length > 0 && (
            <>
              <span className="person-hero-meta-sep" aria-hidden="true">·</span>
              <span className="person-hero-tags">
                {tags.map(({ tag, source }) => (
                  <span key={tag} className={`cultural-tag cultural-tag--${source}`}>
                    <span className="cultural-tag-dot" aria-hidden="true" />
                    <SonghayTerm term={tag} variant="inline" />
                    {source === 'inferred' && (
                      <span className="cultural-tag-source-hint" aria-label="tag suggéré, à confirmer">
                        suggéré
                      </span>
                    )}
                  </span>
                ))}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="person-hero-stats">
        {spouseCount > 0 && (
          <div className="person-hero-stat">
            <div className="person-hero-stat-num">{spouseCount}</div>
            <div className="person-hero-stat-label">
              {isMale
                ? (spouseCount > 1 ? 'Épouses' : 'Épouse')
                : 'Époux'}
            </div>
          </div>
        )}
        <div className="person-hero-stat">
          <div className="person-hero-stat-num">{childrenCount}</div>
          <div className="person-hero-stat-label">{childrenCount > 1 ? 'Enfants' : 'Enfant'}</div>
        </div>
      </div>

      <CulturalNote person={person} tags={tags} />
    </section>
  );
}
