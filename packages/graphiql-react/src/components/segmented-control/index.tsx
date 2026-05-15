import type { ReactNode } from 'react';
import './index.css';

export type SegmentedControlOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends string = string> = {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  ariaLabel?: string;
};

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      className="graphiql-segmented-control"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`graphiql-segmented-control-option${opt.value === value ? ' active' : ''}`}
          onClick={() => onChange(opt.value)}
          disabled={opt.disabled}
          aria-pressed={opt.value === value}
        >
          {opt.icon && (
            <span className="graphiql-segmented-control-icon">{opt.icon}</span>
          )}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
