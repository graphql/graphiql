/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { QueryStoreItem } from '../utility/QueryStore';

export type HandleEditLabelFn = (
  query?: string,
  variables?: string,
  headers?: string,
  operationName?: string,
  label?: string,
  favorite?: boolean,
) => void;

export type HandleToggleFavoriteFn = (
  query?: string,
  variables?: string,
  headers?: string,
  operationName?: string,
  label?: string,
  favorite?: boolean,
) => void;

export type HandleSelectQueryFn = (
  query?: string,
  variables?: string,
  headers?: string,
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
    const displayName =
      this.props.label ||
      this.props.operationName ||
      this.props.query
        ?.split('\n')
        .filter(line => line.indexOf('#') !== 0)
        .join('');
    const starIcon = this.props.favorite ? '\u2605' : '\u2606';
    return (
      <li className={this.state.editable ? 'editable' : undefined}>
        {this.state.editable ? (
          <input
            type="text"
            defaultValue={this.props.label}
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
          className={this.props.favorite ? 'favorited' : undefined}
          onClick={this.handleStarClick.bind(this)}
          aria-label={this.props.favorite ? 'Remove favorite' : 'Add favorite'}>
          {starIcon}
        </button>
      </li>
    );
  }

  handleClick() {
    this.props.onSelect(
      this.props.query,
      this.props.variables,
      this.props.headers,
      this.props.operationName,
      this.props.label,
    );
  }

  handleStarClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    this.props.handleToggleFavorite(
      this.props.query,
      this.props.variables,
      this.props.headers,
      this.props.operationName,
      this.props.label,
      this.props.favorite,
    );
  }

  handleFieldBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.stopPropagation();
    this.setState({ editable: false });
    this.props.handleEditLabel(
      this.props.query,
      this.props.variables,
      this.props.headers,
      this.props.operationName,
      e.target.value,
      this.props.favorite,
    );
  }

  handleFieldKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.keyCode === 13) {
      e.stopPropagation();
      this.setState({ editable: false });
      this.props.handleEditLabel(
        this.props.query,
        this.props.variables,
        this.props.headers,
        this.props.operationName,
        e.currentTarget.value,
        this.props.favorite,
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
