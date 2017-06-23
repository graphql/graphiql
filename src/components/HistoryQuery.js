/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

export default class HistoryQuery extends React.Component {
  static propTypes = {
    favorite: PropTypes.bool,
    favoriteSize: PropTypes.number,
    handleToggleFavorite: PropTypes.func,
    operationName: PropTypes.string,
    onSelect: PropTypes.func,
    query: PropTypes.string,
    variables: PropTypes.string,
  };

  constructor(props) {
    super(props);
    const starVisibility = this.props.favorite ? 'visible' : 'hidden';
    this.state = { starVisibility };
  }

  render() {
    if (this.props.favorite && this.state.starVisibility === 'hidden') {
      this.setState({ starVisibility: 'visible' });
    }
    const starStyles = {
      float: 'right',
      visibility: this.state.starVisibility,
    };
    const displayName =
      this.props.operationName ||
      this.props.query
        .split('\n')
        .filter(line => line.indexOf('#') !== 0)
        .join('');
    const starIcon = this.props.favorite ? '\u2605' : '\u2606';
    return (
      <p
        onClick={this.handleClick.bind(this)}
        onMouseEnter={this.handleMouseEnter.bind(this)}
        onMouseLeave={this.handleMouseLeave.bind(this)}>
        <span>
          {displayName}
        </span>
        <span onClick={this.handleStarClick.bind(this)} style={starStyles}>
          {starIcon}
        </span>
      </p>
    );
  }

  handleMouseEnter() {
    if (!this.props.favorite) {
      this.setState({ starVisibility: 'visible' });
    }
  }

  handleMouseLeave() {
    if (!this.props.favorite) {
      this.setState({ starVisibility: 'hidden' });
    }
  }

  handleClick() {
    this.props.onSelect(
      this.props.query,
      this.props.variables,
      this.props.operationName,
    );
  }

  handleStarClick(e) {
    e.stopPropagation();
    this.props.handleToggleFavorite(
      this.props.query,
      this.props.variables,
      this.props.operationName,
      this.props.favorite,
    );
  }
}
