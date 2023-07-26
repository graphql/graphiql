/* eslint-disable */
// cSpell:disable
import * as React from 'react';

import { Kind } from 'graphql';

import type {
  DocumentNode,
  FragmentSpreadNode,
  GraphQLSchema,
  InlineFragmentNode,
  FragmentDefinitionNode,
} from 'graphql';

import { StyleConfig, CommitOptions, Selections } from './types';

import { Checkbox } from './checkbox';

type FragmentViewProps = {
  fragment: FragmentDefinitionNode;
  selections: Selections;
  modifySelections: (
    selections: Selections,
    commit?: CommitOptions,
  ) => DocumentNode | null;
  onCommit: (newDoc: DocumentNode) => void;
  schema: GraphQLSchema;
  styleConfig: StyleConfig;
};

export class FragmentView extends React.PureComponent<FragmentViewProps, {}> {
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
    // @ts-expect-error TODO: bug with InlineFragmentNode = FragmentSpreadNode
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
    // @ts-expect-error TODO: bug with SelectionNode = FragmentSpreadNode
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
