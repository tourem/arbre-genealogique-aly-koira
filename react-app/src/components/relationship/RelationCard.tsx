import { useState } from 'react';
import type { SonghoyRelationResult } from '../../lib/types';
import RelationPathGraph from './RelationPathGraph';
import TreePathModal from './TreePathModal';

interface Props {
  result: SonghoyRelationResult;
  personAName: string;
  personBName: string;
  index: number;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getCategoryClass(code: string): string {
  if (code === 'GRANDPARENT' || code === 'PARENT') return 'kaaga';
  if (code === 'COUSINS_PATRI') return 'cousin';
  if (code === 'COUSINS_CROSS') return 'cross';
  if (code === 'UNCLE_AUNT' || code === 'NEPHEW_NIECE') return 'uncle';
  if (code === 'COUSINS_MATRI') return 'matri';
  if (code === 'SIBLINGS' || code === 'HALF_SIBLINGS') return 'sibling';
  return 'kaaga';
}

function getCategoryIcon(code: string): string {
  if (code === 'GRANDPARENT' || code === 'PARENT') return '\uD83D\uDC51';
  if (code === 'SIBLINGS' || code === 'HALF_SIBLINGS') return '\uD83D\uDC65';
  if (
    code === 'COUSINS_PATRI' ||
    code === 'COUSINS_MATRI' ||
    code === 'COUSINS_CROSS'
  )
    return '\uD83D\uDD17';
  if (code === 'UNCLE_AUNT' || code === 'NEPHEW_NIECE') return '\uD83D\uDC6A';
  return '\uD83D\uDC51';
}

const ArrowSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" style={{ width: 24, height: 24 }}>
    <path
      d="M4 12h16m-5-5 5 5-5 5"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function RelationCard({
  result,
  personAName,
  personBName,
  index,
}: Props) {
  const {
    commonAncestor,
    category,
    termAtoB,
    termBtoA,
    additionalTermAtoB,
    additionalTermBtoA,
    pathA,
    pathB,
    details,
  } = result;

  const [showTree, setShowTree] = useState(false);
  const catClass = getCategoryClass(category.code);
  const catIcon = getCategoryIcon(category.code);
  const distance = details.distanceA + details.distanceB;
  const personAGender = pathA.length > 0 ? pathA[0].gender : 'M';
  const personBGender = pathB.length > 0 ? pathB[0].gender : 'M';

  return (
    <div
      className={`parente-rc${index > 0 ? ' dim' : ''}`}
      style={index > 0 ? { animationDelay: `${index * 0.12}s` } : undefined}
    >
      {/* Card header with colored band */}
      <div className={`parente-rh ${catClass}`}>
        <div className="parente-rh-l">
          <div className="parente-ci">{catIcon}</div>
          <div>
            <div className="parente-cn">
              {category.label_songhoy || category.label_fr.toUpperCase()}
            </div>
            <div className="parente-ct">{category.label_fr}</div>
          </div>
        </div>
        <div className="parente-db">
          <div className="parente-dv">{distance}</div>
          <div className="parente-dl">distance</div>
        </div>
      </div>

      {/* Card body */}
      <div className="parente-rb">
        {/* Relation A → B */}
        {termAtoB && (
          <>
            <div className="parente-rr">
              <div className="parente-rw">
                <div
                  className={`parente-ra ${personAGender === 'F' ? 'f' : 'm'}`}
                >
                  {getInitials(personAName)}
                </div>
                <div className="parente-rn" title={personAName}>
                  {personAName}
                </div>
              </div>
              <div className="parente-arrow">
                <ArrowSvg />
              </div>
              <div className="parente-rt">
                <div className="parente-sg xl c1">
                  {termAtoB.term_songhoy}
                </div>
                <div className="parente-td">{termAtoB.label_fr}</div>
              </div>
            </div>
            <div className="parente-sp" />
          </>
        )}

        {/* Relation B → A */}
        {termBtoA && (
          <div className="parente-rr">
            <div className="parente-rw">
              <div
                className={`parente-ra ${personBGender === 'F' ? 'f' : 'm'}`}
              >
                {getInitials(personBName)}
              </div>
              <div className="parente-rn" title={personBName}>
                {personBName}
              </div>
            </div>
            <div className="parente-arrow">
              <ArrowSvg />
            </div>
            <div className="parente-rt">
              <div className="parente-sg lg c2">{termBtoA.term_songhoy}</div>
              <div className="parente-td">{termBtoA.label_fr}</div>
            </div>
          </div>
        )}

        {/* No terms */}
        {!termAtoB && !termBtoA && (
          <div className="parente-rr">
            <div className="parente-rt">
              <div className="parente-td">{details.labelFr}</div>
            </div>
          </div>
        )}

        {/* Additional terms */}
        {(additionalTermAtoB || additionalTermBtoA) && (
          <div className="parente-add">
            <div className="parente-add-label">S'appellent aussi :</div>
            {additionalTermAtoB && (
              <div className="parente-rr">
                <div className="parente-rw">
                  <div
                    className={`parente-ra ${personAGender === 'F' ? 'f' : 'm'}`}
                  >
                    {getInitials(personAName)}
                  </div>
                  <div className="parente-rn">{personAName}</div>
                </div>
                <div className="parente-arrow">
                  <ArrowSvg />
                </div>
                <div className="parente-rt">
                  <div className="parente-sg lg c1">
                    {additionalTermAtoB.term_songhoy}
                  </div>
                  <div className="parente-td">
                    {additionalTermAtoB.label_fr}
                  </div>
                </div>
              </div>
            )}
            {additionalTermBtoA && (
              <div className="parente-rr">
                <div className="parente-rw">
                  <div
                    className={`parente-ra ${personBGender === 'F' ? 'f' : 'm'}`}
                  >
                    {getInitials(personBName)}
                  </div>
                  <div className="parente-rn">{personBName}</div>
                </div>
                <div className="parente-arrow">
                  <ArrowSvg />
                </div>
                <div className="parente-rt">
                  <div className="parente-sg lg c2">
                    {additionalTermBtoA.term_songhoy}
                  </div>
                  <div className="parente-td">
                    {additionalTermBtoA.label_fr}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Heritage Path */}
        <RelationPathGraph
          pathA={pathA}
          pathB={pathB}
          ancestor={commonAncestor}
        />

        {/* Tree view button */}
        <button
          className="parente-tree-btn"
          onClick={() => setShowTree(true)}
        >
          {'\uD83C\uDF33'} Voir sous forme d&apos;arbre
        </button>

        {showTree && (
          <TreePathModal
            pathA={pathA}
            pathB={pathB}
            ancestor={commonAncestor}
            personAName={personAName}
            personBName={personBName}
            onClose={() => setShowTree(false)}
          />
        )}

        {/* Ancestor box */}
        <div className="parente-ab">
          <span className="parente-ab-st">{'\u2605'}</span>
          <p>
            Ancetre commun : <b>{commonAncestor.name}</b> — Distance{' '}
            {details.distanceA} {'\u2192'} {details.distanceB}
          </p>
        </div>
      </div>
    </div>
  );
}
