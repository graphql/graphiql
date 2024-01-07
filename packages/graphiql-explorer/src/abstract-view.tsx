/* eslint-disable */
// cSpell:disable
import * as React from 'react';

import { GraphQLObjectType, Kind } from 'graphql';

import type {
  DocumentNode,
  GraphQLSchema,
  InlineFragmentNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
} from 'graphql';

import {
  StyleConfig,
  GetDefaultScalarArgValue,
  MakeDefaultArg,
  CommitOptions,
  Selections,
  AvailableFragments,
} from './types';

import { Checkbox } from './checkbox';
import { FieldView } from './field-view';

type AbstractViewProps = {
  implementingType: GraphQLObjectType;
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
  onCommit: (newDoc: DocumentNode) => void;
  styleConfig: StyleConfig;
  definition: FragmentDefinitionNode | OperationDefinitionNode;
  availableFragments: AvailableFragments;
};

export class AbstractView extends React.PureComponent<AbstractViewProps, {}> {
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
    options: CommitOptions,
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
