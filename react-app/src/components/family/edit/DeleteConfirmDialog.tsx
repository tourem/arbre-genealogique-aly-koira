import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  /** Full display name the user must type verbatim to unlock the delete button. */
  personName: string;
  /** Called after the user confirms deletion (button clicked). Should be async. */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  /** Whether a delete request is in flight. */
  busy?: boolean;
}

/**
 * Type-to-confirm deletion dialog layered above the EditPanel.
 * The "Supprimer" button stays disabled until the user types the exact
 * personName.
 */
export default function DeleteConfirmDialog({
  personName,
  onConfirm,
  onCancel,
  busy = false,
}: Props) {
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input after mount.
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        e.stopPropagation();
        onCancel();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel, busy]);

  const matches = typed.trim() === personName.trim();
  const canConfirm = matches && !busy;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canConfirm) void onConfirm();
  };

  return createPortal(
    <div className="edit-delete-overlay" onClick={() => !busy && onCancel()}>
      <div
        className="edit-delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-delete-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="edit-delete-title" className="edit-delete-title">
          Archiver {personName} ?
        </h3>
        <p className="edit-delete-text">
          La fiche sera masquée de l'arbre et des recherches. Ses relations
          familiales restent conservées pendant <strong>30 jours</strong>,
          pour permettre une restauration si besoin. Passé ce délai,
          la fiche sera définitivement supprimée.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="edit-delete-confirm" className="edit-delete-label">
            Tapez le nom exact pour confirmer
          </label>
          <input
            ref={inputRef}
            id="edit-delete-confirm"
            type="text"
            className="edit-input"
            autoComplete="off"
            value={typed}
            placeholder={personName}
            onChange={(e) => setTyped(e.target.value)}
            disabled={busy}
          />
          <div className="edit-delete-actions">
            <button
              type="button"
              className="edit-btn"
              onClick={onCancel}
              disabled={busy}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="edit-danger-btn edit-danger-btn--filled"
              disabled={!canConfirm}
            >
              {busy ? 'Archivage…' : 'Archiver la fiche'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
