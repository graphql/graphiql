/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';

import debounce from '../../utility/debounce';

export default class SearchBox extends React.Component {
  static propTypes = {
    isShown: PropTypes.bool,
    onSearch: PropTypes.func,
  }

  constructor(props) {
    super(props);

    this.state = { value: '' };

    this._debouncedOnSearch = debounce(200, () => {
      this.props.onSearch(this.state.value);
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.isShown !== this.props.isShown ||
           nextState.value !== this.state.value;
  }

  render() {
    return (
      <div>
        {
          this.props.isShown &&
          <label className="search-box-outer">
            <input className="search-box-input"
              onChange={this.handleChange}
              type="text"
              value={this.state.value}
              placeholder="Search the schema ..."
            />
          </label>
        }
      </div>
    );
  }

  handleChange = event => {
    this.setState({ value: event.target.value });
    this._debouncedOnSearch();
  }
}
