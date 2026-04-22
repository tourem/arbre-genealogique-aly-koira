import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface CardAction {
  label: string;
  onClick: () => void;
  danger?: boolean;
  /** SVG path content (sans <svg>) — optionnel. */
  icon?: React.ReactNode;
}

interface Props {
  actions: CardAction[];
  /** Nom accessible du bouton : "Actions sur le foyer avec X", "Actions sur Y"... */
  label: string;
}

/**
 * Menu contextuel "⋯" generique pour les cartes de relation (parents,
 * foyers, enfants). Contient uniquement des actions sur le lien ou
 * la fiche liee — jamais de creations.
 */
export default function CardActionsMenu({ actions, label }: Props) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => btnRef.current?.focus());
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
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

  const act = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
    close();
  };

  const menu = open && anchorRect ? createPortal(
    <>
      <div className="card-menu-backdrop" onClick={close} aria-hidden="true" />
      <div
        className="card-menu"
        role="menu"
        aria-label={label}
        style={{
          top: `${anchorRect.bottom + 4}px`,
          left: `${Math.max(8, Math.min(anchorRect.right - 220, window.innerWidth - 228))}px`,
        }}
      >
        {actions.map((action, i) => (
          <button
            key={action.label}
            ref={i === 0 ? firstItemRef : undefined}
            type="button"
            role="menuitem"
            className={`card-menu-item${action.danger ? ' card-menu-item--danger' : ''}`}
            onClick={act(action.onClick)}
          >
            {action.icon && <span className="card-menu-icon" aria-hidden="true">{action.icon}</span>}
            <span className="card-menu-label">{action.label}</span>
          </button>
        ))}
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`card-menu-btn${open ? ' is-open' : ''}`}
        onClick={toggle}
        onMouseDown={(e) => e.stopPropagation()}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
        </svg>
      </button>
      {menu}
    </>
  );
}
