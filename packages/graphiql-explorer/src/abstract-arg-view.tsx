/* eslint-disable */
// cSpell:disable
import * as React from 'react';

import {
  isEnumType,
  isInputObjectType,
  isScalarType,
  parseType,
  visit,
  Kind,
  isNamedType,
} from 'graphql';

import type {
  DocumentNode,
  GraphQLArgument,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  ObjectFieldNode,
  VariableDefinitionNode,
  ValueNode,
} from 'graphql';

import { isRequiredArgument, unwrapInputType } from './lib/utils';
import {
  Field,
  GetDefaultScalarArgValue,
  MakeDefaultArg,
  StyleConfig,
} from './types';
import { Checkbox } from './checkbox';
import { InputArgView } from './input-arg-view';

type ScalarInputProps = {
  arg: GraphQLArgument;
  argValue: ValueNode;
  setArgValue: (event, commit: boolean) => DocumentNode | null;
  onRunOperation: (name: string) => void;
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
    const value =
      'value' in argValue && typeof argValue?.value === 'string'
        ? argValue?.value
        : '';
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
    e:
      | React.ChangeEvent<HTMLSelectElement>
      | ValueNode
      | VariableDefinitionNode,
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
  onRunOperation: (name: string) => void;
  styleConfig: StyleConfig;
  definition: FragmentDefinitionNode | OperationDefinitionNode;
};

export class AbstractArgView extends React.PureComponent<
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
              onChange={e => this.props.setArgValue(e, null)}
              value={
                argValue.kind === Kind.BOOLEAN
                  ? argValue.value.toString()
                  : undefined
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
              onChange={e => this.props.setArgValue(e, null)}
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

        variable = {
          ...unwrappedBase,
          defaultValue: cleanedDefaultValue,
        } as VariableDefinitionNode;
      } else {
        variable = base;
      }

      const newlyUnusedVariables = Object.entries(subVariableUsageCountByName)
        // $FlowFixMe: Can't get Object.entries to realize usageCount *must* be a number
        .filter(([_, usageCount]: [string, number]) => usageCount < 2)
        .map(([varName, _]) => varName);

      if (variable) {
        const newDoc = this.props.setArgValue(variable, false);

        if (newDoc) {
          const targetOperation = newDoc.definitions.find(definition => {
            if (
              isNamedType(definition) &&
              isNamedType(this.props.definition) &&
              'operation' in definition
            ) {
              return definition.name.value === this.props.definition.name.value;
            }
            return false;
          }) as OperationDefinitionNode | undefined | null;

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
      if (!('name' in argValue) || !argValue?.name?.value) {
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

      const newDoc: null | DocumentNode = this.props.setArgValue(
        defaultValue,
        false,
      );

      if (newDoc) {
        // @ts-expect-error TODO: more types that return OperationDefintionNode instead of DocumentNode
        const targetOperation: null | OperationDefinitionNode =
          newDoc.definitions.find(
            definition =>
              'name' in definition &&
              definition?.name?.value === this.props.definition?.name?.value,
          );

        if (!targetOperation) {
          return;
        }

        // After de-variabilizing, see if the variable is still in use. If not, remove it.
        let variableUseCount = 0;

        visit(targetOperation, {
          Variable(node) {
            if (node.name.value === variableName) {
              variableUseCount++;
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
