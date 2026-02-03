import type { SonghoyRelationResult } from '../../lib/types';
import RelationPathGraph from './RelationPathGraph';

interface Props {
  result: SonghoyRelationResult;
  personAName: string;
  personBName: string;
}

export default function RelationCard({
  result,
  personAName,
  personBName,
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

  return (
    <div className="relation-card">
      {/* Category header */}
      <div className="relation-card-header">
        <div className="relation-card-category-block">
          {category.label_songhoy && (
            <span className="relation-card-category-songhoy">
              {category.label_songhoy}
            </span>
          )}
          <span className="relation-card-category">{category.label_fr}</span>
        </div>
        <span className="relation-card-distance">
          {details.distanceA + details.distanceB === 2
            ? 'Direct'
            : `Distance ${details.distanceA + details.distanceB}`}
        </span>
      </div>

      {/* Main terms display */}
      <div className="relation-card-terms">
        {termAtoB && (
          <div className="relation-card-term-row">
            <span className="relation-card-person">{personAName}</span>
            <span className="relation-card-arrow">{'\u2192'}</span>
            <div className="relation-card-term-block">
              <span className="relation-songhoy-term">
                {termAtoB.term_songhoy}
              </span>
              <span className="relation-card-label-fr">
                {termAtoB.label_fr}
              </span>
            </div>
          </div>
        )}
        {termBtoA && (
          <div className="relation-card-term-row">
            <span className="relation-card-person">{personBName}</span>
            <span className="relation-card-arrow">{'\u2192'}</span>
            <div className="relation-card-term-block">
              <span className="relation-songhoy-term">
                {termBtoA.term_songhoy}
              </span>
              <span className="relation-card-label-fr">
                {termBtoA.label_fr}
              </span>
            </div>
          </div>
        )}
        {!termAtoB && !termBtoA && (
          <div className="relation-card-term-row">
            <span className="relation-card-label-fr">
              {details.labelFr}
            </span>
          </div>
        )}
      </div>

      {/* Additional terms (e.g. WAYUHINKAYE + ARMA/WEYMA) */}
      {(additionalTermAtoB || additionalTermBtoA) && (
        <div className="relation-card-additional">
          <span className="relation-card-additional-label">
            S'appellent aussi :
          </span>
          <div className="relation-card-terms">
            {additionalTermAtoB && (
              <div className="relation-card-term-row">
                <span className="relation-card-person">{personAName}</span>
                <span className="relation-card-arrow">{'\u2192'}</span>
                <div className="relation-card-term-block">
                  <span className="relation-songhoy-term additional">
                    {additionalTermAtoB.term_songhoy}
                  </span>
                  <span className="relation-card-label-fr">
                    {additionalTermAtoB.label_fr}
                  </span>
                </div>
              </div>
            )}
            {additionalTermBtoA && (
              <div className="relation-card-term-row">
                <span className="relation-card-person">{personBName}</span>
                <span className="relation-card-arrow">{'\u2192'}</span>
                <div className="relation-card-term-block">
                  <span className="relation-songhoy-term additional">
                    {additionalTermBtoA.term_songhoy}
                  </span>
                  <span className="relation-card-label-fr">
                    {additionalTermBtoA.label_fr}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual graph */}
      <RelationPathGraph
        pathA={pathA}
        pathB={pathB}
        ancestor={commonAncestor}
      />

      {/* Details footer */}
      <div className="relation-card-footer">
        <span className="relation-card-ancestor">
          Ancetre commun : {commonAncestor.name}
        </span>
        <span className="relation-card-distances">
          {personAName} {'\u2190'} {details.distanceA} &middot;{' '}
          {details.distanceB} {'\u2192'} {personBName}
        </span>
      </div>
    </div>
  );
}
