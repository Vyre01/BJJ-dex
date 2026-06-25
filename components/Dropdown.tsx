'use client';

import { useEffect, useId, useRef, useState } from 'react';

export type DropdownOption = { value: string; label: string };

type Props = {
  /** Shown on the trigger when nothing is selected */
  placeholder: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  /** Renders the empty/placeholder choice as the first menu item */
  clearable?: boolean;
  ariaLabel?: string;
  className?: string;
  /** Full-width trigger (form usage) instead of a compact pill */
  block?: boolean;
};

export function Dropdown({
  placeholder,
  value,
  options,
  onChange,
  clearable = true,
  ariaLabel,
  className = '',
  block = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const items: DropdownOption[] = clearable
    ? [{ value: '', label: placeholder }, ...options]
    : options;
  const selected = options.find((o) => o.value === value) ?? null;

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function openMenu() {
    const idx = Math.max(0, items.findIndex((o) => o.value === value));
    setActive(idx);
    setOpen(true);
  }

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  function onTriggerKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open) setActive((a) => Math.min(items.length - 1, a + 1));
      else openMenu();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open) setActive((a) => Math.max(0, a - 1));
    }
    if (open && e.key === 'Enter') {
      e.preventDefault();
      choose(items[active].value);
    }
  }

  // Keep the highlighted option in view
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  // Only filter-style (clearable) dropdowns light up when a value is chosen.
  const isActiveFilter = clearable && !!selected;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onTriggerKey}
        className={
          'group flex items-center gap-1.5 border text-sm font-medium transition-colors ' +
          (block
            ? 'w-full justify-between rounded-xl px-3.5 py-2.5 '
            : 'rounded-full px-3.5 py-1.5 ') +
          (isActiveFilter
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground')
        }
      >
        <span className={block ? 'truncate' : 'whitespace-nowrap'}>{selected ? selected.label : placeholder}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={'transition-transform duration-200 ' + (open ? 'rotate-180' : '')}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="animate-pop-in absolute left-0 top-[calc(100%+0.4rem)] z-30 max-h-72 min-w-[10rem] overflow-y-auto rounded-2xl border border-border-strong bg-surface p-1.5 shadow-2xl shadow-black/50"
        >
          {items.map((opt, i) => {
            const isSel = opt.value === value;
            const isActive = i === active;
            return (
              <li
                key={opt.value || '__empty'}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(opt.value)}
                className={
                  'flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors ' +
                  (isActive ? 'bg-primary/15 text-foreground' : 'text-foreground-muted') +
                  (isSel ? ' font-semibold text-foreground' : '')
                }
              >
                <span className="whitespace-nowrap">{opt.label || placeholder}</span>
                {isSel && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="text-primary">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
