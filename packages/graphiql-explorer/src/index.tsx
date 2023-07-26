/* eslint-disable */
// cSpell:disable
// @ts-nocheck

// TODO: 1. Add default fields recursively
// TODO: 2. Add default fields for all selections (not just fragments)
// TODO: 3. Add stylesheet and remove inline styles
// TODO: 4. Indication of when query in explorer diverges from query in editor pane
// TODO: 5. Separate section for deprecated args, with support for 'beta' fields
// TODO: 6. Custom default arg fields

// Note: Attempted 1. and 2., but they were more annoying than helpful

import * as React from 'react';

import {
  getNamedType,
  GraphQLObjectType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isLeafType,
  isNonNullType,
  isObjectType,
  isRequiredInputField,
  isScalarType,
  isUnionType,
  isWrappingType,
  parse,
  print,
  parseType,
  visit,
  Kind,
} from 'graphql';

import type {
  ArgumentNode,
  DefinitionNode,
  DocumentNode,
  FieldNode,
  FragmentSpreadNode,
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLField,
  GraphQLFieldMap,
  GraphQLInputField,
  GraphQLInputType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLSchema,
  InlineFragmentNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  ObjectFieldNode,
  ObjectValueNode,
  SelectionNode,
  SelectionSetNode,
  VariableDefinitionNode,
  ValueNode,
} from 'graphql';

type Field = GraphQLField<any, any>;

type GetDefaultScalarArgValue = (
  parentField: Field,
  arg: GraphQLArgument | GraphQLInputField,
  underlyingArgType: GraphQLEnumType | GraphQLScalarType,
) => ValueNode;

type MakeDefaultArg = (
  parentField: Field,
  arg: GraphQLArgument | GraphQLInputField,
) => boolean;

type Colors = {
  keyword: string;
  def: string;
  property: string;
  qualifier: string;
  attribute: string;
  number: string;
  string: string;
  builtin: string;
  string2: string;
  variable: string;
  atom: string;
};

type StyleMap = {
  [key: string]: any;
};

type Styles = {
  explorerActionsStyle: StyleMap;
  buttonStyle: StyleMap;
  actionButtonStyle: StyleMap;
};

type StyleConfig = {
  colors: Colors;
  arrowOpen: React.ReactNode;
  arrowClosed: React.ReactNode;
  checkboxChecked: React.ReactNode;
  checkboxUnchecked: React.ReactNode;
  styles: Styles;
};

type Props = {
  query: string;
  width?: number;
  title?: string;
  schema?: null | GraphQLSchema;
  onEdit: (edit: string) => void;
  getDefaultFieldNames?: null | ((type: GraphQLObjectType) => Array<string>);
  getDefaultScalarArgValue?: null | GetDefaultScalarArgValue;
  makeDefaultArg?: null | MakeDefaultArg;
  onToggleExplorer: () => void;
  explorerIsOpen: boolean;
  onRunOperation?: (name: null | string) => void;
  colors?: null | Colors;
  arrowOpen?: null | React.ReactNode;
  arrowClosed?: null | React.ReactNode;
  checkboxChecked?: null | React.ReactNode;
  checkboxUnchecked?: null | React.ReactNode;
  styles?: null | {
    explorerActionsStyle?: StyleMap;
    buttonStyle?: StyleMap;
    actionButtonStyle?: StyleMap;
  };
  showAttribution: boolean;
  hideActions?: boolean;
  externalFragments?: FragmentDefinitionNode[];
};

type OperationType = 'query' | 'mutation' | 'subscription' | 'fragment';
type NewOperationType = 'query' | 'mutation' | 'subscription';

type State = {
  operation: null | OperationDefinitionNode;
  newOperationType: NewOperationType;
  operationToScrollTo: null | string;
};

type Selections = ReadonlyArray<SelectionNode>;

type AvailableFragments = { [key: string]: FragmentDefinitionNode };

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Names match class names in graphiql app.css
// https://github.com/graphql/graphiql/blob/master/packages/graphiql/css/app.css
const defaultColors: Colors = {
  keyword: '#B11A04',
  // OperationName, FragmentName
  def: '#D2054E',
  // FieldName
  property: '#1F61A0',
  // FieldAlias
  qualifier: '#1C92A9',
  // ArgumentName and ObjectFieldName
  attribute: '#8B2BB9',
  number: '#2882F9',
  string: '#D64292',
  // Boolean
  builtin: '#D47509',
  // Enum
  string2: '#0B7FC7',
  variable: '#397D13',
  // Type
  atom: '#CA9800',
};

const defaultArrowOpen = () => (
  <svg width="12" height="9">
    <path fill="#666" d="M 0 2 L 9 2 L 4.5 7.5 z" />
  </svg>
);

const defaultArrowClosed = () => (
  <svg width="12" height="9">
    <path fill="#666" d="M 0 0 L 0 9 L 5.5 4.5 z" />
  </svg>
);

const defaultCheckboxChecked = () => (
  <svg
    style={{ marginRight: '3px', marginLeft: '-3px' }}
    width="12"
    height="12"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0ZM16 16H2V2H16V16ZM14.99 6L13.58 4.58L6.99 11.17L4.41 8.6L2.99 10.01L6.99 14L14.99 6Z"
      fill="#666"
    />
  </svg>
);

const defaultCheckboxUnchecked = () => (
  <svg
    style={{ marginRight: '3px', marginLeft: '-3px' }}
    width="12"
    height="12"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 2V16H2V2H16ZM16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0Z"
      fill="#CCC"
    />
  </svg>
);

function Checkbox(props: { checked: boolean; styleConfig: StyleConfig }) {
  return props.checked
    ? props.styleConfig.checkboxChecked
    : props.styleConfig.checkboxUnchecked;
}

function defaultGetDefaultFieldNames(type: GraphQLObjectType): Array<string> {
  const fields = type.getFields();

  // Is there an `id` field?
  if (fields['id']) {
    const res = ['id'];
    if (fields['email']) {
      res.push('email');
    } else if (fields[Kind.NAME]) {
      res.push(Kind.NAME);
    }
    return res;
  }

  // Is there an `edges` field?
  if (fields['edges']) {
    return ['edges'];
  }

  // Is there an `node` field?
  if (fields['node']) {
    return ['node'];
  }

  if (fields['nodes']) {
    return ['nodes'];
  }

  // Include all leaf-type fields.
  const leafFieldNames: string[] = [];
  Object.keys(fields).forEach(fieldName => {
    if (isLeafType(fields[fieldName].type)) {
      leafFieldNames.push(fieldName);
    }
  });

  if (!leafFieldNames.length) {
    // No leaf fields, add typename so that the query stays valid
    return ['__typename'];
  }
  return leafFieldNames.slice(0, 2); // Prevent too many fields from being added
}

function isRequiredArgument(arg: GraphQLArgument): boolean {
  return isNonNullType(arg.type) && arg.defaultValue === undefined;
}

function unwrapOutputType(outputType: GraphQLOutputType): * {
  let unwrappedType = outputType;
  while (isWrappingType(unwrappedType)) {
    unwrappedType = unwrappedType.ofType;
  }
  return unwrappedType;
}

function unwrapInputType(inputType: GraphQLInputType): * {
  let unwrappedType = inputType;
  while (isWrappingType(unwrappedType)) {
    unwrappedType = unwrappedType.ofType;
  }
  return unwrappedType;
}

function coerceArgValue(argType: GraphQLScalarType, value: string): ValueNode;

function coerceArgValue(argType: GraphQLEnumType, value: unknown): ValueNode;

function coerceArgValue(argType, value) {
  // Handle the case where we're setting a variable as the value
  if (typeof value !== 'string' && value.kind === Kind.VARIABLE_DEFINITION) {
    return value.variable;
  } else if (isScalarType(argType)) {
    try {
      switch (argType.name) {
        case 'String':
          return {
            kind: Kind.STRING,
            value: String(argType.parseValue(value)),
          };
        case 'Float':
          return {
            kind: Kind.FLOAT,
            value: String(argType.parseValue(parseFloat(value))),
          };
        case 'Int':
          return {
            kind: Kind.INT,
            value: String(argType.parseValue(parseInt(value, 10))),
          };
        case 'Boolean':
          try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'boolean') {
              return { kind: Kind.BOOLEAN, value: parsed };
            } else {
              return { kind: Kind.BOOLEAN, value: false };
            }
          } catch (e) {
            return {
              kind: Kind.BOOLEAN,
              value: false,
            };
          }
        default:
          return {
            kind: Kind.STRING,
            value: String(argType.parseValue(value)),
          };
      }
    } catch (e) {
      console.error('error coercing arg value', e, value);
      return { kind: Kind.STRING, value: value };
    }
  } else {
    try {
      const parsedValue = argType.parseValue(value);
      if (parsedValue) {
        return { kind: Kind.ENUM, value: String(parsedValue) };
      } else {
        return { kind: Kind.ENUM, value: argType.getValues()[0].name };
      }
    } catch (e) {
      return { kind: Kind.ENUM, value: argType.getValues()[0].name };
    }
  }
}

type InputArgViewProps = {
  arg: GraphQLArgument;
  selection: ObjectValueNode;
  parentField: Field;
  modifyFields: (
    fields: ReadonlyArray<ObjectFieldNode>,
    options: null | boolean,
  ) => DocumentNode | null;
  getDefaultScalarArgValue: GetDefaultScalarArgValue;
  makeDefaultArg: null | MakeDefaultArg;
  onRunOperation: () => void;
  styleConfig: StyleConfig;
  onCommit: (newDoc: DocumentNode) => void;
  definition: FragmentDefinitionNode | OperationDefinitionNode;
};

class InputArgView extends React.PureComponent<InputArgViewProps, {}> {
  private _previousArgSelection?: null | ObjectFieldNode = null;
  _getArgSelection = () => {
    return this.props.selection.fields.find(
      field => field.name.value === this.props.arg.name,
    );
  };

  _removeArg = () => {
    const { selection } = this.props;
    const argSelection = this._getArgSelection();
    this._previousArgSelection = argSelection;
    this.props.modifyFields(
      selection.fields.filter(field => field !== argSelection),
      true,
    );
  };

  _addArg = () => {
    const {
      selection,
      arg,
      getDefaultScalarArgValue,
      parentField,
      makeDefaultArg,
    } = this.props;
    const argType = unwrapInputType(arg.type);

    let argSelection = null;
    if (this._previousArgSelection) {
      argSelection = this._previousArgSelection;
    } else if (isInputObjectType(argType)) {
      const fields = argType.getFields();
      argSelection = {
        kind: Kind.OBJECT_FIELD,
        name: { kind: Kind.NAME, value: arg.name },
        value: {
          kind: Kind.OBJECT,
          fields: defaultInputObjectFields(
            getDefaultScalarArgValue,
            makeDefaultArg,
            parentField,
            Object.keys(fields).map(k => fields[k]),
          ),
        },
      } as ObjectFieldNode;
    } else if (isLeafType(argType)) {
      argSelection = {
        kind: Kind.OBJECT_FIELD,
        name: { kind: Kind.NAME, value: arg.name },
        value: getDefaultScalarArgValue(parentField, arg, argType),
      } as ObjectFieldNode;
    }

    if (!argSelection) {
      console.error('Unable to add arg for argType', argType);
    } else {
      return this.props.modifyFields(
        [...(selection?.fields || []), argSelection],
        true,
      );
    }
  };

  _setArgValue = (event, options: null | boolean) => {
    let settingToNull = false;
    let settingToVariable = false;
    let settingToLiteralValue = false;
    try {
      if (event.kind === Kind.VARIABLE_DEFINITION) {
        settingToVariable = true;
      } else if (event === null || typeof event === 'undefined') {
        settingToNull = true;
      } else if (typeof event.kind === 'string') {
        settingToLiteralValue = true;
      }
    } catch (e) {}

    const { selection } = this.props;

    const argSelection = this._getArgSelection();

    if (!argSelection) {
      console.error('missing arg selection when setting arg value');
      return;
    }
    const argType = unwrapInputType(this.props.arg.type);

    const handleable =
      isLeafType(argType) ||
      settingToVariable ||
      settingToNull ||
      settingToLiteralValue;

    if (!handleable) {
      console.warn(
        'Unable to handle non leaf types in InputArgView.setArgValue',
        event,
      );
      return;
    }
    let targetValue: string | VariableDefinitionNode;
    let value: null | ValueNode | string;

    if (event === null || typeof event === 'undefined') {
      value = null;
    } else if (
      !event.target &&
      !!event.kind &&
      event.kind === Kind.VARIABLE_DEFINITION
    ) {
      targetValue = event;
      value = targetValue.variable;
    } else if (typeof event.kind === 'string') {
      value = event;
    } else if (event.target && typeof event.target.value === 'string') {
      targetValue = event.target.value;
      value = coerceArgValue(argType, targetValue);
    }

    const newDoc = this.props.modifyFields(
      (selection?.fields || []).map(field => {
        const isTarget = field === argSelection;
        const newField = isTarget
          ? {
              ...field,
              value: value as ValueNode,
            }
          : field;

        return newField;
      }),
      options,
    );

    return newDoc;
  };

  _modifyChildFields = (fields: readonly ObjectFieldNode[]) => {
    return this.props.modifyFields(
      this.props.selection.fields.map(field =>
        field.name.value === this.props.arg.name
          ? {
              ...field,
              value: {
                kind: Kind.OBJECT,
                fields: fields,
              } as ObjectValueNode,
            }
          : field,
      ),
      true,
    );
  };

  render() {
    const { arg, parentField } = this.props;
    const argSelection = this._getArgSelection();

    return (
      <AbstractArgView
        argValue={argSelection ? argSelection.value : null}
        arg={arg}
        parentField={parentField}
        addArg={this._addArg}
        removeArg={this._removeArg}
        setArgFields={this._modifyChildFields}
        setArgValue={this._setArgValue}
        getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
        makeDefaultArg={this.props.makeDefaultArg}
        onRunOperation={this.props.onRunOperation}
        styleConfig={this.props.styleConfig}
        onCommit={this.props.onCommit}
        definition={this.props.definition}
      />
    );
  }
}

type ArgViewProps = {
  parentField: Field;
  arg: GraphQLArgument;
  selection: FieldNode;
  modifyArguments: (
    argumentNodes: ReadonlyArray<ArgumentNode>,
    commit: null | boolean,
  ) => DocumentNode | null;
  getDefaultScalarArgValue: GetDefaultScalarArgValue;
  makeDefaultArg: null | MakeDefaultArg;
  onRunOperation: () => void;
  styleConfig: StyleConfig;
  onCommit: (newDoc: DocumentNode) => void;
  definition: FragmentDefinitionNode | OperationDefinitionNode;
};

type ArgViewState = {};

export function defaultValue(
  argType: GraphQLEnumType | GraphQLScalarType,
): ValueNode {
  if (isEnumType(argType)) {
    return { kind: Kind.ENUM, value: argType.getValues()[0].name };
  } else {
    switch (argType.name) {
      case 'String':
        return { kind: Kind.STRING, value: '' };
      case 'Float':
        return { kind: Kind.FLOAT, value: '1.5' };
      case 'Int':
        return { kind: Kind.INT, value: '10' };
      case 'Boolean':
        return { kind: Kind.BOOLEAN, value: false };
      default:
        return { kind: Kind.STRING, value: '' };
    }
  }
}

function defaultGetDefaultScalarArgValue(
  parentField: Field,
  arg: GraphQLArgument | GraphQLInputField,
  argType: GraphQLEnumType | GraphQLScalarType,
): ValueNode {
  return defaultValue(argType);
}

class ArgView extends React.PureComponent<ArgViewProps, ArgViewState> {
  _previousArgSelection: null | ArgumentNode = null;
  _getArgSelection = (): null | ArgumentNode => {
    const { selection } = this.props;

    return (
      (selection?.arguments || []).find(
        arg => arg.name.value === this.props.arg.name,
      ) ?? null
    );
  };
  _removeArg = (commit: boolean): DocumentNode | null => {
    const { selection } = this.props;
    const argSelection = this._getArgSelection();
    this._previousArgSelection = argSelection;
    return this.props.modifyArguments(
      (selection.arguments || []).filter(arg => arg !== argSelection),
      commit,
    );
  };
  _addArg = (commit: boolean): DocumentNode | null => {
    const {
      selection,
      getDefaultScalarArgValue,
      makeDefaultArg,
      parentField,
      arg,
    } = this.props;
    const argType = unwrapInputType(arg.type);

    let argSelection = null;
    if (this._previousArgSelection) {
      argSelection = this._previousArgSelection;
    } else if (isInputObjectType(argType)) {
      const fields = argType.getFields();
      argSelection = {
        kind: Kind.ARGUMENT,
        name: { kind: Kind.NAME, value: arg.name },
        value: {
          kind: Kind.OBJECT,
          fields: defaultInputObjectFields(
            getDefaultScalarArgValue,
            makeDefaultArg,
            parentField,
            Object.keys(fields).map(k => fields[k]),
          ),
        },
      };
    } else if (isLeafType(argType)) {
      argSelection = {
        kind: Kind.ARGUMENT,
        name: { kind: Kind.NAME, value: arg.name },
        value: getDefaultScalarArgValue(parentField, arg, argType),
      };
    }

    if (!argSelection) {
      console.error('Unable to add arg for argType', argType);
      return null;
    } else {
      return this.props.modifyArguments(
        [...(selection?.arguments || []), argSelection],
        commit,
      );
    }
  };
  _setArgValue = (
    // TODO: I don't think this typing is correct
    event: React.EventHandler<any> | VariableDefinitionNode,
    options: null | boolean,
  ) => {
    let settingToNull = false;
    let settingToVariable = false;
    let settingToLiteralValue = false;
    try {
      if (event.kind === Kind.VARIABLE_DEFINITION) {
        settingToVariable = true;
      } else if (event === null || typeof event === 'undefined') {
        settingToNull = true;
      } else if (typeof event.kind === 'string') {
        settingToLiteralValue = true;
      }
    } catch (e) {}
    const { selection } = this.props;
    const argSelection = this._getArgSelection();
    if (!argSelection && !settingToVariable) {
      console.error('missing arg selection when setting arg value');
      return;
    }
    const argType = unwrapInputType(this.props.arg.type);

    const handleable =
      isLeafType(argType) ||
      settingToVariable ||
      settingToNull ||
      settingToLiteralValue;

    if (!handleable) {
      console.warn('Unable to handle non leaf types in ArgView._setArgValue');
      return;
    }

    let targetValue: string | VariableDefinitionNode;
    let value: ValueNode;

    if (event === null || typeof event === 'undefined') {
      value = null;
    } else if (event.target && typeof event.target.value === 'string') {
      targetValue = event.target.value;
      value = coerceArgValue(argType, targetValue);
    } else if (!event.target && event.kind === Kind.VARIABLE_DEFINITION) {
      targetValue = event;
      value = targetValue.variable;
    } else if (typeof event.kind === 'string') {
      value = event;
    }

    return this.props.modifyArguments(
      (selection.arguments || []).map(a =>
        a === argSelection
          ? {
              ...a,
              value: value,
            }
          : a,
      ),
      options,
    );
  };

  _setArgFields = (fields, commit: boolean): DocumentNode | null => {
    const { selection } = this.props;
    const argSelection = this._getArgSelection();
    if (!argSelection) {
      console.error('missing arg selection when setting arg value');
      return null;
    }

    return this.props.modifyArguments(
      (selection.arguments || []).map(a =>
        a === argSelection
          ? {
              ...a,
              value: {
                kind: Kind.OBJECT,
                fields,
              },
            }
          : a,
      ),
      commit,
    );
  };

  render() {
    const { arg, parentField } = this.props;
    const argSelection = this._getArgSelection();

    return (
      <AbstractArgView
        argValue={argSelection ? argSelection.value : null}
        arg={arg}
        parentField={parentField}
        addArg={this._addArg}
        removeArg={this._removeArg}
        setArgFields={this._setArgFields}
        setArgValue={this._setArgValue}
        getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
        makeDefaultArg={this.props.makeDefaultArg}
        onRunOperation={this.props.onRunOperation}
        styleConfig={this.props.styleConfig}
        onCommit={this.props.onCommit}
        definition={this.props.definition}
      />
    );
  }
}

function isRunShortcut(event) {
  return event.ctrlKey && event.key === 'Enter';
}

function canRunOperation(operationName) {
  // it does not make sense to try to execute a fragment
  return operationName !== Kind.FRAGMENT_DEFINITION;
}

type ScalarInputProps = {
  arg: GraphQLArgument;
  argValue: ValueNode;
  setArgValue: (event, commit: boolean) => DocumentNode | null;
  onRunOperation: () => void;
  styleConfig: StyleConfig;
};

class ScalarInput extends React.PureComponent<ScalarInputProps, {}> {
  _ref: null | any;
  _handleChange = event => {
    this.props.setArgValue(event, true);
  };

  componentDidMount() {
    const input = this._ref;
    const activeElement = document.activeElement;
    if (
      input &&
      activeElement &&
      !(activeElement instanceof HTMLTextAreaElement)
    ) {
      input.focus();
      input.setSelectionRange(0, input.value.length);
    }
  }

  render() {
    const { arg, argValue, styleConfig } = this.props;
    const argType = unwrapInputType(arg.type);
    const value = typeof argValue.value === 'string' ? argValue.value : '';
    const color =
      this.props.argValue.kind === Kind.STRING
        ? styleConfig.colors.string
        : styleConfig.colors.number;
    return (
      <span style={{ color }}>
        {argType.name === 'String' ? '"' : ''}
        <input
          style={{
            border: 'none',
            borderBottom: '1px solid #888',
            outline: 'none',
            width: `${Math.max(1, Math.min(15, value.length))}ch`,
            color,
          }}
          ref={ref => {
            this._ref = ref;
          }}
          type="text"
          onChange={this._handleChange}
          value={value}
        />
        {argType.name === 'String' ? '"' : ''}
      </span>
    );
  }
}

type AbstractArgViewProps = {
  argValue: null | ValueNode;
  arg: GraphQLArgument;
  parentField: Field;
  setArgValue: (
    e: Event | VariableDefinitionNode,
    commit: boolean,
  ) => DocumentNode | null;
  setArgFields: (
    fields: ReadonlyArray<ObjectFieldNode>,
    commit: boolean,
  ) => DocumentNode | null;
  addArg: (commit: boolean) => DocumentNode | null;
  removeArg: (commit: boolean) => DocumentNode | null;
  onCommit: (newDoc: DocumentNode) => void;
  getDefaultScalarArgValue: GetDefaultScalarArgValue;
  makeDefaultArg: null | MakeDefaultArg;
  onRunOperation: () => void;
  styleConfig: StyleConfig;
  definition: FragmentDefinitionNode | OperationDefinitionNode;
};

class AbstractArgView extends React.PureComponent<
  AbstractArgViewProps,
  { displayArgActions: boolean }
> {
  state = { displayArgActions: false };
  render() {
    const { argValue, arg, styleConfig } = this.props;
    /* TODO: handle List types*/
    const argType = unwrapInputType(arg.type);

    let input = null;
    if (argValue) {
      if (argValue.kind === Kind.VARIABLE) {
        input = (
          <span style={{ color: styleConfig.colors.variable }}>
            ${argValue.name.value}
          </span>
        );
      } else if (isScalarType(argType)) {
        if (argType.name === 'Boolean') {
          input = (
            <select
              style={{
                color: styleConfig.colors.builtin,
              }}
              onChange={this.props.setArgValue}
              value={
                argValue.kind === Kind.BOOLEAN ? argValue.value : undefined
              }
            >
              <option key="true" value="true">
                true
              </option>
              <option key="false" value="false">
                false
              </option>
            </select>
          );
        } else {
          input = (
            <ScalarInput
              setArgValue={this.props.setArgValue}
              arg={arg}
              argValue={argValue}
              onRunOperation={this.props.onRunOperation}
              styleConfig={this.props.styleConfig}
            />
          );
        }
      } else if (isEnumType(argType)) {
        if (argValue.kind === Kind.ENUM) {
          input = (
            <select
              style={{
                backgroundColor: 'white',
                color: styleConfig.colors.string2,
              }}
              onChange={this.props.setArgValue}
              value={argValue.value}
            >
              {argType.getValues().map(value => (
                <option key={value.name} value={value.name}>
                  {value.name}
                </option>
              ))}
            </select>
          );
        } else {
          console.error(
            'arg mismatch between arg and selection',
            argType,
            argValue,
          );
        }
      } else if (isInputObjectType(argType)) {
        if (argValue.kind === Kind.OBJECT) {
          const fields = argType.getFields();
          input = (
            <div style={{ marginLeft: 16 }}>
              {Object.keys(fields)
                .sort()
                .map(fieldName => (
                  <InputArgView
                    key={fieldName}
                    arg={fields[fieldName]}
                    parentField={this.props.parentField}
                    selection={argValue}
                    modifyFields={this.props.setArgFields}
                    getDefaultScalarArgValue={
                      this.props.getDefaultScalarArgValue
                    }
                    makeDefaultArg={this.props.makeDefaultArg}
                    onRunOperation={this.props.onRunOperation}
                    styleConfig={this.props.styleConfig}
                    onCommit={this.props.onCommit}
                    definition={this.props.definition}
                  />
                ))}
            </div>
          );
        } else {
          console.error(
            'arg mismatch between arg and selection',
            argType,
            argValue,
          );
        }
      }
    }

    const variablize = () => {
      /**
      1. Find current operation variables
      2. Find current arg value
      3. Create a new variable
      4. Replace current arg value with variable
      5. Add variable to operation
      */

      const baseVariableName = arg.name;
      const conflictingNameCount = (
        this.props.definition.variableDefinitions || []
      ).filter(varDef =>
        varDef.variable.name.value.startsWith(baseVariableName),
      ).length;

      let variableName;
      if (conflictingNameCount > 0) {
        variableName = `${baseVariableName}${conflictingNameCount}`;
      } else {
        variableName = baseVariableName;
      }
      // To get an AST definition of our variable from the instantiated arg,
      // we print it to a string, then parseType to get our AST.
      const argPrintedType = arg.type.toString();
      const argType = parseType(argPrintedType);

      const base: VariableDefinitionNode = {
        kind: Kind.VARIABLE_DEFINITION,
        variable: {
          kind: Kind.VARIABLE,
          name: {
            kind: Kind.NAME,
            value: variableName,
          },
        },
        type: argType,
        directives: [],
      };

      const variableDefinitionByName = (name: string) =>
        (this.props.definition.variableDefinitions || []).find(
          varDef => varDef.variable.name.value === name,
        );

      let variable: null | VariableDefinitionNode;

      let subVariableUsageCountByName: {
        [key: string]: number;
      } = {};

      if (typeof argValue !== 'undefined' && argValue !== null) {
        /** In the process of devariabilizing descendent selections,
         * we may have caused their variable definitions to become unused.
         * Keep track and remove any variable definitions with 1 or fewer usages.
         * */
        const cleanedDefaultValue = visit(argValue, {
          Variable(node) {
            const varName = node.name.value;
            const varDef = variableDefinitionByName(varName);

            subVariableUsageCountByName[varName] =
              subVariableUsageCountByName[varName] + 1 || 1;

            if (!varDef) {
              return;
            }

            return varDef.defaultValue;
          },
        });

        const isNonNullable = base.type.kind === Kind.NON_NULL_TYPE;

        // We're going to give the variable definition a default value, so we must make its type nullable
        const unwrappedBase = isNonNullable
          ? { ...base, type: base.type.type }
          : base;

        variable = { ...unwrappedBase, defaultValue: cleanedDefaultValue };
      } else {
        variable = base;
      }

      const newlyUnusedVariables = Object.entries(subVariableUsageCountByName)
        // $FlowFixMe: Can't get Object.entries to realize usageCount *must* be a number
        .filter(([_, usageCount]: [string, number]) => usageCount < 2)
        .map(([varName, _]) => varName);

      if (variable) {
        const newDoc: null | DocumentNode = this.props.setArgValue(
          variable,
          false,
        );

        if (newDoc) {
          const targetOperation = newDoc.definitions.find(definition => {
            if (
              !!definition?.operation &&
              !!definition?.name &&
              !!definition?.name?.value &&
              //
              !!this.props.definition.name &&
              !!this.props.definition.name.value
            ) {
              return definition.name.value === this.props.definition.name.value;
            }
            return false;
          });

          const newVariableDefinitions: Array<VariableDefinitionNode> = [
            ...(targetOperation.variableDefinitions || []),
            variable,
          ].filter(
            varDef =>
              newlyUnusedVariables.indexOf(varDef.variable.name.value) === -1,
          );

          const newOperation = {
            ...targetOperation,
            variableDefinitions: newVariableDefinitions,
          };

          const existingDefs = newDoc.definitions;

          const newDefinitions = existingDefs.map(existingOperation => {
            if (targetOperation === existingOperation) {
              return newOperation;
            } else {
              return existingOperation;
            }
          });

          const finalDoc = {
            ...newDoc,
            definitions: newDefinitions,
          };

          this.props.onCommit(finalDoc);
        }
      }
    };

    const devariablize = () => {
      /**
       * 1. Find the current variable definition in the operation def
       * 2. Extract its value
       * 3. Replace the current arg value
       * 4. Visit the resulting operation to see if there are any other usages of the variable
       * 5. If not, remove the variableDefinition
       */
      if (!argValue?.name?.value) {
        return;
      }

      const variableName = argValue?.name?.value;
      const variableDefinition = (
        this.props.definition.variableDefinitions || []
      ).find(varDef => varDef.variable.name.value === variableName);

      if (!variableDefinition) {
        return;
      }

      const defaultValue = variableDefinition.defaultValue;

      const newDoc: null | DocumentNode = this.props.setArgValue(defaultValue, {
        commit: false,
      });

      if (newDoc) {
        const targetOperation: null | OperationDefinitionNode =
          newDoc.definitions.find(
            definition =>
              definition?.name?.value === this.props.definition?.name?.value,
          ) ?? null;

        if (!targetOperation) {
          return;
        }

        // After de-variabilizing, see if the variable is still in use. If not, remove it.
        let variableUseCount = 0;

        visit(targetOperation, {
          Variable(node) {
            if (node.name.value === variableName) {
              variableUseCount = variableUseCount + 1;
            }
          },
        });

        let newVariableDefinitions = targetOperation.variableDefinitions || [];

        // A variable is in use if it shows up at least twice (once in the definition, once in the selection)
        if (variableUseCount < 2) {
          newVariableDefinitions = newVariableDefinitions.filter(
            varDef => varDef.variable.name.value !== variableName,
          );
        }

        const newOperation = {
          ...targetOperation,
          variableDefinitions: newVariableDefinitions,
        };

        const existingDefs = newDoc.definitions;

        const newDefinitions = existingDefs.map(existingOperation => {
          if (targetOperation === existingOperation) {
            return newOperation;
          } else {
            return existingOperation;
          }
        });

        const finalDoc = {
          ...newDoc,
          definitions: newDefinitions,
        };

        this.props.onCommit(finalDoc);
      }
    };

    const isArgValueVariable = argValue && argValue.kind === Kind.VARIABLE;

    const variablizeActionButton = !this.state.displayArgActions ? null : (
      <button
        type="submit"
        className="toolbar-button"
        title={
          isArgValueVariable
            ? 'Remove the variable'
            : 'Extract the current value into a GraphQL variable'
        }
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();

          if (isArgValueVariable) {
            devariablize();
          } else {
            variablize();
          }
        }}
        style={styleConfig.styles.actionButtonStyle}
      >
        <span style={{ color: styleConfig.colors.variable }}>{'$'}</span>
      </button>
    );

    return (
      <div
        style={{
          cursor: 'pointer',
          minHeight: '16px',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        data-arg-name={arg.name}
        data-arg-type={argType.name}
        className={`graphiql-explorer-${arg.name}`}
      >
        <span
          style={{ cursor: 'pointer' }}
          onClick={event => {
            const shouldAdd = !argValue;
            if (shouldAdd) {
              this.props.addArg(true);
            } else {
              this.props.removeArg(true);
            }
            this.setState({ displayArgActions: shouldAdd });
          }}
        >
          {isInputObjectType(argType) ? (
            <span>
              {!!argValue
                ? this.props.styleConfig.arrowOpen
                : this.props.styleConfig.arrowClosed}
            </span>
          ) : (
            <Checkbox
              checked={!!argValue}
              styleConfig={this.props.styleConfig}
            />
          )}
          <span
            style={{ color: styleConfig.colors.attribute }}
            title={arg.description}
            onMouseEnter={() => {
              // Make implementation a bit easier and only show 'variablize' action if arg is already added
              if (argValue !== null && typeof argValue !== 'undefined') {
                this.setState({ displayArgActions: true });
              }
            }}
            onMouseLeave={() => this.setState({ displayArgActions: false })}
          >
            {arg.name}
            {isRequiredArgument(arg) ? '*' : ''}: {variablizeActionButton}{' '}
          </span>{' '}
        </span>
        {input || <span />}{' '}
      </div>
    );
  }
}

type AbstractViewProps = {
  implementingType: GraphQLObjectType;
  selections: Selections;
  modifySelections: (
    selections: Selections,
    commit?: boolean,
  ) => DocumentNode | null;
  schema: GraphQLSchema;
  getDefaultFieldNames: (type: GraphQLObjectType) => Array<string>;
  getDefaultScalarArgValue: GetDefaultScalarArgValue;
  makeDefaultArg: null | MakeDefaultArg;
  onRunOperation: () => void;
  onCommit: (newDoc: DocumentNode) => void;
  styleConfig: StyleConfig;
  definition: FragmentDefinitionNode | OperationDefinitionNode;
};

class AbstractView extends React.PureComponent<AbstractViewProps, {}> {
  _previousSelection: null | InlineFragmentNode = null;
  _addFragment = () => {
    this.props.modifySelections([
      ...this.props.selections,
      this._previousSelection || {
        kind: Kind.INLINE_FRAGMENT,
        typeCondition: {
          kind: Kind.NAMED_TYPE,
          name: { kind: Kind.NAME, value: this.props.implementingType.name },
        },
        selectionSet: {
          kind: Kind.SELECTION_SET,
          selections: this.props
            .getDefaultFieldNames(this.props.implementingType)
            .map(fieldName => ({
              kind: Kind.FIELD,
              name: { kind: Kind.NAME, value: fieldName },
            })),
        },
      },
    ]);
  };
  _removeFragment = () => {
    const thisSelection = this._getSelection();
    this._previousSelection = thisSelection;
    this.props.modifySelections(
      this.props.selections.filter(s => s !== thisSelection),
    );
  };
  _getSelection = (): null | InlineFragmentNode => {
    const selection = this.props.selections.find(
      selection =>
        selection.kind === Kind.INLINE_FRAGMENT &&
        selection.typeCondition &&
        this.props.implementingType.name === selection.typeCondition.name.value,
    );
    if (!selection) {
      return null;
    }
    if (selection.kind === Kind.INLINE_FRAGMENT) {
      return selection;
    }
    return null;
  };

  _modifyChildSelections = (
    selections: Selections,
    options: null | { commit: boolean },
  ): DocumentNode | null => {
    const thisSelection = this._getSelection();
    return this.props.modifySelections(
      this.props.selections.map(selection => {
        if (selection === thisSelection) {
          return {
            directives: selection.directives,
            kind: Kind.INLINE_FRAGMENT,
            typeCondition: {
              kind: Kind.NAMED_TYPE,
              name: {
                kind: Kind.NAME,
                value: this.props.implementingType.name,
              },
            },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections,
            },
          };
        }
        return selection;
      }),
      options,
    );
  };

  render() {
    const { implementingType, schema, getDefaultFieldNames, styleConfig } =
      this.props;
    const selection = this._getSelection();
    const fields = implementingType.getFields();
    const childSelections = selection
      ? selection.selectionSet
        ? selection.selectionSet.selections
        : []
      : [];

    return (
      <div className={`graphiql-explorer-${implementingType.name}`}>
        <span
          style={{ cursor: 'pointer' }}
          onClick={selection ? this._removeFragment : this._addFragment}
        >
          <Checkbox
            checked={!!selection}
            styleConfig={this.props.styleConfig}
          />
          <span style={{ color: styleConfig.colors.atom }}>
            {this.props.implementingType.name}
          </span>
        </span>
        {selection ? (
          <div style={{ marginLeft: 16 }}>
            {Object.keys(fields)
              .sort()
              .map(fieldName => (
                <FieldView
                  key={fieldName}
                  field={fields[fieldName]}
                  selections={childSelections}
                  modifySelections={this._modifyChildSelections}
                  schema={schema}
                  getDefaultFieldNames={getDefaultFieldNames}
                  getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
                  makeDefaultArg={this.props.makeDefaultArg}
                  onRunOperation={this.props.onRunOperation}
                  onCommit={this.props.onCommit}
                  styleConfig={this.props.styleConfig}
                  definition={this.props.definition}
                  availableFragments={this.props.availableFragments}
                />
              ))}
          </div>
        ) : null}
      </div>
    );
  }
}

type FragmentViewProps = {
  fragment: FragmentDefinitionNode;
  selections: Selections;
  modifySelections: (
    selections: Selections,
    commit?: boolean,
  ) => DocumentNode | null;
  onCommit: (newDoc: DocumentNode) => void;
  schema: GraphQLSchema;
  styleConfig: StyleConfig;
};

class FragmentView extends React.PureComponent<FragmentViewProps, {}> {
  _previousSelection: null | InlineFragmentNode = null;
  _addFragment = () => {
    this.props.modifySelections([
      ...this.props.selections,
      this._previousSelection ||
        ({
          kind: Kind.FRAGMENT_SPREAD,
          name: this.props.fragment.name,
        } as FragmentSpreadNode),
    ]);
  };
  _removeFragment = () => {
    const thisSelection = this._getSelection();
    this._previousSelection = thisSelection;
    this.props.modifySelections(
      this.props.selections.filter(s => {
        const isTargetSelection =
          s.kind === Kind.FRAGMENT_SPREAD &&
          s.name.value === this.props.fragment.name.value;

        return !isTargetSelection;
      }),
    );
  };
  _getSelection = (): null | FragmentSpreadNode => {
    const selection = this.props.selections.find(selection => {
      return (
        selection.kind === Kind.FRAGMENT_SPREAD &&
        selection.name.value === this.props.fragment.name.value
      );
    });

    return selection;
  };

  render() {
    const { styleConfig } = this.props;
    const selection = this._getSelection();
    return (
      <div className={`graphiql-explorer-${this.props.fragment.name.value}`}>
        <span
          style={{ cursor: 'pointer' }}
          onClick={selection ? this._removeFragment : this._addFragment}
        >
          <Checkbox
            checked={!!selection}
            styleConfig={this.props.styleConfig}
          />
          <span
            style={{ color: styleConfig.colors.def }}
            className={`graphiql-explorer-${this.props.fragment.name.value}`}
          >
            {this.props.fragment.name.value}
          </span>
        </span>
      </div>
    );
  }
}

type FieldViewProps = {
  field: Field;
  selections: Selections;
  modifySelections: (
    selections: Selections,
    commit?: boolean,
  ) => DocumentNode | null;
  schema: GraphQLSchema;
  getDefaultFieldNames: (type: GraphQLObjectType) => Array<string>;
  getDefaultScalarArgValue: GetDefaultScalarArgValue;
  makeDefaultArg: null | MakeDefaultArg;
  onRunOperation: () => void;
  styleConfig: StyleConfig;
  onCommit: (newDoc: DocumentNode) => void;
  definition: FragmentDefinitionNode | OperationDefinitionNode;
  availableFragments: AvailableFragments;
};

function defaultInputObjectFields(
  getDefaultScalarArgValue: GetDefaultScalarArgValue,
  makeDefaultArg: null | MakeDefaultArg,
  parentField: Field,
  fields: Array<GraphQLInputField>,
): Array<ObjectFieldNode> {
  const nodes = [];
  for (const field of fields) {
    if (
      isRequiredInputField(field) ||
      (makeDefaultArg && makeDefaultArg(parentField, field))
    ) {
      const fieldType = unwrapInputType(field.type);
      if (isInputObjectType(fieldType)) {
        const fields = fieldType.getFields();
        nodes.push({
          kind: Kind.OBJECT_FIELD,
          name: { kind: Kind.NAME, value: field.name },
          value: {
            kind: Kind.OBJECT,
            fields: defaultInputObjectFields(
              getDefaultScalarArgValue,
              makeDefaultArg,
              parentField,
              Object.keys(fields).map(k => fields[k]),
            ),
          },
        });
      } else if (isLeafType(fieldType)) {
        nodes.push({
          kind: Kind.OBJECT_FIELD,
          name: { kind: Kind.NAME, value: field.name },
          value: getDefaultScalarArgValue(parentField, field, fieldType),
        });
      }
    }
  }
  return nodes;
}

function defaultArgs(
  getDefaultScalarArgValue: GetDefaultScalarArgValue,
  makeDefaultArg: null | MakeDefaultArg,
  field: Field,
): Array<ArgumentNode> {
  const args = [];
  for (const arg of field.args) {
    if (
      isRequiredArgument(arg) ||
      (makeDefaultArg && makeDefaultArg(field, arg))
    ) {
      const argType = unwrapInputType(arg.type);
      if (isInputObjectType(argType)) {
        const fields = argType.getFields();
        args.push({
          kind: Kind.ARGUMENT,
          name: { kind: Kind.NAME, value: arg.name },
          value: {
            kind: Kind.OBJECT,
            fields: defaultInputObjectFields(
              getDefaultScalarArgValue,
              makeDefaultArg,
              field,
              Object.keys(fields).map(k => fields[k]),
            ),
          },
        });
      } else if (isLeafType(argType)) {
        args.push({
          kind: Kind.ARGUMENT,
          name: { kind: Kind.NAME, value: arg.name },
          value: getDefaultScalarArgValue(field, arg, argType),
        });
      }
    }
  }
  return args;
}

class FieldView extends React.PureComponent<
  FieldViewProps,
  { displayFieldActions: boolean }
> {
  state = { displayFieldActions: false };

  _previousSelection: null | SelectionNode;
  _addAllFieldsToSelections = rawSubfields => {
    const subFields: Array<FieldNode> = !!rawSubfields
      ? Object.keys(rawSubfields).map(fieldName => {
          return {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: fieldName },
            arguments: [],
          };
        })
      : [];

    const subSelectionSet: SelectionSetNode = {
      kind: Kind.SELECTION_SET,
      selections: subFields,
    };

    const nextSelections = [
      ...this.props.selections.filter(selection => {
        if (selection.kind === Kind.INLINE_FRAGMENT) {
          return true;
        } else {
          // Remove the current selection set for the target field
          return selection.name.value !== this.props.field.name;
        }
      }),
      {
        kind: Kind.FIELD,
        name: { kind: Kind.NAME, value: this.props.field.name },
        arguments: defaultArgs(
          this.props.getDefaultScalarArgValue,
          this.props.makeDefaultArg,
          this.props.field,
        ),
        selectionSet: subSelectionSet,
      },
    ];

    this.props.modifySelections(nextSelections);
  };

  _addFieldToSelections = _rawSubfields => {
    const nextSelections = [
      ...this.props.selections,
      this._previousSelection || {
        kind: Kind.FIELD,
        name: { kind: Kind.NAME, value: this.props.field.name },
        arguments: defaultArgs(
          this.props.getDefaultScalarArgValue,
          this.props.makeDefaultArg,
          this.props.field,
        ),
      },
    ];

    this.props.modifySelections(nextSelections);
  };

  _handleUpdateSelections = event => {
    const selection = this._getSelection();
    if (selection && !event.altKey) {
      this._removeFieldFromSelections();
    } else {
      const fieldType = getNamedType(this.props.field.type);
      const rawSubfields = isObjectType(fieldType) && fieldType.getFields();

      const shouldSelectAllSubfields = !!rawSubfields && event.altKey;

      shouldSelectAllSubfields
        ? this._addAllFieldsToSelections(rawSubfields)
        : this._addFieldToSelections(rawSubfields);
    }
  };

  _removeFieldFromSelections = () => {
    const previousSelection = this._getSelection();
    this._previousSelection = previousSelection;
    this.props.modifySelections(
      this.props.selections.filter(
        selection => selection !== previousSelection,
      ),
    );
  };
  _getSelection = (): null | FieldNode => {
    const selection = this.props.selections.find(
      selection =>
        selection.kind === Kind.FIELD &&
        this.props.field.name === selection.name.value,
    );
    if (!selection) {
      return null;
    }
    if (selection.kind === Kind.FIELD) {
      return selection;
    }
    return null;
  };

  _setArguments = (
    argumentNodes: ReadonlyArray<ArgumentNode>,
    options: null | { commit: boolean },
  ): DocumentNode | null | void => {
    const selection = this._getSelection();
    if (!selection) {
      console.error('Missing selection when setting arguments', argumentNodes);
      return;
    }
    return this.props.modifySelections(
      this.props.selections.map(s =>
        s === selection
          ? {
              alias: selection.alias,
              arguments: argumentNodes,
              directives: selection.directives,
              kind: Kind.FIELD,
              name: selection.name,
              selectionSet: selection.selectionSet,
            }
          : s,
      ),
      options,
    );
  };

  _modifyChildSelections = (
    selections: Selections,
    options: null | { commit: boolean },
  ): DocumentNode | null => {
    return this.props.modifySelections(
      this.props.selections.map(selection => {
        if (
          selection.kind === Kind.FIELD &&
          this.props.field.name === selection.name.value
        ) {
          if (selection.kind !== Kind.FIELD) {
            throw new Error('invalid selection');
          }
          return {
            alias: selection.alias,
            arguments: selection.arguments,
            directives: selection.directives,
            kind: Kind.FIELD,
            name: selection.name,
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections,
            },
          };
        }
        return selection;
      }),
      options,
    );
  };

  render() {
    const { field, schema, getDefaultFieldNames, styleConfig } = this.props;
    const selection = this._getSelection();
    const type = unwrapOutputType(field.type);
    const args: GraphQLArgument[] = field.args.sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    let className = `graphiql-explorer-node graphiql-explorer-${field.name}`;

    if (field.deprecationReason) {
      className += ' graphiql-explorer-deprecated';
    }

    const applicableFragments =
      isObjectType(type) || isInterfaceType(type) || isUnionType(type)
        ? this.props.availableFragments &&
          this.props.availableFragments[type.name]
        : null;

    const node = (
      <div className={className}>
        <span
          title={field?.description ?? undefined}
          style={{
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: '16px',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
          data-field-name={field.name}
          data-field-type={type.name}
          onClick={this._handleUpdateSelections}
          onMouseEnter={() => {
            const containsMeaningfulSubselection =
              isObjectType(type) &&
              selection &&
              selection.selectionSet &&
              selection.selectionSet.selections.filter(
                selection => selection.kind !== Kind.FRAGMENT_SPREAD,
              ).length > 0;

            if (containsMeaningfulSubselection) {
              this.setState({ displayFieldActions: true });
            }
          }}
          onMouseLeave={() => this.setState({ displayFieldActions: false })}
        >
          {isObjectType(type) ? (
            <span>
              {!!selection
                ? this.props.styleConfig.arrowOpen
                : this.props.styleConfig.arrowClosed}
            </span>
          ) : null}
          {isObjectType(type) ? null : (
            <Checkbox
              checked={!!selection}
              styleConfig={this.props.styleConfig}
            />
          )}
          <span
            style={{ color: styleConfig.colors.property }}
            className="graphiql-explorer-field-view"
          >
            {field.name}
          </span>
          {!this.state.displayFieldActions ? null : (
            <button
              type="submit"
              className="toolbar-button"
              title="Extract selections into a new reusable fragment"
              onClick={event => {
                event.preventDefault();
                event.stopPropagation();
                // 1. Create a fragment spread node
                // 2. Copy selections from this object to fragment
                // 3. Replace selections in this object with fragment spread
                // 4. Add fragment to document
                const typeName = type.name;
                let newFragmentName = `${typeName}Fragment`;

                const conflictingNameCount = (applicableFragments ?? []).filter(
                  (fragment: FragmentDefinitionNode) => {
                    return fragment.name.value.startsWith(newFragmentName);
                  },
                ).length;

                if (conflictingNameCount > 0) {
                  newFragmentName = `${newFragmentName}${conflictingNameCount}`;
                }

                const childSelections = selection
                  ? selection.selectionSet
                    ? selection.selectionSet.selections
                    : []
                  : [];

                const nextSelections = [
                  {
                    kind: Kind.FRAGMENT_SPREAD,
                    name: {
                      kind: Kind.NAME,
                      value: newFragmentName,
                    },
                    directives: [],
                  } as FragmentSpreadNode,
                ];

                const newFragmentDefinition: FragmentDefinitionNode = {
                  kind: Kind.FRAGMENT_DEFINITION,
                  name: {
                    kind: Kind.NAME,
                    value: newFragmentName,
                  },
                  typeCondition: {
                    kind: Kind.NAMED_TYPE,
                    name: {
                      kind: Kind.NAME,
                      value: type.name,
                    },
                  },
                  directives: [],
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: childSelections,
                  },
                };

                const newDoc = this._modifyChildSelections(
                  nextSelections,
                  false,
                );

                if (newDoc) {
                  const newDocWithFragment = {
                    ...newDoc,
                    definitions: [...newDoc.definitions, newFragmentDefinition],
                  };

                  this.props.onCommit(newDocWithFragment);
                } else {
                  console.warn('Unable to complete extractFragment operation');
                }
              }}
              style={{
                ...styleConfig.styles.actionButtonStyle,
              }}
            >
              <span>{'…'}</span>
            </button>
          )}
        </span>
        {selection && args.length ? (
          <div
            style={{ marginLeft: 16 }}
            className="graphiql-explorer-graphql-arguments"
          >
            {args.map(arg => (
              <ArgView
                key={arg.name}
                parentField={field}
                arg={arg}
                selection={selection}
                modifyArguments={this._setArguments}
                getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
                makeDefaultArg={this.props.makeDefaultArg}
                onRunOperation={this.props.onRunOperation}
                styleConfig={this.props.styleConfig}
                onCommit={this.props.onCommit}
                definition={this.props.definition}
              />
            ))}
          </div>
        ) : null}
      </div>
    );

    if (
      selection &&
      (isObjectType(type) || isInterfaceType(type) || isUnionType(type))
    ) {
      const fields = isUnionType(type) ? {} : type.getFields();
      const childSelections = selection
        ? selection.selectionSet
          ? selection.selectionSet.selections
          : []
        : [];
      return (
        <div className={`graphiql-explorer-${field.name}`}>
          {node}
          <div style={{ marginLeft: 16 }}>
            {!!applicableFragments
              ? applicableFragments.map(fragment => {
                  const type = schema.getType(
                    fragment.typeCondition.name.value,
                  );
                  const fragmentName = fragment.name.value;
                  return !type ? null : (
                    <FragmentView
                      key={fragmentName}
                      fragment={fragment}
                      selections={childSelections}
                      modifySelections={this._modifyChildSelections}
                      schema={schema}
                      styleConfig={this.props.styleConfig}
                      onCommit={this.props.onCommit}
                    />
                  );
                })
              : null}
            {Object.keys(fields)
              .sort()
              .map(fieldName => (
                <FieldView
                  key={fieldName}
                  field={fields[fieldName]}
                  selections={childSelections}
                  modifySelections={this._modifyChildSelections}
                  schema={schema}
                  getDefaultFieldNames={getDefaultFieldNames}
                  getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
                  makeDefaultArg={this.props.makeDefaultArg}
                  onRunOperation={this.props.onRunOperation}
                  styleConfig={this.props.styleConfig}
                  onCommit={this.props.onCommit}
                  definition={this.props.definition}
                  availableFragments={this.props.availableFragments}
                />
              ))}
            {isInterfaceType(type) || isUnionType(type)
              ? schema
                  .getPossibleTypes(type)
                  .map(type => (
                    <AbstractView
                      key={type.name}
                      implementingType={type}
                      selections={childSelections}
                      modifySelections={this._modifyChildSelections}
                      schema={schema}
                      getDefaultFieldNames={getDefaultFieldNames}
                      getDefaultScalarArgValue={
                        this.props.getDefaultScalarArgValue
                      }
                      makeDefaultArg={this.props.makeDefaultArg}
                      onRunOperation={this.props.onRunOperation}
                      styleConfig={this.props.styleConfig}
                      onCommit={this.props.onCommit}
                      definition={this.props.definition}
                    />
                  ))
              : null}
          </div>
        </div>
      );
    }
    return node;
  }
}

function parseQuery(text: string): null | DocumentNode | Error {
  try {
    if (!text.trim()) {
      return null;
    }
    return parse(
      text,
      // Tell graphql to not bother track locations when parsing, we don't need
      // it and it's a tiny bit more expensive.
      { noLocation: true },
    );
  } catch (e) {
    return new Error(e);
  }
}

const DEFAULT_OPERATION = {
  kind: Kind.OPERATION_DEFINITION,
  operation: 'query',
  variableDefinitions: [],
  name: { kind: Kind.NAME, value: 'MyQuery' },
  directives: [],
  selectionSet: {
    kind: Kind.SELECTION_SET,
    selections: [],
  },
} as OperationDefinitionNode;

const DEFAULT_DOCUMENT = {
  kind: Kind.DOCUMENT,
  definitions: [DEFAULT_OPERATION],
} as DocumentNode;

let parseQueryMemoize: null | [string, DocumentNode] = null;
function memoizeParseQuery(query: string): DocumentNode {
  if (parseQueryMemoize && parseQueryMemoize[0] === query) {
    return parseQueryMemoize[1];
  } else {
    const result = parseQuery(query);
    if (!result) {
      return DEFAULT_DOCUMENT;
    } else if (result instanceof Error) {
      if (parseQueryMemoize) {
        // Most likely a temporarily invalid query while they type
        return parseQueryMemoize[1];
      } else {
        return DEFAULT_DOCUMENT;
      }
    } else {
      parseQueryMemoize = [query, result];
      return result;
    }
  }
}

const defaultStyles = {
  buttonStyle: {
    fontSize: '1.2em',
    padding: '0px',
    backgroundColor: 'white',
    border: 'none',
    margin: '5px 0px',
    height: '40px',
    width: '100%',
    display: 'block',
    maxWidth: 'none',
  },

  actionButtonStyle: {
    padding: '0px',
    backgroundColor: 'white',
    border: 'none',
    margin: '0px',
    maxWidth: 'none',
    height: '15px',
    width: '15px',
    display: 'inline-block',
    fontSize: 'smaller',
  },

  explorerActionsStyle: {
    margin: '4px -8px -8px',
    paddingLeft: '8px',
    bottom: '0px',
    width: '100%',
    textAlign: 'center',
    background: 'none',
    borderTop: 'none',
    borderBottom: 'none',
  },
};

type RootViewProps = {
  schema: GraphQLSchema;
  isLast: boolean;
  fields: null | GraphQLFieldMap<any, any>;
  operationType: OperationType;
  name: null | string;
  onTypeName: null | string;
  definition: FragmentDefinitionNode | OperationDefinitionNode;
  onEdit: (
    operationDef: null | OperationDefinitionNode | FragmentDefinitionNode,
    options: { commit: boolean } | null,
  ) => DocumentNode;
  onCommit: (document: DocumentNode) => void;
  onOperationRename: (query: string) => void;
  onOperationDestroy: () => void;
  onOperationClone: () => void;
  onRunOperation: (name: null | string) => void;
  onMount: (rootViewElId: string) => void;
  getDefaultFieldNames: (type: GraphQLObjectType) => Array<string>;
  getDefaultScalarArgValue: GetDefaultScalarArgValue;
  makeDefaultArg: null | MakeDefaultArg;
  styleConfig: StyleConfig;
  availableFragments: AvailableFragments;
};

class RootView extends React.PureComponent<
  RootViewProps,
  { newOperationType: NewOperationType; displayTitleActions: boolean }
> {
  static state = { newOperationType: 'query', displayTitleActions: false };
  _previousOperationDef:
    | null
    | OperationDefinitionNode
    | ?FragmentDefinitionNode = null;

  _modifySelections = (
    selections: Selections,
    options: null | { commit: boolean },
  ): DocumentNode => {
    let operationDef: FragmentDefinitionNode | OperationDefinitionNode =
      this.props.definition;

    if (
      operationDef.selectionSet.selections.length === 0 &&
      this._previousOperationDef
    ) {
      operationDef = this._previousOperationDef;
    }

    let newOperationDef:
      | null
      | OperationDefinitionNode
      | ?FragmentDefinitionNode = null;

    if (operationDef.kind === Kind.FRAGMENT_DEFINITION) {
      newOperationDef = {
        ...operationDef,
        selectionSet: {
          ...operationDef.selectionSet,
          selections,
        },
      };
    } else if (operationDef.kind === Kind.OPERATION_DEFINITION) {
      let cleanedSelections = selections.filter(selection => {
        return !(
          selection.kind === Kind.FIELD && selection.name.value === '__typename'
        );
      });

      if (cleanedSelections.length === 0) {
        cleanedSelections = [
          {
            kind: Kind.FIELD,
            name: {
              kind: Kind.NAME,
              value: '__typename ## Placeholder value',
            },
          },
        ];
      }

      newOperationDef = {
        ...operationDef,
        selectionSet: {
          ...operationDef.selectionSet,
          selections: cleanedSelections,
        },
      };
    }

    return this.props.onEdit(newOperationDef, options);
  };

  _onOperationRename = event =>
    this.props.onOperationRename(event.target.value);

  _handlePotentialRun = event => {
    if (isRunShortcut(event) && canRunOperation(this.props.definition.kind)) {
      this.props.onRunOperation(this.props.name);
    }
  };

  _rootViewElId = () => {
    const { operationType, name } = this.props;
    const rootViewElId = `${operationType}-${name || 'unknown'}`;
    return rootViewElId;
  };

  componentDidMount() {
    const rootViewElId = this._rootViewElId();

    this.props.onMount(rootViewElId);
  }

  render() {
    const {
      operationType,
      definition,
      schema,
      getDefaultFieldNames,
      styleConfig,
    } = this.props;
    const rootViewElId = this._rootViewElId();

    const fields = this.props.fields || {};
    const operationDef = definition;
    const selections = operationDef.selectionSet.selections;

    const operationDisplayName =
      this.props.name || `${capitalize(operationType)} Name`;

    return (
      <div
        id={rootViewElId}
        tabIndex={0}
        onKeyDown={this._handlePotentialRun}
        style={{
          // The actions bar has its own top border
          borderBottom: this.props.isLast ? 'none' : '1px solid #d6d6d6',
          marginBottom: '0em',
          paddingBottom: '1em',
        }}
      >
        <div
          style={{ color: styleConfig.colors.keyword, paddingBottom: 4 }}
          className="graphiql-operation-title-bar"
          onMouseEnter={() => this.setState({ displayTitleActions: true })}
          onMouseLeave={() => this.setState({ displayTitleActions: false })}
        >
          {operationType}{' '}
          <span style={{ color: styleConfig.colors.def }}>
            <input
              style={{
                color: styleConfig.colors.def,
                border: 'none',
                borderBottom: '1px solid #888',
                outline: 'none',
                width: `${Math.max(4, operationDisplayName.length)}ch`,
              }}
              autoComplete="false"
              placeholder={`${capitalize(operationType)} Name`}
              value={this.props.name}
              onKeyDown={this._handlePotentialRun}
              onChange={this._onOperationRename}
            />
          </span>
          {!!this.props.onTypeName ? (
            <span>
              <br />
              {`on ${this.props.onTypeName}`}
            </span>
          ) : (
            ''
          )}
          {!!this.state.displayTitleActions ? (
            <React.Fragment>
              <button
                type="submit"
                className="toolbar-button"
                onClick={() => this.props.onOperationDestroy()}
                style={{
                  ...styleConfig.styles.actionButtonStyle,
                }}
              >
                <span>{'\u2715'}</span>
              </button>
              <button
                type="submit"
                className="toolbar-button"
                onClick={() => this.props.onOperationClone()}
                style={{
                  ...styleConfig.styles.actionButtonStyle,
                }}
              >
                <span>{'⎘'}</span>
              </button>
            </React.Fragment>
          ) : (
            ''
          )}
        </div>

        {Object.keys(fields)
          .sort()
          .map((fieldName: string) => (
            <FieldView
              key={fieldName}
              field={fields[fieldName]}
              selections={selections}
              modifySelections={this._modifySelections}
              schema={schema}
              getDefaultFieldNames={getDefaultFieldNames}
              getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
              makeDefaultArg={this.props.makeDefaultArg}
              onRunOperation={this.props.onRunOperation}
              styleConfig={this.props.styleConfig}
              onCommit={this.props.onCommit}
              definition={this.props.definition}
              availableFragments={this.props.availableFragments}
            />
          ))}
      </div>
    );
  }
}

function Attribution() {
  return (
    <div
      style={{
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '1em',
        marginTop: 0,
        flexGrow: 1,
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          borderTop: '1px solid #d6d6d6',
          paddingTop: '1em',
          width: '100%',
          textAlign: 'center',
        }}
      >
        GraphiQL Explorer by <a href="https://www.onegraph.com">OneGraph</a>
      </div>
      <div>
        Contribute on{' '}
        <a href="https://github.com/OneGraph/graphiql-explorer">GitHub</a>
      </div>
    </div>
  );
}

class Explorer extends React.PureComponent<Props, State> {
  static defaultProps = {
    getDefaultFieldNames: defaultGetDefaultFieldNames,
    getDefaultScalarArgValue: defaultGetDefaultScalarArgValue,
  };

  static state = {
    newOperationType: 'query',
    operation: null,
    operationToScrollTo: null,
  };

  _ref: null | any;
  _resetScroll = () => {
    const container = this._ref;
    if (container) {
      container.scrollLeft = 0;
    }
  };
  componentDidMount() {
    this._resetScroll();
  }

  _onEdit = (query: string): void => this.props.onEdit(query);

  _setAddOperationType = (value: NewOperationType) => {
    this.setState({ newOperationType: value });
  };

  _handleRootViewMount = (rootViewElId: string) => {
    if (
      !!this.state.operationToScrollTo &&
      this.state.operationToScrollTo === rootViewElId
    ) {
      var selector = `.graphiql-explorer-root #${rootViewElId}`;

      var el = document.querySelector(selector);
      el && el.scrollIntoView();
    }
  };

  render() {
    const { schema, query, makeDefaultArg } = this.props;

    if (!schema) {
      return (
        <div style={{ fontFamily: 'sans-serif' }} className="error-container">
          No Schema Available
        </div>
      );
    }
    const styleConfig = {
      colors: this.props.colors || defaultColors,
      checkboxChecked: this.props.checkboxChecked || defaultCheckboxChecked,
      checkboxUnchecked:
        this.props.checkboxUnchecked || defaultCheckboxUnchecked,
      arrowClosed: this.props.arrowClosed || defaultArrowClosed,
      arrowOpen: this.props.arrowOpen || defaultArrowOpen,
      styles: this.props.styles
        ? {
            ...defaultStyles,
            ...this.props.styles,
          }
        : defaultStyles,
    };
    const queryType = schema.getQueryType();
    const mutationType = schema.getMutationType();
    const subscriptionType = schema.getSubscriptionType();
    if (!queryType && !mutationType && !subscriptionType) {
      return <div>Missing query type</div>;
    }
    const queryFields = queryType && queryType.getFields();
    const mutationFields = mutationType && mutationType.getFields();
    const subscriptionFields = subscriptionType && subscriptionType.getFields();

    const parsedQuery: DocumentNode = memoizeParseQuery(query);
    const getDefaultFieldNames =
      this.props.getDefaultFieldNames || defaultGetDefaultFieldNames;
    const getDefaultScalarArgValue =
      this.props.getDefaultScalarArgValue || defaultGetDefaultScalarArgValue;

    const definitions = parsedQuery.definitions;

    const _relevantOperations = definitions
      .map(definition => {
        if (definition.kind === Kind.FRAGMENT_DEFINITION) {
          return definition;
        } else if (definition.kind === Kind.OPERATION_DEFINITION) {
          return definition;
        } else {
          return null;
        }
      })
      .filter(Boolean);

    const relevantOperations =
      // If we don't have any relevant definitions from the parsed document,
      // then at least show an expanded Query selection
      _relevantOperations.length === 0
        ? DEFAULT_DOCUMENT.definitions
        : _relevantOperations;

    const renameOperation = (targetOperation, name) => {
      const newName =
        name == null || name === ''
          ? null
          : { kind: Kind.NAME, value: name, loc: undefined };
      const newOperation = { ...targetOperation, name: newName };

      const existingDefs = parsedQuery.definitions;

      const newDefinitions = existingDefs.map(existingOperation => {
        if (targetOperation === existingOperation) {
          return newOperation;
        } else {
          return existingOperation;
        }
      });

      return {
        ...parsedQuery,
        definitions: newDefinitions,
      };
    };

    const cloneOperation = (
      targetOperation: OperationDefinitionNode | FragmentDefinitionNode,
    ) => {
      let kind;
      if (targetOperation.kind === Kind.FRAGMENT_DEFINITION) {
        kind = 'fragment';
      } else {
        kind = targetOperation.operation;
      }

      const newOperationName =
        ((targetOperation.name && targetOperation.name.value) || '') + 'Copy';

      const newName = {
        kind: Kind.NAME,
        value: newOperationName,
        loc: undefined,
      };

      const newOperation = { ...targetOperation, name: newName };

      const existingDefs = parsedQuery.definitions;

      const newDefinitions = [...existingDefs, newOperation];

      this.setState({ operationToScrollTo: `${kind}-${newOperationName}` });

      return {
        ...parsedQuery,
        definitions: newDefinitions,
      };
    };

    const destroyOperation = targetOperation => {
      const existingDefs = parsedQuery.definitions;

      const newDefinitions = existingDefs.filter(existingOperation => {
        if (targetOperation === existingOperation) {
          return false;
        } else {
          return true;
        }
      });

      return {
        ...parsedQuery,
        definitions: newDefinitions,
      };
    };

    const addOperation = (kind: NewOperationType) => {
      const existingDefs = parsedQuery.definitions;

      const viewingDefaultOperation =
        parsedQuery.definitions.length === 1 &&
        parsedQuery.definitions[0] === DEFAULT_DOCUMENT.definitions[0];

      const MySiblingDefs = viewingDefaultOperation
        ? []
        : existingDefs.filter(def => {
            if (def.kind === Kind.OPERATION_DEFINITION) {
              return def.operation === kind;
            } else {
              // Don't support adding fragments from explorer
              return false;
            }
          });

      const newOperationName = `My${capitalize(kind)}${
        MySiblingDefs.length === 0 ? '' : MySiblingDefs.length + 1
      }`;

      // Add this as the default field as it guarantees a valid selectionSet
      const firstFieldName = '__typename # Placeholder value';

      const selectionSet = {
        kind: Kind.SELECTION_SET,
        selections: [
          {
            kind: Kind.FIELD,
            name: {
              kind: Kind.NAME,
              value: firstFieldName,
              loc: null,
            },
            arguments: [],
            directives: [],
            selectionSet: null,
            loc: null,
          },
        ],
        loc: null,
      };

      const newDefinition = {
        kind: Kind.OPERATION_DEFINITION,
        operation: kind,
        name: { kind: Kind.NAME, value: newOperationName },
        variableDefinitions: [],
        directives: [],
        selectionSet: selectionSet,
        loc: null,
      };

      const newDefinitions =
        // If we only have our default operation in the document right now, then
        // just replace it with our new definition
        viewingDefaultOperation
          ? [newDefinition]
          : [...parsedQuery.definitions, newDefinition];

      const newOperationDef = {
        ...parsedQuery,
        definitions: newDefinitions,
      } as DocumentNode;

      this.setState({ operationToScrollTo: `${kind}-${newOperationName}` });

      this.props.onEdit(print(newOperationDef));
    };

    const actionsOptions = [];

    if (queryFields) {
      actionsOptions.push(
        <option
          key="query"
          className={'toolbar-button'}
          style={styleConfig.styles.buttonStyle}
          itemType="link"
          value={'query' as NewOperationType}
        >
          Query
        </option>,
      );
    }
    if (mutationFields) {
      actionsOptions.push(
        <option
          key="mutation"
          className={'toolbar-button'}
          style={styleConfig.styles.buttonStyle}
          itemType="link"
          value={'mutation' as NewOperationType}
        >
          Mutation
        </option>,
      );
    }
    if (subscriptionFields) {
      actionsOptions.push(
        <option
          key="subscription"
          className={'toolbar-button'}
          style={styleConfig.styles.buttonStyle}
          itemType="link"
          value={'subscription' as NewOperationType}
        >
          Subscription
        </option>,
      );
    }

    const actionsEl =
      actionsOptions.length === 0 || this.props.hideActions ? null : (
        <div
          style={{
            minHeight: '50px',
            maxHeight: '50px',
            overflow: 'none',
          }}
        >
          <form
            className="variable-editor-title graphiql-explorer-actions"
            style={{
              ...styleConfig.styles.explorerActionsStyle,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              borderTop: '1px solid rgb(214, 214, 214)',
            }}
            onSubmit={event => event.preventDefault()}
          >
            <span
              style={{
                display: 'inline-block',
                flexGrow: '0',
                textAlign: 'right',
              }}
            >
              Add new{' '}
            </span>
            <select
              onChange={event =>
                this._setAddOperationType(
                  event.target.value as NewOperationType,
                )
              }
              value={this.state.newOperationType}
              style={{ flexGrow: '2' }}
            >
              {actionsOptions}
            </select>
            <button
              type="submit"
              className="toolbar-button"
              onClick={() =>
                this.state.newOperationType
                  ? addOperation(this.state.newOperationType)
                  : null
              }
              style={{
                ...styleConfig.styles.buttonStyle,
                height: '22px',
                width: '22px',
              }}
            >
              <span>+</span>
            </button>
          </form>
        </div>
      );

    const externalFragments =
      this.props.externalFragments &&
      this.props.externalFragments.reduce((acc, fragment) => {
        if (fragment.kind === Kind.FRAGMENT_DEFINITION) {
          const fragmentTypeName = fragment.typeCondition.name.value;
          const existingFragmentsForType = acc[fragmentTypeName] || [];
          const newFragmentsForType = [
            ...existingFragmentsForType,
            fragment,
          ].sort((a, b) => a.name.value.localeCompare(b.name.value));
          return {
            ...acc,
            [fragmentTypeName]: newFragmentsForType,
          };
        }

        return acc;
      }, {});

    const documentFragments: AvailableFragments = relevantOperations.reduce(
      (acc, operation) => {
        if (operation.kind === Kind.FRAGMENT_DEFINITION) {
          const fragmentTypeName = operation.typeCondition.name.value;
          const existingFragmentsForType = acc[fragmentTypeName] || [];
          const newFragmentsForType = [
            ...existingFragmentsForType,
            operation,
          ].sort((a, b) => a.name.value.localeCompare(b.name.value));
          return {
            ...acc,
            [fragmentTypeName]: newFragmentsForType,
          };
        }

        return acc;
      },
      {},
    );

    const availableFragments = { ...documentFragments, ...externalFragments };

    const attribution = this.props.showAttribution ? <Attribution /> : null;

    return (
      <div
        ref={ref => {
          this._ref = ref;
        }}
        style={{
          fontSize: 12,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          margin: 0,
          padding: 8,
          fontFamily:
            'Consolas, Inconsolata, "Droid Sans Mono", Monaco, monospace',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
        className="graphiql-explorer-root"
      >
        <div
          style={{
            flexGrow: '1',
            overflow: 'scroll',
          }}
        >
          {relevantOperations.map((operation, index) => {
            const operationName =
              operation && operation.name && operation.name.value;

            const operationType =
              operation.kind === Kind.FRAGMENT_DEFINITION
                ? 'fragment'
                : (operation && operation.operation) || 'query';

            const onOperationRename = newName => {
              const newOperationDef = renameOperation(operation, newName);
              this.props.onEdit(print(newOperationDef));
            };

            const onOperationClone = () => {
              const newOperationDef = cloneOperation(operation);
              this.props.onEdit(print(newOperationDef));
            };

            const onOperationDestroy = () => {
              const newOperationDef = destroyOperation(operation);
              this.props.onEdit(print(newOperationDef));
            };

            const fragmentType =
              operation?.kind === Kind.FRAGMENT_DEFINITION &&
              operation?.typeCondition?.kind === Kind.NAMED_TYPE &&
              schema.getType(operation.typeCondition.name.value);

            const fragmentFields =
              fragmentType instanceof GraphQLObjectType
                ? fragmentType.getFields()
                : null;

            const fields =
              operationType === 'query'
                ? queryFields
                : operationType === 'mutation'
                ? mutationFields
                : operationType === 'subscription'
                ? subscriptionFields
                : operation?.kind === Kind.FRAGMENT_DEFINITION
                ? fragmentFields
                : null;

            const fragmentTypeName =
              operation?.kind === Kind.FRAGMENT_DEFINITION
                ? operation.typeCondition.name.value
                : null;

            const onCommit = (parsedDocument: DocumentNode) => {
              const textualNewDocument = print(parsedDocument);

              this.props.onEdit(textualNewDocument);
            };

            return (
              <RootView
                key={index}
                isLast={index === relevantOperations.length - 1}
                fields={fields}
                operationType={operationType}
                name={operationName}
                definition={operation}
                onOperationRename={onOperationRename}
                onOperationDestroy={onOperationDestroy}
                onOperationClone={onOperationClone}
                onTypeName={fragmentTypeName}
                onMount={this._handleRootViewMount}
                onCommit={onCommit}
                onEdit={(
                  newDefinition: null | DefinitionNode,
                  options: null | { commit: boolean },
                ): DocumentNode => {
                  let commit;
                  if (
                    typeof options === 'object' &&
                    typeof options.commit !== 'undefined'
                  ) {
                    commit = options.commit;
                  } else {
                    commit = true;
                  }

                  if (!!newDefinition) {
                    const newQuery: DocumentNode = {
                      ...parsedQuery,
                      definitions: parsedQuery.definitions.map(
                        existingDefinition =>
                          existingDefinition === operation
                            ? newDefinition
                            : existingDefinition,
                      ),
                    };

                    if (commit) {
                      onCommit(newQuery);
                      return newQuery;
                    } else {
                      return newQuery;
                    }
                  } else {
                    return parsedQuery;
                  }
                }}
                schema={schema}
                getDefaultFieldNames={getDefaultFieldNames}
                getDefaultScalarArgValue={getDefaultScalarArgValue}
                makeDefaultArg={makeDefaultArg}
                onRunOperation={() => {
                  if (!!this.props.onRunOperation) {
                    this.props.onRunOperation(operationName);
                  }
                }}
                styleConfig={styleConfig}
                availableFragments={availableFragments}
              />
            );
          })}
          {attribution}
        </div>

        {actionsEl}
      </div>
    );
  }
}

class ErrorBoundary extends React.Component<
  *,
  { hasError: boolean; error: any; errorInfo: any }
> {
  state = { hasError: false, error: null, errorInfo: null };

  componentDidCatch(error, errorInfo) {
    this.setState({ hasError: true, error: error, errorInfo: errorInfo });
    console.error('Error in component', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 18, fontFamily: 'sans-serif' }}>
          <div>Something went wrong</div>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error ? this.state.error.toString() : null}
            <br />
            {this.state.errorInfo ? this.state.errorInfo.componentStack : null}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

class ExplorerWrapper extends React.PureComponent<Props, {}> {
  static defaultValue = defaultValue;
  static defaultProps = {
    width: 320,
    title: 'Explorer',
  };

  render() {
    return (
      <div
        className="docExplorerWrap"
        style={{
          height: '100%',
          width: this.props.width,
          minWidth: this.props.width,
          zIndex: 7,
          display: this.props.explorerIsOpen ? 'flex' : 'none',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div className="doc-explorer-title-bar">
          <div className="doc-explorer-title">{this.props.title}</div>
          <div className="doc-explorer-rhs">
            <div
              className="docExplorerHide"
              onClick={this.props.onToggleExplorer}
            >
              {'\u2715'}
            </div>
          </div>
        </div>
        <div
          className="doc-explorer-contents"
          style={{
            padding: '0px',
            /* Unset overflowY since docExplorerWrap sets it and it'll
            cause two scrollbars (one for the container and one for the schema tree) */
            overflowY: 'unset',
          }}
        >
          <ErrorBoundary>
            <Explorer {...this.props} />
          </ErrorBoundary>
        </div>
      </div>
    );
  }
}

export default ExplorerWrapper;
