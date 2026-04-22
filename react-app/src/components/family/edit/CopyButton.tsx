import { useRef, useState } from 'react';

interface Props {
  /** The value to copy to the clipboard. */
  value: string;
  /** Label shown in the default state. Defaults to "Copier". */
  label?: string;
  /** Label shown briefly after a successful copy. Defaults to "Copié". */
  copiedLabel?: string;
  /** Optional DOM node whose text content is selected as fallback when the
   *  clipboard API is unavailable. If omitted, falls back to a silent retry. */
  fallbackTarget?: React.RefObject<HTMLElement | null>;
  /** Called after a successful copy, typically to show a global toast. */
  onCopied?: (message: string) => void;
  /** Message passed to onCopied. Defaults to "ID copié dans le presse-papiers". */
  toastMessage?: string;
}

/**
 * Copy button with visual feedback (sauge border + "Copié" label for 2s).
 * Uses navigator.clipboard when available, otherwise falls back to
 * Range/Selection on fallbackTarget so the user can Cmd+C manually.
 */
export default function CopyButton({
  value,
  label = 'Copier',
  copiedLabel = 'Copié',
  fallbackTarget,
  onCopied,
  toastMessage = 'ID copié dans le presse-papiers',
}: Props) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  const markCopied = () => {
    setCopied(true);
    if (onCopied) onCopied(toastMessage);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setCopied(false);
      timerRef.current = null;
    }, 2000);
  };

  const doCopy = async () => {
    // Try navigator.clipboard first.
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(value);
        markCopied();
        return;
      } catch {
        // fall through to fallback
      }
    }
    // Fallback: select the text of fallbackTarget so the user can Cmd+C.
    if (fallbackTarget?.current && typeof window !== 'undefined') {
      try {
        const range = document.createRange();
        range.selectNodeContents(fallbackTarget.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        // We don't mark as "copied" since we don't know if the user will press
        // Cmd+C — but we still surface the text selection as feedback.
      } catch {
        // ignore
      }
    }
  };

  return (
    <button
      type="button"
      className={`edit-id-row-copy${copied ? ' is-copied' : ''}`}
      onClick={doCopy}
      aria-label={copied ? copiedLabel : label}
    >
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
