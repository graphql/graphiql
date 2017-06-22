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
    query: PropTypes.string,
    variables: PropTypes.string,
    operationName: PropTypes.string,
    favorite: PropTypes.bool,
    favoriteSize: PropTypes.number,
    onToggleFavorites: PropTypes.func,
    onSelect: PropTypes.func,
  };

  constructor(props) {
    super(props);
    const favorite = this.props.favorite || false;
    const starIcon = this.getStarIcon(favorite);
    this.state = { favorite, starIcon };
  }

  render() {
    const starStyles = {
      float: 'right',
    };
    let displayName;
    if (this.props.operationName) {
      displayName = this.props.operationName;
    } else {
      displayName = this.props.query
        .split('\n')
        .filter(line => line.indexOf('#') !== 0)
        .join('');
    }
    return (
      <div>
        <p onClick={this.handleClick.bind(this)}>
          <span>
            {displayName}
          </span>
          <span onClick={this.handleStarClick.bind(this)} style={starStyles}>
            {this.state.starIcon}
          </span>
        </p>
      </div>
    );
  }

  getStarIcon(isFavorite) {
    return isFavorite ? '\u2605' : '\u2606';
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
    if (this.state.favorite === true) {
      this.setState({
        favorite: false,
        starIcon: this.getStarIcon(false),
      });
    } else if (this.state.favorite === false) {
      this.setState({
        favorite: true,
        starIcon: this.getStarIcon(true),
      });
    }
    this.props.onToggleFavorites(
      this.props.query,
      this.props.variables,
      this.props.operationName,
    );
  }
}
