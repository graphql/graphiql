/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

export default class HistoryQuery extends React.Component {
  static propTypes = {
    favorite: PropTypes.bool,
    favoriteSize: PropTypes.number,
    handleEditLabel: PropTypes.func,
    handleToggleFavorite: PropTypes.func,
    operationName: PropTypes.string,
    onSelect: PropTypes.func,
    query: PropTypes.string,
    variables: PropTypes.string,
    label: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {
      editable: false,
    };
  }

  render() {
    const displayName =
      this.props.label ||
      this.props.operationName ||
      this.props.query
        .split('\n')
        .filter(line => line.indexOf('#') !== 0)
        .join('');
    const starIcon = this.props.favorite ? '\u2605' : '\u2606';
    return (
      <li className={this.state.editable ? 'editable' : undefined}>
        {this.state.editable ? (
          <input
            type="text"
            defaultValue={this.props.label}
            ref={c => (this.editField = c)}
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

  editField = null;

  handleClick() {
    this.props.onSelect(
      this.props.query,
      this.props.variables,
      this.props.operationName,
      this.props.label
    );
  }

  handleStarClick(e) {
    e.stopPropagation();
    this.props.handleToggleFavorite(
      this.props.query,
      this.props.variables,
      this.props.operationName,
      this.props.label,
      this.props.favorite
    );
  }

  handleFieldBlur(e) {
    e.stopPropagation();
    this.setState({ editable: false });
    this.props.handleEditLabel(
      this.props.query,
      this.props.variables,
      this.props.operationName,
      e.target.value,
      this.props.favorite
    );
  }

  handleFieldKeyDown(e) {
    if (e.keyCode === 13) {
      e.stopPropagation();
      this.setState({ editable: false });
      this.props.handleEditLabel(
        this.props.query,
        this.props.variables,
        this.props.operationName,
        e.target.value,
        this.props.favorite
      );
    }
  }

  handleEditClick(e) {
    e.stopPropagation();
    this.setState({ editable: true }, () => {
      if (this.editField) {
        this.editField.focus();
      }
    });
  }
}
