import { useState, useMemo, useEffect } from 'react';
import type { Member, MemberDict } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import {
  getMemberRelations,
  detectConflicts,
  computeMergeChanges,
  computeMergeResult,
  performMerge,
  filterActiveMembersDict,
} from '../../lib/mergeUtils';

type Step = 1 | 2 | 3;

interface Props {
  members: MemberDict;
  onClose: () => void;
  onMerged: () => Promise<void>;
}

export default function MergeModal({ members, onClose, onMerged }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [searchSource, setSearchSource] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Filter out merged members
  const activeMembers = useMemo(() => filterActiveMembersDict(members), [members]);
  const memberList = useMemo(() => Object.values(activeMembers), [activeMembers]);

  const source = sourceId ? activeMembers[sourceId] : null;
  const target = targetId ? activeMembers[targetId] : null;

  // Filter members for search
  const filterMembers = (query: string, excludeId?: string) => {
    if (!query) return [];
    const q = query.toLowerCase();
    return memberList
      .filter(
        (m) =>
          m.id !== excludeId &&
          (m.name.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            m.alias?.toLowerCase().includes(q))
      )
      .slice(0, 6);
  };

  const resultsSource = filterMembers(searchSource, targetId);
  const resultsTarget = filterMembers(searchTarget, sourceId);

  // Get relations
  const sourceRels = useMemo(
    () => (sourceId ? getMemberRelations(sourceId, activeMembers) : null),
    [sourceId, activeMembers]
  );
  const targetRels = useMemo(
    () => (targetId ? getMemberRelations(targetId, activeMembers) : null),
    [targetId, activeMembers]
  );

  // Conflicts
  const conflicts = useMemo(() => {
    if (!sourceId || !targetId) return [];
    return detectConflicts(sourceId, targetId, activeMembers);
  }, [sourceId, targetId, activeMembers]);

  // Changes for step 2
  const changes = useMemo(() => {
    if (!sourceId || !targetId) return null;
    return computeMergeChanges(sourceId, targetId, activeMembers);
  }, [sourceId, targetId, activeMembers]);

  // Result preview for step 2
  const mergeResult = useMemo(() => {
    if (!sourceId || !targetId) return null;
    return computeMergeResult(sourceId, targetId, activeMembers);
  }, [sourceId, targetId, activeMembers]);

  // Validation
  const canProceed = sourceId && targetId && sourceId !== targetId;
  const isConfirmValid = source && confirmInput.trim().toLowerCase() === source.name.toLowerCase();

  const selectSource = (m: Member) => {
    setSourceId(m.id);
    setSearchSource('');
  };

  const selectTarget = (m: Member) => {
    setTargetId(m.id);
    setSearchTarget('');
  };

  const goToStep = (s: Step) => {
    setStep(s);
  };

  const handleMerge = async () => {
    if (!sourceId || !targetId || !isConfirmValid || !userId) return;

    setMerging(true);
    setError(null);

    try {
      const result = await performMerge(
        sourceId,
        targetId,
        { transferNote: true, performedBy: userId },
        activeMembers,
        supabase
      );

      if (!result.success) {
        setError(result.error || 'Erreur lors de la fusion');
        setMerging(false);
        return;
      }

      await onMerged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la fusion');
      setMerging(false);
    }
  };

  const getInitials = (m: Member) => {
    const parts = m.name.split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  };

  // Render stepper dots
  const renderStepper = () => (
    <div className="mg-stepper">
      <div className={`mg-dot ${step >= 1 ? (step > 1 ? 'done' : 'on') : ''}`} />
      <div className={`mg-line ${step > 1 ? 'done' : ''}`} />
      <div className={`mg-dot ${step >= 2 ? (step > 2 ? 'done' : 'on') : ''}`} />
      <div className={`mg-line ${step > 2 ? 'done' : ''}`} />
      <div className={`mg-dot ${step >= 3 ? 'on' : ''}`} />
    </div>
  );

  // Render relations mini
  const renderRelations = (rels: ReturnType<typeof getMemberRelations>) => (
    <div className="mg-rels">
      <div className="mg-rel-row">
        <span className="mg-rel-label">Père</span>
        <span className="mg-rel-val">{rels.father?.name || '—'}</span>
      </div>
      <div className="mg-rel-row">
        <span className="mg-rel-label">Mère</span>
        <span className="mg-rel-val">{rels.mother?.name || '—'}</span>
      </div>
      <div className="mg-rel-row">
        <span className="mg-rel-label">Conjoint</span>
        <span className="mg-rel-val">
          {rels.spouses.length > 0 ? rels.spouses.map((s) => s.name).join(', ') : '—'}
        </span>
        {rels.spouses.length > 0 && (
          <span className="mg-rel-count">{rels.spouses.length}</span>
        )}
      </div>
      <div className="mg-rel-row">
        <span className="mg-rel-label">Enfants</span>
        <span className="mg-rel-val">
          {rels.children.length > 0 ? rels.children.map((c) => c.name).join(', ') : '—'}
        </span>
        <span className="mg-rel-count">{rels.children.length}</span>
      </div>
    </div>
  );

  return (
    <div className="mg-overlay" onClick={onClose}>
      <div className="mg-modal" onClick={(e) => e.stopPropagation()}>
        {/* ═══ STEP 1 — SELECTION ═══ */}
        {step === 1 && (
          <div className="mg-step">
            {renderStepper()}

            <div className="mg-cols">
              {/* LEFT: Source (to delete) */}
              <div className={`mg-side del ${source ? 'has-person' : ''}`}>
                <div className="mg-side-badge">Sera supprimé</div>
                {source && (
                  <button
                    className="mg-clear"
                    onClick={() => setSourceId('')}
                    type="button"
                    title="Désélectionner"
                  >
                    ✕
                  </button>
                )}
                {!source ? (
                  <div className="mg-search-wrap">
                    <input
                      type="text"
                      placeholder="Rechercher le doublon..."
                      value={searchSource}
                      onChange={(e) => setSearchSource(e.target.value)}
                      className="mg-search"
                    />
                    {resultsSource.length > 0 && (
                      <div className="mg-results">
                        {resultsSource.map((m) => (
                          <button
                            key={m.id}
                            className="mg-result"
                            onClick={() => selectSource(m)}
                            type="button"
                          >
                            <span className={`mg-result-av ${m.gender === 'M' ? 'm' : 'f'}`}>
                              {getInitials(m)}
                            </span>
                            <span className="mg-result-info">
                              <strong>{m.name}</strong>
                              <small>
                                Gén. {m.generation} · {m.gender === 'M' ? '♂' : '♀'}
                              </small>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mg-person">
                    <div className={`mg-av ${source.gender === 'M' ? 'm' : 'f'}`}>
                      {getInitials(source)}
                    </div>
                    <div className="mg-name">{source.name}</div>
                    <div className="mg-meta">
                      Gén. {source.generation} · {source.gender === 'M' ? '♂ Homme' : '♀ Femme'}
                    </div>
                    {sourceRels && renderRelations(sourceRels)}
                    <div className="mg-total-rel">
                      {sourceRels?.totalCount || 0} relations seront transférées
                    </div>
                  </div>
                )}
              </div>

              {/* ARROW */}
              <div className="mg-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* RIGHT: Target (to keep) */}
              <div className={`mg-side keep ${target ? 'has-person' : ''}`}>
                <div className="mg-side-badge">Sera conservé</div>
                {target && (
                  <button
                    className="mg-clear"
                    onClick={() => setTargetId('')}
                    type="button"
                    title="Désélectionner"
                  >
                    ✕
                  </button>
                )}
                {!target ? (
                  <div className="mg-search-wrap">
                    <input
                      type="text"
                      placeholder="Rechercher l'original..."
                      value={searchTarget}
                      onChange={(e) => setSearchTarget(e.target.value)}
                      className="mg-search"
                    />
                    {resultsTarget.length > 0 && (
                      <div className="mg-results">
                        {resultsTarget.map((m) => (
                          <button
                            key={m.id}
                            className="mg-result"
                            onClick={() => selectTarget(m)}
                            type="button"
                          >
                            <span className={`mg-result-av ${m.gender === 'M' ? 'm' : 'f'}`}>
                              {getInitials(m)}
                            </span>
                            <span className="mg-result-info">
                              <strong>{m.name}</strong>
                              <small>
                                Gén. {m.generation} · {m.gender === 'M' ? '♂' : '♀'}
                              </small>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mg-person">
                    <div className={`mg-av ${target.gender === 'M' ? 'm' : 'f'}`}>
                      {getInitials(target)}
                    </div>
                    <div className="mg-name">{target.name}</div>
                    <div className="mg-meta">
                      Gén. {target.generation} · {target.gender === 'M' ? '♂ Homme' : '♀ Femme'}
                    </div>
                    {targetRels && renderRelations(targetRels)}
                    <div className="mg-total-rel keep">
                      {targetRels?.totalCount || 0} relations existantes
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts */}
            {conflicts.length > 0 && (
              <div className="mg-alerts">
                {conflicts.map((c, i) => (
                  <div key={i} className={`mg-alert a-${c.type}`}>
                    <span className="mg-alert-ico">{c.icon}</span>
                    <b>{c.title}</b> — {c.message}
                  </div>
                ))}
              </div>
            )}

            {sourceId && targetId && sourceId === targetId && (
              <div className="mg-alerts">
                <div className="mg-alert a-danger">
                  <span className="mg-alert-ico">⛔</span>
                  <b>Erreur</b> — Impossible de fusionner un membre avec lui-même
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mg-foot">
              <button className="mg-btn ghost" onClick={onClose} type="button">
                Annuler
              </button>
              <button
                className="mg-btn next"
                onClick={() => goToStep(2)}
                disabled={!canProceed}
                type="button"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2 — PREVIEW ═══ */}
        {step === 2 && changes && mergeResult && (
          <div className="mg-step">
            {renderStepper()}

            <div className="mg-changes">
              {/* Parents */}
              {changes.parents.length > 0 && (
                <div className="mg-ch-group">
                  <div className="mg-ch-title">Parents</div>
                  {changes.parents.map((ch, i) => (
                    <div key={i} className="mg-ch-row">
                      <div className={`mg-ch-ico ${ch.type}`}>{ch.icon}</div>
                      <div className="mg-ch-txt">{ch.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Spouses */}
              {changes.spouses.length > 0 && (
                <div className="mg-ch-group">
                  <div className="mg-ch-title">Conjoints</div>
                  {changes.spouses.map((ch, i) => (
                    <div key={i} className="mg-ch-row">
                      <div className={`mg-ch-ico ${ch.type}`}>{ch.icon}</div>
                      <div className="mg-ch-txt">{ch.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Children */}
              {changes.children.length > 0 && (
                <div className="mg-ch-group">
                  <div className="mg-ch-title">Enfants</div>
                  {changes.children.map((ch, i) => (
                    <div key={i} className="mg-ch-row">
                      <div className={`mg-ch-ico ${ch.type}`}>{ch.icon}</div>
                      <div className="mg-ch-txt">{ch.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              <div className="mg-ch-group">
                <div className="mg-ch-title">Notes</div>
                {changes.notes.map((ch, i) => (
                  <div key={i} className="mg-ch-row">
                    <div className={`mg-ch-ico ${ch.type}`}>{ch.icon}</div>
                    <div className="mg-ch-txt">{ch.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="mg-summary">
              <span>↗ {changes.summary.transferred} transférées</span>
              <span>·</span>
              <span>⚠ {changes.summary.conflicts} conflits</span>
              <span>·</span>
              <span>✓ {changes.summary.unchanged} inchangées</span>
            </div>

            {/* Result preview */}
            <div className="mg-result-card">
              <div className="mg-result-label">✓ Résultat après fusion — Fiche conservée</div>
              <div className="mg-result-top">
                <div className={`mg-av sm ${mergeResult.gender === 'M' ? 'm' : 'f'}`}>
                  {getInitials({ name: mergeResult.name } as Member)}
                </div>
                <div>
                  <div className="mg-result-name">{mergeResult.name}</div>
                  <div className="mg-result-meta">
                    Gén. {mergeResult.generation} ·{' '}
                    {mergeResult.gender === 'M' ? '♂ Homme' : '♀ Femme'}
                  </div>
                </div>
              </div>
              <div className="mg-result-rels">
                <div className="mg-rr">
                  <div className="mg-rr-label">Parents</div>
                  <div className="mg-rr-list">
                    Père : {mergeResult.father?.name || '—'}
                    <br />
                    Mère : {mergeResult.mother?.name || '—'}
                  </div>
                </div>
                <div className="mg-rr">
                  <div className="mg-rr-label">Conjoints</div>
                  <div className="mg-rr-list">
                    {mergeResult.spouses.length === 0 && '—'}
                    {mergeResult.spouses.map((s) => (
                      <span
                        key={s.id}
                        className={mergeResult.newSpouses.some((ns) => ns.id === s.id) ? 'new' : ''}
                      >
                        {mergeResult.newSpouses.some((ns) => ns.id === s.id) && '+ '}
                        {s.name}
                        <br />
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mg-rr">
                  <div className="mg-rr-label">Enfants</div>
                  <div className="mg-rr-list">
                    {mergeResult.children.length === 0 && '—'}
                    {mergeResult.children.map((c) => (
                      <span
                        key={c.id}
                        className={
                          mergeResult.newChildren.some((nc) => nc.id === c.id) ? 'new' : ''
                        }
                      >
                        {mergeResult.newChildren.some((nc) => nc.id === c.id) && '+ '}
                        {c.name}
                        <br />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mg-foot">
              <button className="mg-btn ghost" onClick={() => goToStep(1)} type="button">
                ← Retour
              </button>
              <button className="mg-btn danger" onClick={() => goToStep(3)} type="button">
                Confirmer la fusion →
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3 — CONFIRMATION ═══ */}
        {step === 3 && source && target && changes && (
          <div className="mg-step">
            {renderStepper()}

            <div className="mg-confirm-zone">
              <div className="mg-confirm-icon">⚠️</div>
              <div className="mg-confirm-text">
                <span className="del-name">{source.name}</span> (Gén. {source.generation},{' '}
                {source.gender === 'M' ? 'Homme' : 'Femme'}) sera supprimé(e).
                <br />
                <br />
                Ses {changes.summary.transferred} relations seront transférées à{' '}
                <span className="keep-name">{target.name}</span> (Gén. {target.generation},{' '}
                {target.gender === 'M' ? 'Homme' : 'Femme'}).
              </div>
              <div className="mg-rollback-notice">
                <span className="mg-rollback-icon">↩</span>
                Cette fusion peut être annulée pendant <strong>30 jours</strong> depuis
                l'historique des fusions.
              </div>

              <div className="mg-confirm-input">
                <label>Pour confirmer, tapez le nom de la personne à supprimer :</label>
                <input
                  type="text"
                  placeholder={source.name}
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className={isConfirmValid ? 'valid' : ''}
                />
                <div className="mg-confirm-hint">
                  Tapez exactement : <b>{source.name}</b>
                </div>
              </div>

              {error && <div className="mg-error">{error}</div>}
            </div>

            {/* Footer */}
            <div className="mg-foot">
              <button
                className="mg-btn ghost"
                onClick={() => goToStep(2)}
                disabled={merging}
                type="button"
              >
                ← Retour
              </button>
              <button
                className="mg-btn danger"
                onClick={handleMerge}
                disabled={!isConfirmValid || merging || !userId}
                type="button"
              >
                {merging ? 'Fusion en cours...' : '🔗 Confirmer la fusion'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
