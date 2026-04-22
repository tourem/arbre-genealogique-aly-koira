import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  /** Optional counter shown to the right of the title (e.g. "à venir", "1 actif"). */
  counter?: string;
  /** Section is collapsible (shows chevron + toggles on click). */
  collapsible?: boolean;
  /** Initially collapsed (only meaningful if collapsible). */
  defaultCollapsed?: boolean;
  children: ReactNode;
}

/**
 * Collapsible form section used inside EditPanel. Each section has:
 * - A Fraunces ocre title.
 * - An optional mono counter on the right.
 * - A chevron `▾` if collapsible.
 * - A body hidden via display:none when collapsed.
 */
export default function FormSection({
  title,
  counter,
  collapsible = false,
  defaultCollapsed = false,
  children,
}: Props) {
  const [collapsed, setCollapsed] = useState(collapsible && defaultCollapsed);

  const toggle = () => {
    if (!collapsible) return;
    setCollapsed((c) => !c);
  };

  const titleClass = `edit-section-title${collapsible ? ' is-collapsible' : ''}`;

  const handleKey = (e: React.KeyboardEvent) => {
    if (!collapsible) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div className={`edit-section${collapsed ? ' is-collapsed' : ''}`}>
      {collapsible ? (
        <h3
          className={titleClass}
          onClick={toggle}
          onKeyDown={handleKey}
          role="button"
          aria-expanded={!collapsed}
          tabIndex={0}
        >
          <span className="edit-section-title-text">{title}</span>
          {counter && <span className="edit-section-count">{counter}</span>}
        </h3>
      ) : (
        <h3 className={titleClass}>
          <span className="edit-section-title-text">{title}</span>
          {counter && <span className="edit-section-count">{counter}</span>}
        </h3>
      )}
      <div className="edit-section-body">{children}</div>
    </div>
  );
}
