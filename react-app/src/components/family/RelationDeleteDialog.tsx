import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RelationConsequence } from '../../lib/relationOps';

interface Props {
  open: boolean;
  consequence: RelationConsequence | null;
  /** Label du bouton de confirmation (terracotta). */
  confirmLabel: string;
  /** Si true, saisie de "SUPPRIMER" requise pour activer le bouton. */
  requireTypeToConfirm?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

/**
 * Modale de confirmation pour retirer une relation. Liste les
 * consequences concretes extraites de describe*. Rappel explicite
 * que les fiches restent intactes (les relations ne sont pas
 * archivees 30 jours — c'est la strategie reservee aux fiches).
 */
export default function RelationDeleteDialog({
  open,
  consequence,
  confirmLabel,
  requireTypeToConfirm = false,
  onConfirm,
  onClose,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setTyped('');
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!busy) onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose, busy]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => {
      const focusTarget = dialogRef.current?.querySelector<HTMLElement>(
        'input, button:not(.edit-dialog-close)',
      );
      focusTarget?.focus();
    });
  }, [open]);

  if (!open || !consequence) return null;

  const canConfirm = !busy && (!requireTypeToConfirm || typed === 'SUPPRIMER');

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="rdd-overlay" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="rdd-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="rdd-title"
        aria-describedby="rdd-body"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="rdd-header">
          <div className="rdd-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 id="rdd-title" className="rdd-title">{consequence.headline}</h2>
        </header>

        <div id="rdd-body" className="rdd-body">
          <div className="rdd-section">
            <p className="rdd-section-label">Consequences :</p>
            <ul className="rdd-items">
              {consequence.items.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ul>
          </div>

          {consequence.warnings.length > 0 && (
            <div className="rdd-section rdd-section--warn">
              <p className="rdd-section-label">A noter :</p>
              <ul className="rdd-items">
                {consequence.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="rdd-preservation">{consequence.preservation}</p>

          {requireTypeToConfirm && (
            <label className="rdd-type-confirm">
              <span>Pour confirmer, saisir <code>SUPPRIMER</code> :</span>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="SUPPRIMER"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          )}
        </div>

        <footer className="rdd-footer">
          <button
            type="button"
            className="rdd-btn rdd-btn--ghost"
            onClick={onClose}
            disabled={busy}
          >
            Annuler
          </button>
          <button
            type="button"
            className="rdd-btn rdd-btn--danger"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {busy ? 'En cours…' : confirmLabel}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
