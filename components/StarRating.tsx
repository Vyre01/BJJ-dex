'use client';

type Props =
  | { value: number; onChange: (v: 1 | 2 | 3 | 4 | 5) => void; size?: 'sm' | 'md' }
  | { value: number; onChange?: undefined; size?: 'sm' | 'md' };

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill={filled ? 'currentColor' : 'none'}>
      <path
        d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.9 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarRating(props: Props) {
  const { value, size = 'md' } = props;
  const onChange = 'onChange' in props ? props.onChange : undefined;
  const readonly = !onChange;
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-7 w-7';

  return (
    <div className="inline-flex items-center gap-0.5" role={readonly ? 'img' : 'radiogroup'} aria-label={`난이도 ${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const color = filled
          ? 'text-favorite drop-shadow-[0_1px_2px_rgba(245,183,61,0.35)]'
          : 'text-white/25';
        return readonly ? (
          <StarIcon key={n} filled={filled} className={`${dim} ${color}`} />
        ) : (
          <button
            key={n}
            type="button"
            aria-label={`${n}점`}
            className="transition-transform hover:scale-125"
            onClick={() => onChange?.(n as 1 | 2 | 3 | 4 | 5)}
          >
            <StarIcon filled={filled} className={`${dim} ${filled ? 'text-favorite' : 'text-foreground-subtle'}`} />
          </button>
        );
      })}
    </div>
  );
}
