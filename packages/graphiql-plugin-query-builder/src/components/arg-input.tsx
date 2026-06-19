import { ChevronDownIcon, CloseIcon, PlusIcon } from '@graphiql/react';
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
import { type FC, useEffect, useState } from 'react';
import { type ArgValue } from '../lib/document-mutator';

/**
 * True when an arg/field of this type renders as an input-object disclosure
 * (which labels itself via its header). A list of input objects does not — it
 * renders as a list and needs its own `name:` label — so we only unwrap
 * NonNull here, not List.
 */
export function rendersAsInputObject(type: GraphQLType): boolean {
  const unwrapped = isNonNullType(type) ? type.ofType : type;
  if (isListType(unwrapped)) {
    return false;
  }
  return isInputObjectType(getNamedType(unwrapped));
}

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
  onDemote?: (argName: string, varName: string) => void;
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
  onDemote?: (argName: string, varName: string) => void;
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
  const toggleBtn = onPromote ? (
    <button
      type="button"
      className="graphiql-qb-var-toggle"
      aria-pressed={isVariable}
      onClick={() => {
        if (isVariable && onDemote && variableName) {
          onDemote(name, variableName);
        } else {
          onPromote(name, name);
        }
      }}
    >
      {isVariable ? 'Inline argument' : 'Use as variable'}
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
          <EnumArgControl
            name={name}
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            enumValues={named.getValues().map(v => v.name)}
          />
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
            <BooleanArgControl
              name={name}
              value={typeof value === 'string' ? value : ''}
              onChange={onChange}
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
          <ScalarArgControl
            name={name}
            inputType={inputType}
            step={named.name === 'Int' ? '1' : undefined}
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
          />
        )}
        {toggleBtn}
      </span>
    );
  }

  return null;
};

// ---------------------------------------------------------------------------
// ScalarArgControl — text/number input, controlled directly by the document
// ---------------------------------------------------------------------------
//
// No local state is needed: the builder updates its working document
// synchronously on each keystroke, so the `value` prop already reflects the
// character just typed by the time we re-render. (Previously the document
// round-trip was async, which dropped all but the last character unless we kept
// a local copy.)

type ScalarArgControlProps = {
  name: string;
  inputType: 'text' | 'number';
  step?: string;
  value: string;
  onChange: (v: ArgValue) => void;
};

const ScalarArgControl: FC<ScalarArgControlProps> = ({
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

// ---------------------------------------------------------------------------
// BooleanArgControl — checkbox (no multi-char issue, but keep pattern uniform)
// ---------------------------------------------------------------------------

type BooleanArgControlProps = {
  name: string;
  value: string;
  onChange: (v: ArgValue) => void;
};

const BooleanArgControl: FC<BooleanArgControlProps> = ({
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

// ---------------------------------------------------------------------------
// EnumArgControl — select (no multi-char issue, but extracted for symmetry)
// ---------------------------------------------------------------------------

type EnumArgControlProps = {
  name: string;
  value: string;
  onChange: (v: ArgValue) => void;
  enumValues: string[];
};

const EnumArgControl: FC<EnumArgControlProps> = ({
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

// ---------------------------------------------------------------------------
// List arg: local items (with stable ids) so empty rows can persist
// ---------------------------------------------------------------------------
//
// An empty list element can't live in the document (an empty slot isn't
// printable), so in-progress items are held here in local state. We adopt the
// `value` prop only on a genuine external change, detected by comparing it to
// the non-empty projection of our local items: equal means the prop is just our
// own edit echoed back (empty rows dropped) and we keep the local rows; a
// difference means the document changed under us and we adopt it. Items carry a
// stable id so React reconciles the right input row when one is removed.

type ListArgInputProps = {
  itemType: GraphQLType;
  name: string;
  value: ArgValue[];
  onChange: (v: ArgValue) => void;
};

type ListItem = { id: number; value: ArgValue };

let nextListItemId = 0;
const withIds = (values: ArgValue[]): ListItem[] =>
  values.map(value => ({ id: nextListItemId++, value }));

// The non-empty projection: items that survive into the document. Only empty
// scalar leaves are dropped; objects and nested lists print fine.
const projectItems = (items: ListItem[]): ArgValue[] =>
  items.map(i => i.value).filter(v => v !== '');

const ListArgInput: FC<ListArgInputProps> = ({
  itemType,
  name,
  value,
  onChange,
}) => {
  const [items, setItems] = useState<ListItem[]>(() => withIds(value));

  // Adopt the prop only when it differs from our items' projection, so a
  // just-added empty row isn't wiped by our own write echoing back.
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(projectItems(items))) {
      setItems(withIds(value));
    }
    // Intentionally only react to external `value` changes, not local edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (next: ListItem[]) => {
    setItems(next);
    onChange(next.map(i => i.value));
  };

  return (
    <div className="graphiql-qb-list-arg">
      {items.map(item => (
        <div key={item.id} className="graphiql-qb-list-item">
          <ArgInputByType
            type={itemType}
            name={name}
            value={item.value}
            onChange={v =>
              emit(items.map(i => (i.id === item.id ? { ...i, value: v } : i)))
            }
          />
          <button
            type="button"
            onClick={() => emit(items.filter(i => i.id !== item.id))}
            aria-label="Remove item"
            className="graphiql-qb-list-remove"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          emit([
            ...items,
            { id: nextListItemId++, value: defaultValueForType(itemType) },
          ])
        }
        aria-label="Add item"
        className="graphiql-qb-list-add"
      >
        <PlusIcon />
        Add
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
      <summary className="graphiql-qb-input-object-summary">
        <span
          className={
            open
              ? 'graphiql-qb-chevron-expanded'
              : 'graphiql-qb-chevron-collapsed'
          }
        >
          <ChevronDownIcon />
        </span>
        <span className="graphiql-qb-arg-name">{name}</span>
      </summary>
      {open && (
        <div className="graphiql-qb-input-object-fields">
          {Object.entries(fields).map(([fieldName, field]) => {
            const fieldVal: ArgValue = value[fieldName] ?? '';
            // Input-object fields label themselves via their disclosure; others
            // get a `name:` label here.
            const isObjectField = rendersAsInputObject(field.type);
            return (
              <div key={fieldName} className="graphiql-qb-arg-row">
                {!isObjectField && (
                  <span className="graphiql-qb-arg-name">{fieldName}:</span>
                )}
                <ArgInputByType
                  type={field.type}
                  name={fieldName}
                  value={fieldVal}
                  onChange={v => onChangeField(fieldName, v)}
                />
              </div>
            );
          })}
        </div>
      )}
    </details>
  );
};
