import { type FC } from 'react';
import { type ArgValue } from '../../lib/document-mutator';

export type ScalarArgControlProps = {
  name: string;
  inputType: 'text' | 'number';
  step?: string;
  value: string;
  onChange: (v: ArgValue) => void;
};

export const ScalarArgControl: FC<ScalarArgControlProps> = ({
  name,
  inputType,
  step,
  value,
  onChange,
}) => {
  return (
    <input
      type={inputType}
      step={step}
      aria-label={name}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="graphiql-qb-arg-input"
    />
  );
};

export type BooleanArgControlProps = {
  name: string;
  value: string;
  onChange: (v: ArgValue) => void;
};

export const BooleanArgControl: FC<BooleanArgControlProps> = ({
  name,
  value,
  onChange,
}) => {
  return (
    <input
      type="checkbox"
      aria-label={name}
      checked={value === 'true'}
      onChange={e => onChange(e.target.checked ? 'true' : 'false')}
      className="graphiql-qb-arg-checkbox"
    />
  );
};
