/* eslint-disable */
// cSpell:disable

import * as React from 'react';

import { GraphQLObjectType, Kind } from 'graphql';

import type {
  DocumentNode,
  GraphQLFieldMap,
  GraphQLSchema,
  FragmentDefinitionNode,
  OperationDefinitionNode,
} from 'graphql';

import { capitalize } from './lib/utils';

import { FieldView } from './field-view';
import {
  StyleConfig,
  GetDefaultScalarArgValue,
  MakeDefaultArg,
  CommitOptions,
  Selections,
  AvailableFragments,
  OperationType,
  NewOperationType,
} from './types';

export type RootViewProps = {
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

function isRunShortcut(event) {
  return event.ctrlKey && event.key === 'Enter';
}

function canRunOperation(operationName) {
  // it does not make sense to try to execute a fragment
  return operationName !== Kind.FRAGMENT_DEFINITION;
}

export class RootView extends React.PureComponent<
  RootViewProps,
  { newOperationType: NewOperationType; displayTitleActions: boolean }
> {
  state = {
    newOperationType: 'query' as NewOperationType,
    displayTitleActions: false,
  };
  _previousOperationDef:
    | null
    | OperationDefinitionNode
    | FragmentDefinitionNode = null;

  _modifySelections = (
    selections: Selections,
    options: CommitOptions,
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
      | FragmentDefinitionNode = null;

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
