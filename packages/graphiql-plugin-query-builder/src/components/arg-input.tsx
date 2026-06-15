import {
  getNamedType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isScalarType,
  type GraphQLArgument,
  type GraphQLInputField,
  type GraphQLType,
} from 'graphql';
import { type FC, useState } from 'react';
import type { ArgValue } from '../lib/document-mutator';

type ArgInputProps = {
  arg: GraphQLArgument | GraphQLInputField;
  value: ArgValue;
  onChange: (v: ArgValue) => void;
  /** When set, a "use as variable" toggle is rendered for scalar/enum args. */
  isVariable?: boolean;
  /** The variable name currently bound to this arg (only meaningful when `isVariable` is true). */
  variableName?: string;
  /** Called when the user clicks "use as variable". */
  onPromote?: (argName: string, suggestedName: string) => void;
  /** Called when the user clicks the active variable badge to demote back to a literal. */
  onDemote?: (varName: string) => void;
};

/**
 * Renders an appropriate input control for a single GraphQL argument or input
 * field. Handles scalars, enums, lists (repeat add/remove UI), and input
 * objects (recursive nested fields via a collapsible disclosure). Returns null
 * for any types not yet supported.
 *
 * When `onPromote` is supplied, scalar and enum inputs show a "use as variable"
 * toggle button. Clicking it calls `onPromote`; when `isVariable` is true the
 * button shows the bound variable name and clicking it calls `onDemote`.
 */
export const ArgInput: FC<ArgInputProps> = ({
  arg,
  value,
  onChange,
  isVariable = false,
  variableName,
  onPromote,
  onDemote,
}) => {
  return (
    <ArgInputByType
      type={arg.type}
      name={arg.name}
      value={value}
      onChange={onChange}
      isVariable={isVariable}
      variableName={variableName}
      onPromote={onPromote}
      onDemote={onDemote}
    />
  );
};

// ---------------------------------------------------------------------------
// Internal: dispatch by runtime type (handles NonNull unwrapping)
// ---------------------------------------------------------------------------

type TypedInputProps = {
  type: GraphQLType;
  name: string;
  value: ArgValue;
  onChange: (v: ArgValue) => void;
  isVariable?: boolean;
  variableName?: string;
  onPromote?: (argName: string, suggestedName: string) => void;
  onDemote?: (varName: string) => void;
};

const ArgInputByType: FC<TypedInputProps> = ({
  type,
  name,
  value,
  onChange,
  isVariable = false,
  variableName,
  onPromote,
  onDemote,
}) => {
  // Strip NonNull wrapper transparently
  if (isNonNullType(type)) {
    return (
      <ArgInputByType
        type={type.ofType}
        name={name}
        value={value}
        onChange={onChange}
        isVariable={isVariable}
        variableName={variableName}
        onPromote={onPromote}
        onDemote={onDemote}
      />
    );
  }

  if (isListType(type)) {
    return (
      <ListArgInput
        itemType={type.ofType}
        name={name}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
      />
    );
  }

  const named = getNamedType(type);

  if (isInputObjectType(named)) {
    const objValue =
      !Array.isArray(value) && typeof value === 'object' && value !== null
        ? (value as { [field: string]: ArgValue })
        : {};
    return (
      <InputObjectArgInput
        inputType={named}
        name={name}
        value={objValue}
        onChange={onChange}
      />
    );
  }

  // For scalar and enum types, optionally render the variable toggle.
  const scalarValue = typeof value === 'string' ? value : '';
  const toggleBtn = onPromote ? (
    <button
      type="button"
      className="graphiql-qb-var-toggle"
      aria-pressed={isVariable}
      onClick={() => {
        if (isVariable && onDemote && variableName) {
          onDemote(variableName);
        } else {
          onPromote(name, name);
        }
      }}
    >
      {isVariable && variableName ? `$${variableName}` : 'Use as variable'}
    </button>
  ) : null;

  if (isEnumType(named)) {
    return (
      <span className="graphiql-qb-arg-with-toggle">
        {isVariable ? (
          <span
            className="graphiql-qb-var-badge"
            aria-label={`${name} bound to $${variableName ?? name}`}
          >
            ${variableName ?? name}
          </span>
        ) : (
          <select
            aria-label={name}
            value={scalarValue}
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
        )}
        {toggleBtn}
      </span>
    );
  }

  if (isScalarType(named)) {
    if (named.name === 'Boolean') {
      return (
        <span className="graphiql-qb-arg-with-toggle">
          {isVariable ? (
            <span
              className="graphiql-qb-var-badge"
              aria-label={`${name} bound to $${variableName ?? name}`}
            >
              ${variableName ?? name}
            </span>
          ) : (
            <input
              type="checkbox"
              aria-label={name}
              checked={scalarValue === 'true'}
              onChange={e => onChange(e.target.checked ? 'true' : 'false')}
              className="graphiql-qb-arg-checkbox"
            />
          )}
          {toggleBtn}
        </span>
      );
    }
    const inputType =
      named.name === 'Int' || named.name === 'Float' ? 'number' : 'text';
    return (
      <span className="graphiql-qb-arg-with-toggle">
        {isVariable ? (
          <span
            className="graphiql-qb-var-badge"
            aria-label={`${name} bound to $${variableName ?? name}`}
          >
            ${variableName ?? name}
          </span>
        ) : (
          <input
            type={inputType}
            aria-label={name}
            value={scalarValue}
            onChange={e => onChange(e.target.value)}
            className="graphiql-qb-arg-input"
          />
        )}
        {toggleBtn}
      </span>
    );
  }

  return null;
};

// ---------------------------------------------------------------------------
// List arg: real ArgValue[] — no JSON round-trips
// ---------------------------------------------------------------------------

type ListArgInputProps = {
  itemType: GraphQLType;
  name: string;
  value: ArgValue[];
  onChange: (v: ArgValue) => void;
};

const ListArgInput: FC<ListArgInputProps> = ({
  itemType,
  name,
  value,
  onChange,
}) => {
  const updateAt = (index: number, newVal: ArgValue) => {
    const next = [...value];
    next[index] = newVal;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...value, defaultValueForType(itemType)]);
  };

  return (
    <div className="graphiql-qb-list-arg">
      {value.map((item, i) => (
        <div key={i} className="graphiql-qb-list-item">
          <ArgInputByType
            type={itemType}
            name={name}
            value={item}
            onChange={v => updateAt(i, v)}
          />
          <button
            type="button"
            onClick={() => removeAt(i)}
            aria-label="Remove item"
            className="graphiql-qb-list-remove"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        aria-label="Add item"
        className="graphiql-qb-list-add"
      >
        + Add
      </button>
    </div>
  );
};

function defaultValueForType(type: GraphQLType): ArgValue {
  if (isNonNullType(type)) {
    return defaultValueForType(type.ofType);
  }
  if (isListType(type)) {
    return [];
  }
  const named = getNamedType(type);
  if (isInputObjectType(named)) {
    return {};
  }
  return '';
}

// ---------------------------------------------------------------------------
// Input object arg: real { [field]: ArgValue } — no JSON round-trips
// ---------------------------------------------------------------------------

type InputObjectArgInputProps = {
  inputType: ReturnType<typeof getNamedType> & {
    getFields: () => Record<string, GraphQLInputField>;
  };
  name: string;
  value: { [field: string]: ArgValue };
  onChange: (v: ArgValue) => void;
};

const InputObjectArgInput: FC<InputObjectArgInputProps> = ({
  inputType,
  name,
  value,
  onChange,
}) => {
  // Render nested fields only once expanded. Input object types can be
  // self-referential (e.g. an input with a field of its own type), so rendering
  // every level eagerly would recurse forever.
  const [open, setOpen] = useState(false);
  const fields = inputType.getFields();

  const onChangeField = (fieldName: string, fieldValue: ArgValue) => {
    const next: { [field: string]: ArgValue } = { ...value };
    if (fieldValue === '' || fieldValue === undefined) {
      delete next[fieldName];
    } else {
      next[fieldName] = fieldValue;
    }
    onChange(next);
  };

  return (
    <details
      className="graphiql-qb-input-object"
      onToggle={e => setOpen(e.currentTarget.open)}
    >
      <summary>{name}</summary>
      {open &&
        Object.entries(fields).map(([fieldName, field]) => {
          const fieldVal: ArgValue = value[fieldName] ?? '';
          return (
            <div key={fieldName} className="graphiql-qb-input-field">
              <ArgInputByType
                type={field.type}
                name={fieldName}
                value={fieldVal}
                onChange={v => onChangeField(fieldName, v)}
              />
            </div>
          );
        })}
    </details>
  );
};
