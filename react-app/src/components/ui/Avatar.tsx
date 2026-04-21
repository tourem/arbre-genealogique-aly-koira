import type { CSSProperties } from 'react';

type Gender = 'M' | 'F';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  /** Full name used to compute initials (first letter of each of the first 2 words). */
  name: string;
  gender: Gender;
  /** Optional generation number. When provided, rendered as a small badge at bottom-right (lg + md only). */
  generation?: number | null;
  /** Size variant. Default 'md'. */
  size?: Size;
  /** Optional extra class passed from parent. */
  className?: string;
  /** Optional inline style overrides. */
  style?: CSSProperties;
}

function computeInitials(name: string): string {
  const clean = name.trim();
  if (!clean) return '?';
  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function Avatar({
  name,
  gender,
  generation,
  size = 'md',
  className = '',
  style,
}: Props) {
  const initials = computeInitials(name);
  const genderClass = gender === 'F' ? 'avatar--female' : 'avatar--male';
  const sizeClass = `avatar--${size}`;
  const showBadge = generation != null && size !== 'sm';

  return (
    <div
      className={`avatar ${sizeClass} ${genderClass}${className ? ' ' + className : ''}`}
      style={style}
      aria-label={`${name}${generation != null ? `, génération ${generation}` : ''}`}
    >
      {initials}
      {showBadge && (
        <span className="avatar-gen-badge" aria-hidden="true">G{generation}</span>
      )}
    </div>
  );
}
