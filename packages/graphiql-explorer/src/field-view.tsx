/* eslint-disable */
// cSpell:disable
import * as React from 'react';

import {
  getNamedType,
  GraphQLObjectType,
  isInputObjectType,
  isInterfaceType,
  isLeafType,
  isObjectType,
  isUnionType,
  Kind,
} from 'graphql';

import type {
  ArgumentNode,
  DocumentNode,
  FieldNode,
  FragmentSpreadNode,
  GraphQLArgument,
  GraphQLSchema,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  SelectionNode,
  SelectionSetNode,
} from 'graphql';

import {
  Field,
  StyleConfig,
  GetDefaultScalarArgValue,
  MakeDefaultArg,
  CommitOptions,
  Selections,
  AvailableFragments,
} from './types';
import {
  defaultInputObjectFields,
  isRequiredArgument,
  unwrapInputType,
  unwrapOutputType,
} from './utils';

import { Checkbox } from './checkbox';
import { FragmentView } from './fragment-view';
import { ArgView } from './arg-view';
import { AbstractView } from './abstract-view';

type FieldViewProps = {
  field: Field;
  selections: Selections;
  modifySelections: (
    selections: Selections,
    commit?: CommitOptions,
  ) => DocumentNode | null;
  schema: GraphQLSchema;
  getDefaultFieldNames: (type: GraphQLObjectType) => Array<string>;
  getDefaultScalarArgValue: GetDefaultScalarArgValue;
  makeDefaultArg: null | MakeDefaultArg;
  onRunOperation: (name: string) => void;
  styleConfig: StyleConfig;
  onCommit: (newDoc: DocumentNode) => void;
  definition: FragmentDefinitionNode | OperationDefinitionNode;
  availableFragments: AvailableFragments;
};

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

export class FieldView extends React.PureComponent<
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
      } as FieldNode,
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
    options?: CommitOptions,
  ): DocumentNode | null => {
    const selection = this._getSelection();
    if (!selection) {
      console.error('Missing selection when setting arguments', argumentNodes);
      return null;
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
    options: CommitOptions,
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
    const args: GraphQLArgument[] = [...field.args].sort((a, b) =>
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

                const conflictingNameCount = (
                  Object.values(applicableFragments) ?? []
                ).filter((fragment: FragmentDefinitionNode) => {
                  return fragment.name.value.startsWith(newFragmentName);
                }).length;

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

                const newDoc = this._modifyChildSelections(nextSelections, {
                  commit: false,
                });

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
                modifyArguments={e => this._setArguments(e)}
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
              ? Object.values(applicableFragments).map(fragment => {
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
                      availableFragments={this.props.availableFragments}
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
