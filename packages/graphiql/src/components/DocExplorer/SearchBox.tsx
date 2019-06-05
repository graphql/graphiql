/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import debounce from '../../utility/debounce';

type SearchBoxProps = {
  value?: string;
  placeholder?: string;
  onSearch?: (...args: any[]) => any;
}

type SearchBoxState = {
  value: any;
}
export default class SearchBox extends React.Component<
  SearchBoxProps,
  SearchBoxState
> {
  debouncedOnSearch: Function

  constructor(props) {
    super(props);
    this.state = { value: props.value || '' };
    this.debouncedOnSearch = debounce(200, this.props.onSearch);
  }
  render() {
    return (
      <label className="search-box">
        <input
          value={this.state.value}
          onChange={this.handleChange}
          type="text"
          placeholder={this.props.placeholder}
        />
        {this.state.value && (
          <div className="search-box-clear" onClick={this.handleClear}>
            {'\u2715'}
          </div>
        )}
      </label>
    );
  }
  handleChange = event => {
    const value = event.target.value;
    this.setState({ value });
    this.debouncedOnSearch(value);
  };
  handleClear = () => {
    this.setState({ value: '' });
    this.props.onSearch('');
  };
}
