/* eslint-disable */
// cSpell:disable

import * as React from 'react';

import { isInputObjectType, isLeafType, Kind } from 'graphql';

import type {
  DocumentNode,
  GraphQLArgument,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  ObjectFieldNode,
  ObjectValueNode,
  VariableDefinitionNode,
  ValueNode,
} from 'graphql';
import {
  GetDefaultScalarArgValue,
  MakeDefaultArg,
  StyleConfig,
  Field,
  CommitOptions,
} from './types';
import { defaultInputObjectFields, unwrapInputType } from './utils';

import { coerceArgValue } from './lib/coerce-arg-value';
import { AbstractArgView } from './abstract-arg-view';

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
  onRunOperation: (name: string) => void;
  styleConfig: StyleConfig;
  onCommit: (newDoc: DocumentNode) => void;
  definition: FragmentDefinitionNode | OperationDefinitionNode;
};

export class InputArgView extends React.PureComponent<InputArgViewProps, {}> {
  private _previousArgSelection?: null | ObjectFieldNode = null;
  _getArgSelection = () => {
    return this.props.selection.fields.find(
      field => field.name.value === this.props.arg.name,
    );
  };

  _removeArg = (commit: boolean): DocumentNode => {
    const { selection } = this.props;
    const argSelection = this._getArgSelection();
    this._previousArgSelection = argSelection;
    return this.props.modifyFields(
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

  _setArgValue = (
    event:
      | VariableDefinitionNode
      | ValueNode
      | React.ChangeEvent<HTMLSelectElement>,
    options?: CommitOptions,
  ) => {
    const kindEvent = 'kind' in event;
    let settingToNull = false;
    let settingToVariable = false;
    let settingToLiteralValue = false;
    try {
      if (kindEvent && event.kind === Kind.VARIABLE_DEFINITION) {
        settingToVariable = true;
      } else if (event === null || typeof event === 'undefined') {
        settingToNull = true;
      } else if (kindEvent && typeof event.kind === 'string') {
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
    } else if (kindEvent) {
      if (event.kind === Kind.VARIABLE_DEFINITION) {
        targetValue = event;
        value = targetValue.variable;
      } else if (event.kind) {
        value = event as ValueNode;
      }
    } else if ('target' in event && typeof event.target.value === 'string') {
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
      options?.commit,
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
        setArgValue={(e, opts) => this._setArgValue(e, { commit: opts })}
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
