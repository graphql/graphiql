'use no memo';

import { useId, type ReactNode } from 'react';
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
  const name = useId();
  return (
    <fieldset className="graphiql-segmented-control">
      {ariaLabel && (
        <legend className="graphiql-segmented-control-legend">
          {ariaLabel}
        </legend>
      )}
      {options.map(opt => (
        <label
          key={opt.value}
          className="graphiql-segmented-control-option"
          data-checked={opt.value === value || undefined}
          data-disabled={opt.disabled || undefined}
        >
          <input
            className="graphiql-segmented-control-input"
            type="radio"
            name={name}
            value={opt.value}
            checked={opt.value === value}
            disabled={opt.disabled}
            onChange={() => onChange(opt.value)}
          />
          {opt.icon && (
            <span className="graphiql-segmented-control-icon">{opt.icon}</span>
          )}
          <span>{opt.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
