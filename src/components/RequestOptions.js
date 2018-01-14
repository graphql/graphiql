import React from 'react';
import PropTypes from 'prop-types';
import StorageAPI from '../utility/StorageAPI';

export class RequestOptions extends React.Component {
  static propTypes = {
    headers: PropTypes.shape({
      Accept: PropTypes.string,
      'Content-Type': PropTypes.string,
    }),
    method: PropTypes.string,
  };

  render() {
    return (
      <div>
        <div className="request-options-title-bar">
          <div className="request-options-title">{'Request options'}</div>
          <div className="doc-explorer-rhs">
            {this.props.children}
          </div>
        </div>
        <div className="request-options-contents">
          <label className="input-container">
            {'Content-Type:'}
            <select
              value={this.props.headers['Content-Type']}
              onChange={this.props.handleChange('headers.Content-Type')}>
              <option>{'application/json'}</option>
              <option>{'application/graphql'}</option>
              <option>{'application/text'}</option>
            </select>
          </label>
          <label className="input-container">
            {'Method:'}
            <select
              onChange={this.props.handleChange('method')}
              value={this.props.method}>
              <option>{'POST'}</option>
              <option>{'GET'}</option>
            </select>
          </label>
        </div>
      </div>
    );
  }
}
