import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const DOMAINS = ['gmail.com', 'yahoo.fr', 'yahoo.com'];

interface Props {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
}

const EmailInput = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onKeyDown, placeholder }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => inputRef.current!);

    const atIndex = value.indexOf('@');
    const hasAt = atIndex >= 0;
    const localPart = hasAt ? value.slice(0, atIndex) : value;
    const typedDomain = hasAt ? value.slice(atIndex + 1) : '';

    const suggestions = hasAt && localPart.length > 0
      ? DOMAINS.filter((d) => d.startsWith(typedDomain) && d !== typedDomain)
      : [];

    const visible = showSuggestions && suggestions.length > 0;

    useEffect(() => {
      setActiveIndex(-1);
    }, [value]);

    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setShowSuggestions(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function selectSuggestion(domain: string) {
      onChange(`${localPart}@${domain}`);
      setShowSuggestions(false);
      inputRef.current?.focus();
    }

    function handleKeyDown(e: React.KeyboardEvent) {
      if (visible) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % suggestions.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
          return;
        }
        if (e.key === 'Enter' && activeIndex >= 0) {
          e.preventDefault();
          selectSuggestion(suggestions[activeIndex]);
          return;
        }
        if (e.key === 'Escape') {
          setShowSuggestions(false);
          return;
        }
        if (e.key === 'Tab' && suggestions.length > 0) {
          e.preventDefault();
          selectSuggestion(suggestions[activeIndex >= 0 ? activeIndex : 0]);
          return;
        }
      }
      onKeyDown?.(e);
    }

    return (
      <div className="email-ac-wrap" ref={wrapperRef}>
        <input
          ref={inputRef}
          type="email"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
        {visible && (
          <ul className="email-ac-list">
            {suggestions.map((domain, i) => (
              <li
                key={domain}
                className={`email-ac-item${i === activeIndex ? ' active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(domain); }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <span className="email-ac-local">{localPart}@</span>
                <span className="email-ac-domain">{domain}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);

EmailInput.displayName = 'EmailInput';

export default EmailInput;
