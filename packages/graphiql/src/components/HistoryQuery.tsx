/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { QueryStoreItem } from 'src/utility/QueryStore';

export type HandleEditLabelFn = (
  query?: string,
  variables?: string,
  operationName?: string,
  label?: string,
  favorite?: boolean,
) => void;

export type HandleToggleFavoriteFn = (
  query?: string,
  variables?: string,
  operationName?: string,
  label?: string,
  favorite?: boolean,
) => void;

export type HandleSelectQueryFn = (
  query?: string,
  variables?: string,
  operationName?: string,
  label?: string,
) => void;

export type HistoryQueryProps = {
  favorite?: boolean;
  favoriteSize?: number;
  handleEditLabel: HandleEditLabelFn;
  handleToggleFavorite: HandleToggleFavoriteFn;
  operationName?: string;
  onSelect: HandleSelectQueryFn;
} & QueryStoreItem;

export default class HistoryQuery extends React.Component<
  HistoryQueryProps,
  { editable: boolean }
> {
  editField: HTMLInputElement | null;
  constructor(props: HistoryQueryProps) {
    super(props);
    this.state = {
      editable: false,
    };
    this.editField = null;
  }

  render() {
    const { favorite, label } = this.props;
    const displayName =
      this.props.label ||
      this.props.operationName ||
      this.props.query
        ?.split('\n')
        .filter(line => line.indexOf('#') !== 0)
        .join('');
    const starIcon = favorite ? '\u2605' : '\u2606';
    return (
      <li className={this.state.editable ? 'editable' : undefined}>
        {this.state.editable ? (
          <input
            type="text"
            defaultValue={label}
            ref={c => {
              this.editField = c;
            }}
            onBlur={this.handleFieldBlur.bind(this)}
            onKeyDown={this.handleFieldKeyDown.bind(this)}
            placeholder="Type a label"
          />
        ) : (
          <button
            className="history-label"
            onClick={this.handleClick.bind(this)}>
            {displayName}
          </button>
        )}
        <button
          onClick={this.handleEditClick.bind(this)}
          aria-label="Edit label">
          {'\u270e'}
        </button>
        <button
          className={favorite ? 'favorited' : undefined}
          onClick={this.handleStarClick.bind(this)}
          aria-label={favorite ? 'Remove favorite' : 'Add favorite'}>
          {starIcon}
        </button>
      </li>
    );
  }

  handleClick() {
    const { query, variables, operationName, label } = this.props;
    this.props.onSelect(query, variables, operationName, label);
  }

  handleStarClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();

    const { query, variables, operationName, label, favorite } = this.props;
    this.props.handleToggleFavorite(
      query,
      variables,
      operationName,
      label,
      favorite,
    );
  }

  handleFieldBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.stopPropagation();
    this.setState({ editable: false });

    const { query, variables, operationName, favorite } = this.props;
    this.props.handleEditLabel(
      query,
      variables,
      operationName,
      e.target.value,
      favorite,
    );
  }

  handleFieldKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.keyCode === 13) {
      e.stopPropagation();
      this.setState({ editable: false });

      const { query, variables, operationName, favorite } = this.props;
      this.props.handleEditLabel(
        query,
        variables,
        operationName,
        e.currentTarget.value,
        favorite,
      );
    }
  }

  handleEditClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    this.setState({ editable: true }, () => {
      if (this.editField) {
        this.editField.focus();
      }
    });
  }
}
