import type { Member } from '../../lib/types';
import type { ResolvedTag } from '../../lib/culturalTags';

interface Props {
  person: Member;
  tags: ResolvedTag[];
}

/**
 * Note culturelle éditoriale affichée sous le hero de la fiche personne.
 *
 * Comportement :
 * - Si le membre porte un tag culturel connu (ex. koda), on produit une
 *   phrase éditoriale format "{prénom} est le **{court}** de la famille
 *   — [{terme songhay}] dans le langage songhay, {explication longue}."
 * - Sinon, on retombe sur `person.note` s'il existe.
 * - Sinon, on ne rend rien.
 *
 * Le terme songhay est rendu comme un tag inline JetBrains Mono ocre,
 * « benjamin » en Fraunces bold, le reste en Fraunces italique.
 */
export default function CulturalNote({ person, tags }: Props) {
  const firstName = person.first_name ?? person.name.trim().split(/\s+/)[0] ?? person.name;
  const isMale = person.gender === 'M';

  // Préférence : tag koda (explicite ou inféré) → note éditoriale.
  const kodaTag = tags.find((t) => t.tag === 'koda');
  if (kodaTag) {
    return (
      <aside className="person-cultural-note" role="note" lang="fr">
        <p>
          <span>{firstName} est {isMale ? 'le' : 'la'} </span>
          <strong className="cultural-note-emph">benjamin{isMale ? '' : 'e'}</strong>
          <span> de la famille — </span>
          <span className="cultural-note-term" lang="son">koda</span>
          <span> dans le langage songhay, </span>
          <span className="cultural-note-def">
            dernier{isMale ? '' : '-née'}-né{isMale ? '' : 'e'} d&apos;une fratrie,
            souvent objet d&apos;attentions particulières.
          </span>
        </p>
      </aside>
    );
  }

  // Fallback : note saisie librement par l'admin sur la fiche.
  if (person.note) {
    return (
      <aside className="person-cultural-note" role="note">
        <p>{person.note}</p>
      </aside>
    );
  }

  return null;
}
