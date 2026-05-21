'use client';

type Props =
  | { value: number; onChange: (v: 1 | 2 | 3 | 4 | 5) => void; size?: 'sm' | 'md' }
  | { value: number; onChange?: undefined; size?: 'sm' | 'md' };

export function StarRating(props: Props) {
  const { value, size = 'md' } = props;
  const onChange = 'onChange' in props ? props.onChange : undefined;
  const readonly = !onChange;
  const cls = size === 'sm' ? 'text-base' : 'text-2xl';
  return (
    <div className={'inline-flex ' + cls} role={readonly ? 'img' : 'radiogroup'} aria-label={`난이도 ${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const common = filled ? 'text-favorite' : 'text-foreground-subtle';
        return readonly ? (
          <span key={n} className={common}>★</span>
        ) : (
          <button
            key={n}
            type="button"
            aria-label={`${n}점`}
            className={common + ' px-0.5'}
            onClick={() => onChange?.(n as 1 | 2 | 3 | 4 | 5)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
