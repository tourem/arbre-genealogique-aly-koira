import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import type { MergeHistory, MergeSnapshot, MergeOperation } from '../../lib/types';
import { fetchMergeHistory, revertMerge, canRevertMerge } from '../../lib/mergeUtils';

interface Props {
  onReverted?: () => Promise<void>;
}

type FilterType = 'all' | 'active' | 'reverted' | 'expired';

export default function MergeHistorySection({ onReverted }: Props) {
  const [history, setHistory] = useState<MergeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Filter and search state
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail panel state
  const [selectedMerge, setSelectedMerge] = useState<MergeHistory | null>(null);

  // Revert confirmation modal
  const [confirmRevert, setConfirmRevert] = useState<MergeHistory | null>(null);
  const [reverting, setReverting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const data = await fetchMergeHistory(supabase);
    setHistory(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = history.length;
    const active = history.filter((h) => h.status === 'ACTIVE').length;
    const reverted = history.filter((h) => h.status === 'REVERTED').length;
    const expired = history.filter((h) => h.status === 'EXPIRED').length;
    return { total, active, reverted, expired };
  }, [history]);

  // Filtered history
  const filteredHistory = useMemo(() => {
    let result = history;

    // Filter by status
    if (filter !== 'all') {
      result = result.filter((h) => h.status.toLowerCase() === filter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (h) =>
          h.source_name?.toLowerCase().includes(query) ||
          h.target_name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [history, filter, searchQuery]);

  // Handle revert
  const handleRevert = async () => {
    if (!confirmRevert || !userId) return;

    setReverting(true);
    const result = await revertMerge(confirmRevert.id, userId, supabase);

    if (result.success) {
      setToast({
        message: `Fusion annulée. ${confirmRevert.source_name} a été restauré(e).`,
        type: 'success',
      });
      setConfirmRevert(null);
      setSelectedMerge(null);
      await loadHistory();
      if (onReverted) {
        await onReverted();
      }
    } else {
      setToast({
        message: result.error || 'Erreur lors de l\'annulation',
        type: 'error',
      });
    }

    setReverting(false);
  };

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Format relative date
  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} jours`;
  };

  // Format absolute date
  const formatAbsoluteDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format full date with time
  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get initials
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Get time bar color class
  const getTimeBarColor = (daysRemaining: number) => {
    if (daysRemaining > 20) return 'green';
    if (daysRemaining > 10) return 'orange';
    return 'red';
  };

  // Get expiration date
  const getExpirationDate = (performedAt: string) => {
    const date = new Date(performedAt);
    date.setDate(date.getDate() + 30);
    return formatAbsoluteDate(date.toISOString());
  };

  // Open revert from row (stop propagation)
  const handleRevertClick = (e: React.MouseEvent, h: MergeHistory) => {
    e.stopPropagation();
    setConfirmRevert(h);
  };

  if (loading) {
    return (
      <div className="admin-section">
        <p style={{ textAlign: 'center', padding: '40px', color: 'var(--adm-t3)' }}>
          Chargement de l'historique...
        </p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      {/* Stats bar */}
      <div className="mh-stats-bar">
        <div className="mh-stat-card s-total">
          <div className="mh-stat-val">{stats.total}</div>
          <div className="mh-stat-label">Total fusions</div>
        </div>
        <div className="mh-stat-card s-active">
          <div className="mh-stat-val">{stats.active}</div>
          <div className="mh-stat-label">Actives (annulables)</div>
        </div>
        <div className="mh-stat-card s-reverted">
          <div className="mh-stat-val">{stats.reverted}</div>
          <div className="mh-stat-label">Annulees</div>
        </div>
        <div className="mh-stat-card s-expired">
          <div className="mh-stat-val">{stats.expired}</div>
          <div className="mh-stat-label">Expirees (&gt; 30j)</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mh-filters">
        {(['all', 'active', 'reverted', 'expired'] as FilterType[]).map((f) => (
          <button
            key={f}
            className={`mh-filter-btn ${filter === f ? 'on' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Toutes' : f === 'active' ? 'Actives' : f === 'reverted' ? 'Annulees' : 'Expirees'}
          </button>
        ))}
        <div className="mh-search-wrap">
          <input
            type="text"
            placeholder="Rechercher un nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {filteredHistory.length === 0 ? (
        <div className="mh-empty-state">
          <div className="mh-empty-ico">📜</div>
          <div className="mh-empty-title">Aucune fusion trouvee</div>
          <div className="mh-empty-desc">
            {filter !== 'all' || searchQuery
              ? 'Modifiez vos filtres pour voir plus de resultats.'
              : 'Aucune fusion enregistree pour le moment.'}
          </div>
        </div>
      ) : (
        <div className="mh-table">
          <div className="mh-table-head">
            <span>Date</span>
            <span>Doublon supprime</span>
            <span>Fusionne dans</span>
            <span>Statut</span>
            <span>Temps restant</span>
            <span style={{ textAlign: 'right' }}>Action</span>
          </div>

          {filteredHistory.map((h) => {
            const snapshot = h.snapshot as MergeSnapshot;
            const source = snapshot?.source?.member;
            const target = snapshot?.target?.member;
            const { canRevert } = canRevertMerge(h);
            const daysRemaining = h.days_remaining || 0;
            const barColor = getTimeBarColor(daysRemaining);

            return (
              <div
                key={h.id}
                className="mh-row"
                onClick={() => setSelectedMerge(h)}
              >
                {/* Date */}
                <div className="mh-date">
                  {formatRelativeDate(h.performed_at)}
                  <small>{formatAbsoluteDate(h.performed_at)}</small>
                </div>

                {/* Source (deleted) */}
                <div className={`mh-person ${h.status !== 'REVERTED' ? 'deleted' : ''}`}>
                  <div className={`mh-av ${source?.gender === 'F' ? 'f' : 'm'}`}>
                    {getInitials(h.source_name || '')}
                  </div>
                  <div>
                    <div className="mh-name">{h.source_name}</div>
                    <div className="mh-meta">
                      Gen. {source?.generation || '?'} · {source?.gender === 'F' ? '♀' : '♂'}
                    </div>
                  </div>
                </div>

                {/* Target (kept) */}
                <div className="mh-person">
                  <div className={`mh-av ${target?.gender === 'F' ? 'f' : 'm'}`}>
                    {getInitials(h.target_name || '')}
                  </div>
                  <div>
                    <div className="mh-name">{h.target_name}</div>
                    <div className="mh-meta">
                      Gen. {target?.generation || '?'} · {target?.gender === 'F' ? '♀' : '♂'}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <span
                    className={`mh-status-badge st-${h.status.toLowerCase()}`}
                  >
                    {h.status === 'ACTIVE' && '● Active'}
                    {h.status === 'REVERTED' && '↩ Annulee'}
                    {h.status === 'EXPIRED' && '⏱ Expiree'}
                  </span>
                </div>

                {/* Time remaining */}
                <div>
                  {h.status === 'ACTIVE' && (
                    <>
                      <div className={`mh-time-text ${barColor}`}>
                        {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
                        {daysRemaining < 10 && ' !'}
                      </div>
                      <div className="mh-time-bar-wrap">
                        <div className="mh-time-bar">
                          <div
                            className={`mh-time-bar-fill ${barColor}`}
                            style={{ width: `${(daysRemaining / 30) * 100}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {h.status === 'REVERTED' && (
                    <div className="mh-time-text grey">— annulee —</div>
                  )}
                  {h.status === 'EXPIRED' && (
                    <div className="mh-time-text grey">
                      expire le {getExpirationDate(h.performed_at)}
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="mh-action">
                  {h.status === 'ACTIVE' && canRevert ? (
                    <button
                      className="mh-btn-revert"
                      onClick={(e) => handleRevertClick(e, h)}
                    >
                      ↩ Annuler
                    </button>
                  ) : h.status === 'EXPIRED' ? (
                    <span className="mh-btn-revert disabled">↩ Expire</span>
                  ) : (
                    <span className="mh-no-action">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Panel */}
      <div
        className={`mh-overlay ${selectedMerge ? 'open' : ''}`}
        onClick={() => setSelectedMerge(null)}
      />
      <div className={`mh-detail-panel ${selectedMerge ? 'open' : ''}`}>
        {selectedMerge && (
          <DetailPanelContent
            merge={selectedMerge}
            onClose={() => setSelectedMerge(null)}
            onRevert={() => setConfirmRevert(selectedMerge)}
            formatFullDate={formatFullDate}
            getInitials={getInitials}
            getTimeBarColor={getTimeBarColor}
            getExpirationDate={getExpirationDate}
          />
        )}
      </div>

      {/* Revert Confirmation Modal */}
      <div
        className={`mh-rmodal-overlay ${confirmRevert ? 'open' : ''}`}
        onClick={() => !reverting && setConfirmRevert(null)}
      >
        {confirmRevert && (
          <div className="mh-rmodal" onClick={(e) => e.stopPropagation()}>
            <div className="mh-rmodal-icon">↩</div>
            <div className="mh-rmodal-title">Annuler la fusion ?</div>
            <div className="mh-rmodal-text">
              <span className="del-name">{confirmRevert.source_name}</span> sera
              restaure(e) et ses relations d'origine seront retablies.
              <br />
              Les relations transferees vers{' '}
              <span className="keep-name">{confirmRevert.target_name}</span> seront
              supprimees.
            </div>
            <div className="mh-rmodal-detail">
              <b>Ce qui sera restaure :</b>
              <br />
              • La personne {confirmRevert.source_name}
              <br />
              • Ses relations d'origine
              <br />
              <br />
              <b>Ce qui sera supprime :</b>
              <br />• Les relations transferees a {confirmRevert.target_name}
            </div>
            <div className="mh-rmodal-foot">
              <button
                className="mh-btn-ghost"
                onClick={() => setConfirmRevert(null)}
                disabled={reverting}
              >
                Non, garder
              </button>
              <button
                className="mh-btn-orange"
                onClick={handleRevert}
                disabled={reverting}
              >
                {reverting ? 'En cours...' : 'Oui, annuler la fusion'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <div className={`mh-toast t-${toast?.type || 'success'} ${toast ? 'show' : ''}`}>
        {toast?.type === 'success' ? '✓' : '✕'} {toast?.message}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DETAIL PANEL CONTENT
// ═══════════════════════════════════════════════════════════════════════════

interface DetailPanelProps {
  merge: MergeHistory;
  onClose: () => void;
  onRevert: () => void;
  formatFullDate: (dateStr: string) => string;
  getInitials: (name: string) => string;
  getTimeBarColor: (days: number) => string;
  getExpirationDate: (performedAt: string) => string;
}

function DetailPanelContent({
  merge,
  onClose,
  onRevert,
  formatFullDate,
  getInitials,
  getTimeBarColor,
  getExpirationDate,
}: DetailPanelProps) {
  const snapshot = merge.snapshot as MergeSnapshot;
  const source = snapshot?.source?.member;
  const target = snapshot?.target?.member;
  const operations = (merge.operations || []) as MergeOperation[];
  const { canRevert } = canRevertMerge(merge);
  const daysRemaining = merge.days_remaining || 0;
  const barColor = getTimeBarColor(daysRemaining);

  // Group operations by type
  const groupedOps = useMemo(() => {
    const parents = operations.filter(
      (op) => op.relationshipType === 'FATHER' || op.relationshipType === 'MOTHER'
    );
    const spouses = operations.filter((op) => op.relationshipType === 'SPOUSE');
    const children = operations.filter((op) => op.relationshipType === 'CHILD');
    return { parents, spouses, children };
  }, [operations]);

  // Summary counts
  const summary = useMemo(() => {
    const transferred = operations.filter((op) => op.type === 'TRANSFER').length;
    const conflicts = operations.filter((op) => op.type === 'CONFLICT').length;
    const same = operations.filter((op) => op.type === 'SKIP').length;
    return { transferred, conflicts, same };
  }, [operations]);

  const getOpIcon = (type: string) => {
    if (type === 'TRANSFER') return '↗';
    if (type === 'CONFLICT') return '⚠';
    return '✓';
  };

  const getOpClass = (type: string) => {
    if (type === 'TRANSFER') return 'transfer';
    if (type === 'CONFLICT') return 'conflict';
    return 'same';
  };

  return (
    <>
      <div className="mh-dp-header">
        <div className="mh-dp-title">
          Detail <span>fusion #{merge.id.slice(0, 8)}</span>
        </div>
        <button className="mh-dp-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="mh-dp-body">
        {/* Meta */}
        <div className="mh-dp-meta">
          <div className="mh-dp-meta-item">
            <div className="mh-dp-meta-label">Date de fusion</div>
            <div className="mh-dp-meta-val">{formatFullDate(merge.performed_at)}</div>
          </div>
          <div className="mh-dp-meta-item">
            <div className="mh-dp-meta-label">Admin</div>
            <div className="mh-dp-meta-val">{merge.performer_name}</div>
          </div>
          <div className="mh-dp-meta-item">
            <div className="mh-dp-meta-label">Statut</div>
            <div className="mh-dp-meta-val">
              <span className={`mh-status-badge st-${merge.status.toLowerCase()}`}>
                {merge.status === 'ACTIVE' && '● Active'}
                {merge.status === 'REVERTED' && '↩ Annulee'}
                {merge.status === 'EXPIRED' && '⏱ Expiree'}
              </span>
            </div>
          </div>
          <div className="mh-dp-meta-item">
            <div className="mh-dp-meta-label">Annulation possible jusqu'au</div>
            <div className="mh-dp-meta-val">{getExpirationDate(merge.performed_at)}</div>
          </div>
        </div>

        {/* Persons */}
        <div className="mh-dp-persons">
          <div className="mh-dp-pcard del">
            <div className="mh-dp-pcard-badge">Supprime</div>
            <div className={`p-av ${source?.gender === 'F' ? 'f' : 'm'}`}>
              {getInitials(merge.source_name || '')}
            </div>
            <div className="p-name">{merge.source_name}</div>
            <div className="p-meta">
              Gen. {source?.generation || '?'} · {source?.gender === 'F' ? '♀ Femme' : '♂ Homme'}
            </div>
          </div>
          <div className="mh-dp-arrow">→</div>
          <div className="mh-dp-pcard keep">
            <div className="mh-dp-pcard-badge">Conserve</div>
            <div className={`p-av ${target?.gender === 'F' ? 'f' : 'm'}`}>
              {getInitials(merge.target_name || '')}
            </div>
            <div className="p-name">{merge.target_name}</div>
            <div className="p-meta">
              Gen. {target?.generation || '?'} · {target?.gender === 'F' ? '♀ Femme' : '♂ Homme'}
            </div>
          </div>
        </div>

        {/* Summary chips */}
        <div className="mh-dp-chips">
          {summary.transferred > 0 && (
            <div className="mh-dp-chip c-transfer">↗ {summary.transferred} transferees</div>
          )}
          {summary.conflicts > 0 && (
            <div className="mh-dp-chip c-conflict">⚠ {summary.conflicts} conflits</div>
          )}
          {summary.same > 0 && (
            <div className="mh-dp-chip c-same">✓ {summary.same} identiques</div>
          )}
        </div>

        {/* Operations detail */}
        {groupedOps.parents.length > 0 && (
          <div className="mh-dp-rels">
            <div className="mh-dp-rels-title">Parents</div>
            {groupedOps.parents.map((op, i) => (
              <div key={i} className="mh-dp-rel-row">
                <div className={`mh-dp-rel-ico ${getOpClass(op.type)}`}>{getOpIcon(op.type)}</div>
                <div className="mh-dp-rel-txt">{op.description}</div>
              </div>
            ))}
          </div>
        )}

        {groupedOps.spouses.length > 0 && (
          <div className="mh-dp-rels">
            <div className="mh-dp-rels-title">Conjoints</div>
            {groupedOps.spouses.map((op, i) => (
              <div key={i} className="mh-dp-rel-row">
                <div className={`mh-dp-rel-ico ${getOpClass(op.type)}`}>{getOpIcon(op.type)}</div>
                <div className="mh-dp-rel-txt">
                  <b>{op.personName}</b> — {op.description}
                </div>
              </div>
            ))}
          </div>
        )}

        {groupedOps.children.length > 0 && (
          <div className="mh-dp-rels">
            <div className="mh-dp-rels-title">Enfants</div>
            {groupedOps.children.map((op, i) => (
              <div key={i} className="mh-dp-rel-row">
                <div className={`mh-dp-rel-ico ${getOpClass(op.type)}`}>{getOpIcon(op.type)}</div>
                <div className="mh-dp-rel-txt">
                  <b>{op.personName}</b> — {op.description}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Revert section */}
        {merge.status === 'REVERTED' ? (
          <div className="mh-dp-reverted-banner">
            <span className="ico">✓</span>
            <div className="txt">
              Cette fusion a ete annulee
              {merge.reverted_at && (
                <small>le {formatFullDate(merge.reverted_at)}</small>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`mh-dp-revert-section ${
              merge.status === 'EXPIRED' || !canRevert ? 'expired' : ''
            }`}
          >
            <div className="mh-dp-revert-title">↩ Annuler cette fusion</div>
            <div className="mh-dp-revert-desc">
              L'annulation restaurera <b>{merge.source_name}</b> et retablira toutes ses
              relations d'origine. Les relations transferees vers {merge.target_name}{' '}
              seront supprimees.
            </div>
            <div className="mh-dp-revert-time">
              <div className="mh-dp-revert-countdown">{daysRemaining}j</div>
              <div className="mh-dp-revert-bar">
                <div className="mh-time-bar">
                  <div
                    className={`mh-time-bar-fill ${barColor}`}
                    style={{ width: `${(daysRemaining / 30) * 100}%` }}
                  />
                </div>
                <div className="mh-time-text grey" style={{ fontSize: '9px', marginTop: '2px' }}>
                  restants sur 30 jours
                </div>
              </div>
            </div>
            <button className="mh-btn-revert-big" onClick={onRevert} disabled={!canRevert}>
              ↩ Annuler cette fusion
            </button>
          </div>
        )}
      </div>
    </>
  );
}
