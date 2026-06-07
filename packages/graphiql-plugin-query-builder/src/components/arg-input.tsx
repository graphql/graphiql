import { getNamedType, isEnumType, isScalarType, type GraphQLArgument } from 'graphql';
import type { FC } from 'react';

type ArgInputProps = {
  arg: GraphQLArgument;
  value: string;
  onChange: (v: string) => void;
};

/**
 * Renders an appropriate input control for a single GraphQL argument.
 * Enums get a dropdown of all valid values; scalars get type-specific inputs
 * (number for Int/Float, checkbox for Boolean, text otherwise). Returns null
 * for argument types that are not yet supported (input objects, lists, etc.).
 */
export const ArgInput: FC<ArgInputProps> = ({ arg, value, onChange }) => {
  const named = getNamedType(arg.type);

  if (isEnumType(named)) {
    return (
      <select
        aria-label={arg.name}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="graphiql-qb-arg-select"
      >
        <option value="">—</option>
        {named.getValues().map(v => (
          <option key={v.name} value={v.name}>
            {v.name}
          </option>
        ))}
      </select>
    );
  }

  if (isScalarType(named)) {
    if (named.name === 'Boolean') {
      return (
        <input
          type="checkbox"
          aria-label={arg.name}
          checked={value === 'true'}
          onChange={e => onChange(e.target.checked ? 'true' : 'false')}
          className="graphiql-qb-arg-checkbox"
        />
      );
    }
    const inputType =
      named.name === 'Int' || named.name === 'Float' ? 'number' : 'text';
    return (
      <input
        type={inputType}
        aria-label={arg.name}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="graphiql-qb-arg-input"
      />
    );
  }

  return null;
};
