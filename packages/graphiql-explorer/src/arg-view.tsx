/* eslint-disable */
// cSpell:disable
import * as React from 'react';

import { isInputObjectType, isLeafType, Kind } from 'graphql';

import type {
  ArgumentNode,
  DocumentNode,
  FieldNode,
  GraphQLArgument,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  ObjectFieldNode,
  VariableDefinitionNode,
  ValueNode,
} from 'graphql';

import { AbstractArgView } from './abstract-arg-view';
import {
  Field,
  StyleConfig,
  GetDefaultScalarArgValue,
  MakeDefaultArg,
  CommitOptions,
} from './types';
import { unwrapInputType } from './lib/utils';
import { defaultInputObjectFields } from './lib/defaults';

import { coerceArgValue } from './lib/coerce-arg-value';

type ArgViewState = {};

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
  onRunOperation: (name: string) => void;
  styleConfig: StyleConfig;
  onCommit: (newDoc: DocumentNode) => void;
  definition: FragmentDefinitionNode | OperationDefinitionNode;
};

export class ArgView extends React.PureComponent<ArgViewProps, ArgViewState> {
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
    event:
      | React.ChangeEvent<HTMLSelectElement>
      | VariableDefinitionNode
      | ValueNode,
    options?: CommitOptions,
  ) => {
    let settingToNull = false;
    let settingToVariable = false;
    let settingToLiteralValue = false;
    const nodeEvent = 'kind' in event;
    try {
      if (nodeEvent) {
        if (event.kind === Kind.VARIABLE_DEFINITION) {
          settingToVariable = true;
        }
        if (typeof event.kind === 'string') {
          settingToLiteralValue = true;
        }
      }
      if (event === null || typeof event === 'undefined') {
        settingToNull = true;
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
    } else if ('target' in event && typeof event.target.value === 'string') {
      targetValue = event.target.value;
      value = coerceArgValue(argType, targetValue);
    } else if (
      !('target' in event) &&
      event.kind === Kind.VARIABLE_DEFINITION
    ) {
      targetValue = event;
      value = targetValue.variable;
    } else if (nodeEvent && typeof event.kind === 'string') {
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
      options?.commit,
    );
  };

  _setArgFields = (
    fields: ReadonlyArray<ObjectFieldNode>,
    commit: boolean,
  ): DocumentNode | null => {
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
        setArgValue={e => this._setArgValue(e)}
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
