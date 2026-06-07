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
import type { FC } from 'react';

type ArgInputProps = {
  arg: GraphQLArgument | GraphQLInputField;
  value: string;
  onChange: (v: string) => void;
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
  value: string;
  onChange: (v: string) => void;
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
        value={value}
        onChange={onChange}
      />
    );
  }

  const named = getNamedType(type);

  if (isInputObjectType(named)) {
    return (
      <InputObjectArgInput
        inputType={named}
        name={name}
        value={value}
        onChange={onChange}
      />
    );
  }

  // For scalar and enum types, optionally render the variable toggle.
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
          <span className="graphiql-qb-var-badge" aria-label={`${name} bound to $${variableName ?? name}`}>
            ${variableName ?? name}
          </span>
        ) : (
          <select
            aria-label={name}
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
            <span className="graphiql-qb-var-badge" aria-label={`${name} bound to $${variableName ?? name}`}>
              ${variableName ?? name}
            </span>
          ) : (
            <input
              type="checkbox"
              aria-label={name}
              checked={value === 'true'}
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
          <span className="graphiql-qb-var-badge" aria-label={`${name} bound to $${variableName ?? name}`}>
            ${variableName ?? name}
          </span>
        ) : (
          <input
            type={inputType}
            aria-label={name}
            value={value}
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
// List arg: JSON array string → repeat-add UI
// ---------------------------------------------------------------------------

function parseListValue(raw: string): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type ListArgInputProps = {
  itemType: GraphQLType;
  name: string;
  value: string;
  onChange: (v: string) => void;
};

const ListArgInput: FC<ListArgInputProps> = ({ itemType, name, value, onChange }) => {
  const items = parseListValue(value);

  const updateAt = (index: number, newVal: unknown) => {
    const next = [...items];
    next[index] = newVal;
    onChange(JSON.stringify(next));
  };

  const removeAt = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(JSON.stringify(next));
  };

  const addItem = () => {
    // Default empty value per item type
    const defaultItem = defaultValueForType(itemType);
    onChange(JSON.stringify([...items, defaultItem]));
  };

  return (
    <div className="graphiql-qb-list-arg">
      {items.map((item, i) => (
        <div key={i} className="graphiql-qb-list-item">
          <ArgInputByType
            type={itemType}
            name={name}
            value={typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item ?? '')}
            onChange={v => {
              // Try to parse as JSON for objects/arrays; otherwise use as string
              try {
                updateAt(i, JSON.parse(v));
              } catch {
                updateAt(i, v);
              }
            }}
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

function defaultValueForType(type: GraphQLType): unknown {
  if (isNonNullType(type)) return defaultValueForType(type.ofType);
  if (isListType(type)) return [];
  const named = getNamedType(type);
  if (isInputObjectType(named)) return {};
  return '';
}

// ---------------------------------------------------------------------------
// Input object arg: JSON object string → recursive field inputs
// ---------------------------------------------------------------------------

function parseObjectValue(raw: string): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

type InputObjectArgInputProps = {
  inputType: ReturnType<typeof getNamedType> & { getFields: () => Record<string, GraphQLInputField> };
  name: string;
  value: string;
  onChange: (v: string) => void;
};

const InputObjectArgInput: FC<InputObjectArgInputProps> = ({ inputType, name, value, onChange }) => {
  const objValues = parseObjectValue(value);
  const fields = inputType.getFields();

  const onChangeField = (fieldName: string, fieldValue: unknown) => {
    const next: Record<string, unknown> = { ...objValues };
    if (fieldValue === '' || fieldValue === undefined) {
      delete next[fieldName];
    } else {
      next[fieldName] = fieldValue;
    }
    onChange(JSON.stringify(next));
  };

  return (
    <details className="graphiql-qb-input-object">
      <summary>{name}</summary>
      {Object.entries(fields).map(([fieldName, field]) => {
        const fieldRaw = objValues[fieldName];
        const fieldStr =
          fieldRaw !== undefined && fieldRaw !== null
            ? typeof fieldRaw === 'object'
              ? JSON.stringify(fieldRaw)
              : String(fieldRaw)
            : '';
        return (
          <div key={fieldName} className="graphiql-qb-input-field">
            <ArgInputByType
              type={field.type}
              name={fieldName}
              value={fieldStr}
              onChange={v => {
                try {
                  onChangeField(fieldName, JSON.parse(v));
                } catch {
                  onChangeField(fieldName, v);
                }
              }}
            />
          </div>
        );
      })}
    </details>
  );
};
