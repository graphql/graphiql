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
};

/**
 * Renders an appropriate input control for a single GraphQL argument or input
 * field. Handles scalars, enums, lists (repeat add/remove UI), and input
 * objects (recursive nested fields via a collapsible disclosure). Returns null
 * for any types not yet supported.
 */
export const ArgInput: FC<ArgInputProps> = ({ arg, value, onChange }) => {
  return <ArgInputByType type={arg.type} name={arg.name} value={value} onChange={onChange} />;
};

// ---------------------------------------------------------------------------
// Internal: dispatch by runtime type (handles NonNull unwrapping)
// ---------------------------------------------------------------------------

type TypedInputProps = {
  type: GraphQLType;
  name: string;
  value: string;
  onChange: (v: string) => void;
};

const ArgInputByType: FC<TypedInputProps> = ({ type, name, value, onChange }) => {
  // Strip NonNull wrapper transparently
  if (isNonNullType(type)) {
    return <ArgInputByType type={type.ofType} name={name} value={value} onChange={onChange} />;
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

  if (isEnumType(named)) {
    return (
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
    );
  }

  if (isScalarType(named)) {
    if (named.name === 'Boolean') {
      return (
        <input
          type="checkbox"
          aria-label={name}
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
        aria-label={name}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="graphiql-qb-arg-input"
      />
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
