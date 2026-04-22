import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  onEdit: () => void;
  onShare: () => void;
  onViewTree: () => void;
  onDelete: () => void;
}

export default function HeroActionsMenu({ onEdit, onShare, onViewTree, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => btnRef.current?.focus());
  }, []);

  const toggle = () => {
    if (!open && btnRef.current) {
      setAnchorRect(btnRef.current.getBoundingClientRect());
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => firstItemRef.current?.focus());
  }, [open]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (btnRef.current) setAnchorRect(btnRef.current.getBoundingClientRect());
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const act = (fn: () => void) => () => {
    fn();
    close();
  };

  const menu = open && anchorRect ? createPortal(
    <>
      <div className="hero-menu-backdrop" onClick={close} aria-hidden="true" />
      <div
        className="hero-menu"
        role="menu"
        aria-label="Actions sur la personne"
        style={{
          top: `${anchorRect.bottom + 6}px`,
          left: `${Math.max(8, anchorRect.right - 240)}px`,
        }}
      >
        <button
          ref={firstItemRef}
          type="button"
          role="menuitem"
          className="hero-menu-item"
          onClick={act(onEdit)}
        >
          <span className="hero-menu-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
          </span>
          <span className="hero-menu-label">Modifier la fiche</span>
          <span className="hero-menu-hint" aria-hidden="true">E</span>
        </button>

        <button
          type="button"
          role="menuitem"
          className="hero-menu-item"
          onClick={act(onShare)}
        >
          <span className="hero-menu-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </span>
          <span className="hero-menu-label">Partager la fiche</span>
        </button>

        <button
          type="button"
          role="menuitem"
          className="hero-menu-item"
          onClick={act(onViewTree)}
        >
          <span className="hero-menu-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </span>
          <span className="hero-menu-label">Voir dans l'arbre</span>
        </button>

        <div className="hero-menu-separator" role="separator" />

        <button
          type="button"
          role="menuitem"
          className="hero-menu-item hero-menu-item--danger"
          onClick={act(onDelete)}
        >
          <span className="hero-menu-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1.5 14a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </span>
          <span className="hero-menu-label">Supprimer la fiche</span>
        </button>
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`hero-menu-btn${open ? ' is-open' : ''}`}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Actions sur la personne"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="5" cy="12" r="1.6" fill="currentColor"/>
          <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
          <circle cx="19" cy="12" r="1.6" fill="currentColor"/>
        </svg>
      </button>
      {menu}
    </>
  );
}
