import { type FC } from 'react';
import { type ArgValue } from '../../lib/document-mutator';

export type EnumArgControlProps = {
  name: string;
  value: string;
  onChange: (v: ArgValue) => void;
  enumValues: string[];
};

export const EnumArgControl: FC<EnumArgControlProps> = ({
  name,
  value,
  onChange,
  enumValues,
}) => {
  return (
    <select
      aria-label={name}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="graphiql-qb-arg-select"
    >
      <option value="">—</option>
      {enumValues.map(v => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );
};
